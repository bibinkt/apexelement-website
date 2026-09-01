/**
 * FrontlinePros full test suite.
 *
 * Runs the real chain, the real onboarding and the real guardrails, with the
 * database in memory and SMS captured. Every bug found in review has a
 * regression test here, named after what it broke.
 *
 *   ANTHROPIC_API_KEY=sk-ant-… node scripts/fp-suite.mjs
 *   ANTHROPIC_API_KEY=sk-ant-… node scripts/fp-suite.mjs compliance
 */

process.env.FP_TEST_DB = '1';
process.env.FP_TEST_SMS = '1';
process.env.FP_CALL_CONSENT = '1';

const { insert, _testTable, _testReset } = await import('../lib/fp/db.js');
const { handleInbound, sendOpeningSms, isOptedOut } = await import('../lib/fp/chain.js');
const { handleOnboardingSms, startOnboardingAfterConsent } = await import('../lib/fp/onboarding.js');
const { routeConfidence, assembleCard, isIdentified, CONFIDENCE_THRESHOLD } = await import('../lib/fp/jobcard.js');
const { missingFields } = await import('../lib/fp/claude.js');
const { getTrade, triageFor, escalationSms } = await import('../lib/fp/trades.js');
const { e164, prettyPhone } = await import('../lib/fp/twilio.js');

const C = { g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`,
            d: (s) => `\x1b[2m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`,
            y: (s) => `\x1b[33m${s}\x1b[0m` };

const CALLER = '+18135550123';
const OWNER = '+18133178178';
const LINE = '+16802032310';
const MKT = '+15735313742';

let pass = 0, fail = 0, group = '';
const failures = [];
function ok(label, cond, detail) {
  if (cond) { pass++; console.log('  ' + C.g('✓') + ' ' + label); }
  else { fail++; failures.push(`${group} → ${label}${detail ? ` (${detail})` : ''}`);
         console.log('  ' + C.r('✗ ' + label) + (detail ? C.d(`  ${detail}`) : '')); }
}
const sent = () => globalThis.__FP_SENT || [];
const toCaller = () => sent().filter((m) => m.to === CALLER).map((m) => m.body);
const toOwner = () => sent().filter((m) => m.to === OWNER).map((m) => m.body);
const last = (a) => a.at(-1) || '';

async function shopFixture(trade = 'appliance', extra = {}) {
  _testReset();
  globalThis.__FP_SENT = [];
  return insert('fp_shops', {
    id: 'shop-1', business_name: 'Ace Appliance', trade_id: trade,
    owner_phone: OWNER, assigned_number: LINE, status: 'active',
    timezone: 'America/New_York', ...extra,
  });
}
const say = (shop, body, media) =>
  handleInbound({ shop, from: CALLER, body, mediaUrl: media || null, mediaType: 'image/jpeg' });

const SUITES = {};
const suite = (name, fn) => { SUITES[name] = fn; };

// ── pure logic: no model, no network ────────────────────────
suite('units', async () => {
  ok('e164 adds +1 to a 10-digit number', e164('8135550123') === '+18135550123');
  ok('e164 keeps an existing +', e164('+18135550123') === '+18135550123');
  ok('e164 handles 11 digits', e164('18135550123') === '+18135550123');
  ok('e164 strips formatting', e164('(813) 555-0123') === '+18135550123');
  ok('e164 tolerates empty', e164('') === '');
  ok('prettyPhone formats', prettyPhone('+18135550123') === '(813) 555-0123');

  const trade = getTrade('appliance');
  ok('unknown trade falls back rather than throwing', getTrade('nonsense').trade_id === 'appliance');
  ok('triage bank falls back to unknown', triageFor(trade, 'nonexistent').length > 0);
  ok('escalation names the shop', escalationSms({ business_name: 'Ace' }).includes('Ace'));
  ok('escalation points at 911', escalationSms({ business_name: 'Ace' }).includes('911'));

  // L3 — the confidence router
  const high = routeConfidence({
    image_usable: true, multiple_plates_visible: false,
    brand: { value: 'Whirlpool', confidence: 0.95, evidence: 'top line' },
    equipment_type: { value: 'refrigerator', confidence: 0.9, evidence: 'x' },
    model_number: { value: 'WRF535SWHZ04', confidence: 0.92, evidence: 'x' },
    serial_number: { value: 'HRB4102877', confidence: 0.88, evidence: 'x' },
    error_code: { value: 'unknown', confidence: 0, evidence: '' }, notes: '',
  });
  ok('confident fields are kept', high.fields.model_number.value === 'WRF535SWHZ04');
  ok('confident fields are marked verified', high.fields.model_number.provenance === 'verified_from_photo');
  ok('a confident read needs no re-shoot', high.needsReshoot === false);
  ok('absent field stays unknown', high.fields.error_code.value === 'unknown');

  const low = routeConfidence({
    image_usable: true, multiple_plates_visible: false,
    brand: { value: 'Whirlpool', confidence: 0.95, evidence: 'x' },
    equipment_type: { value: 'unknown', confidence: 0, evidence: '' },
    model_number: { value: 'WRF535SW', confidence: 0.62, evidence: 'blurred' },
    serial_number: { value: 'unknown', confidence: 0, evidence: '' },
    error_code: { value: 'unknown', confidence: 0, evidence: '' }, notes: '',
  });
  ok(`below ${CONFIDENCE_THRESHOLD} is overwritten to unknown`, low.fields.model_number.value === 'unknown');
  ok('a low-confidence read is marked unreadable', low.fields.model_number.provenance === 'unreadable');
  ok('a partial model number triggers a re-shoot', low.needsReshoot === true);
  ok('the model number is never completed from memory', low.fields.model_number.value !== 'WRF535SWHZ04');

  const multi = routeConfidence({
    image_usable: true, multiple_plates_visible: true,
    brand: { value: 'Whirlpool', confidence: 0.99, evidence: 'x' },
    equipment_type: { value: 'refrigerator', confidence: 0.99, evidence: 'x' },
    model_number: { value: 'ABC123', confidence: 0.99, evidence: 'x' },
    serial_number: { value: 'X1', confidence: 0.99, evidence: 'x' },
    error_code: { value: 'unknown', confidence: 0, evidence: '' }, notes: '',
  });
  ok('two plates in frame forces a re-shoot', multi.needsReshoot === true);

  const none = routeConfidence(null);
  ok('a failed vision call does not crash', none.fields.model_number.value === 'unknown');
  ok('a failed vision call asks for another photo', none.needsReshoot === true);
  ok('isIdentified is false without a verified model', isIdentified(none.fields) === false);
  ok('isIdentified is true with one', isIdentified(high.fields) === true);

  // L5 — the card
  const card = assembleCard({
    shop: { business_name: 'Ace Appliance', timezone: 'America/New_York' },
    conversation: { caller_phone: CALLER }, fields: low.fields,
    complaint: 'fridge not cooling', question: 'Breaker on?', answer: 'yes',
    address: '2118 W Sligh Ave', duration: '3 days', stillRunning: 'hums', availability: 'afternoons',
  });
  ok('card names the shop', card.includes('Ace Appliance'));
  ok('card carries provenance', card.includes('[unreadable]'));
  ok('card carries the NOT DIAGNOSED warning', card.includes('NOT DIAGNOSED'));
  ok('card quotes the customer verbatim', card.includes('fridge not cooling'));
  ok('card carries duration', card.includes('3 days'));
  ok('card carries availability', card.includes('afternoons'));
  ok('card marks the address unverified', card.includes('customer-stated'));
  ok('card never invents a model number', !card.includes('WRF535SWHZ04'));

  // checklist
  ok('empty state wants the symptom first', missingFields({}).at(0) === 'symptom');
  ok('a known symptom moves to duration', missingFields({ complaint: 'x' }).at(0) === 'duration');
  ok('asked optional fields drop off the list',
     !missingFields({ complaint: 'a', duration: 'b', still_running: 'c',
                      asset_capture: 'declined', asked: ['address', 'availability'] }).includes('address'));
});

// ── carrier compliance ──────────────────────────────────────
suite('compliance', async () => {
  const shop = await shopFixture();
  await sendOpeningSms(shop, CALLER, 'CA1');
  ok('first message names the business', toCaller()[0].startsWith('Ace Appliance:'));
  ok('first message carries STOP', /STOP/.test(toCaller()[0]));
  ok('first message carries HELP', /HELP/.test(toCaller()[0]));
  ok('first message carries the rates line', /rates may apply/i.test(toCaller()[0]));
  ok('first message avoids "what is it doing"', !/what is it doing/i.test(toCaller()[0]));
  ok('first message makes no promise of a callback', !/get back to you|call you back/i.test(toCaller()[0]));

  for (const word of ['STOP', 'stop', 'Stop', 'UNSUBSCRIBE', 'cancel', 'QUIT', 'END', 'optout', 'revoke']) {
    const s2 = await shopFixture();
    await sendOpeningSms(s2, CALLER, 'CA');
    const r = await say(s2, word);
    ok(`"${word}" opts out`, r.action === 'stop');
  }
  const s3 = await shopFixture();
  await sendOpeningSms(s3, CALLER, 'CA');
  await say(s3, 'STOP');
  ok('opt-out is recorded', _testTable('fp_optouts').length === 1);
  const n = sent().length;
  ok('an opted-out number is suppressed', (await say(s3, 'hello')).action === 'suppressed_opted_out');
  ok('nothing is sent after STOP', sent().length === n);

  // REGRESSION: a global opt-out (shop_id null) must be honoured by a shop
  const s4 = await shopFixture();
  _testTable('fp_optouts').push({ shop_id: null, phone: CALLER });
  ok('a global opt-out is honoured by every shop', (await isOptedOut(s4.id, CALLER)) === true);
  const before = sent().length;
  await sendOpeningSms(s4, CALLER, 'CA');
  ok('a globally opted-out caller is never texted', sent().length === before);

  const s5 = await shopFixture();
  await sendOpeningSms(s5, CALLER, 'CA');
  const h = await say(s5, 'HELP');
  ok('HELP is answered', h.action === 'help');
  ok('HELP names the brand', /FrontlinePros/.test(last(toCaller())));
  ok('HELP gives a contact', /@/.test(last(toCaller())));

  const s6 = await shopFixture();
  const noSess = await say(s6, 'hello anyone there');
  ok('a text with no session is forwarded not dropped', noSess.action === 'forwarded_no_session');
  ok('the owner receives it', toOwner().length === 1);
});

// ── safety ──────────────────────────────────────────────────
suite('safety', async () => {
  for (const [trade, phrase] of [
    ['appliance', 'I can smell gas behind the stove'],
    ['appliance', 'there is smoke coming out of it'],
    ['hvac', 'the co alarm is going off'],
    ['plumbing', 'water everywhere, flooding the kitchen'],
  ]) {
    const shop = await shopFixture(trade);
    await sendOpeningSms(shop, CALLER, 'CA');
    const r = await say(shop, phrase);
    ok(`${trade}: "${phrase.slice(0, 28)}…" escalates`, r.action === 'hazard');
    ok('  customer told to call a person', /call us directly/i.test(last(toCaller())));
    ok('  911 mentioned', /911/.test(last(toCaller())));
    ok('  owner paged', toOwner().some((m) => /HAZARD/i.test(m)));
  }
  const shop = await shopFixture();
  await sendOpeningSms(shop, CALLER, 'CA');
  const benign = await say(shop, 'my water heater is broken and I need it fixed');
  ok('a broken water heater is NOT a hazard', benign.action !== 'hazard');
});

// ── the intake conversation ─────────────────────────────────
suite('intake', async () => {
  const shop = await shopFixture();
  await sendOpeningSms(shop, CALLER, 'CA');
  await say(shop, 'my fridge is buzzing loudly and its not cold');
  await say(shop, 'about 3 days now, it still hums');
  await say(shop, 'i cant find the sticker anywhere sorry');
  await say(shop, 'door seals fine and the breaker is on');
  const r = await say(shop, '2118 W Sligh Ave Tampa, home most afternoons');

  const conv = _testTable('fp_conversations')[0];
  const card = _testTable('fp_jobcards')[0];
  ok('the conversation reaches a job card', r.action === 'carded', r.action);
  ok('a card exists', !!card);
  ok('the symptom was captured', !!conv.state.complaint);
  ok('the duration was captured', !!conv.state.duration, conv.state.duration);
  ok('whether it runs was captured', !!conv.state.still_running);
  ok('a declined photo was registered', conv.state.asset_capture === 'declined');
  ok('a screening question was asked', !!conv.state.question);
  ok('the screening answer was stored', !!conv.state.answer);
  // REGRESSION: the card used to close before the address arrived
  ok('the address reached the card', !!conv.state.address, conv.state.address);
  ok('availability reached the card', !!conv.state.availability);
  ok('the card includes the address', card && card.card_text.includes('Sligh'));
  ok('the owner got the job card', toOwner().some((m) => /new job/i.test(m)));

  const msgs = toCaller();
  ok('never quoted a price', !msgs.some((m) => /\$\d|\bcosts? \d/i.test(m)));
  ok('never promised a time', !msgs.some((m) => /\b(today|tomorrow|within the hour|this afternoon)\b/i.test(m)));
  ok('never proposed a fix', !msgs.some((m) => /you should (try|replace|check the compressor)/i.test(m)));
  ok('never diagnosed', !msgs.some((m) => /it('?s| is) (probably|likely|definitely) the/i.test(m)));
  const asks = msgs.filter((m) => /service address/i.test(m));
  ok('the address was asked at most once', asks.length <= 1, `asked ${asks.length}×`);
});

// ── onboarding ──────────────────────────────────────────────
suite('onboarding', async () => {
  _testReset(); globalThis.__FP_SENT = [];
  const r = await startOnboardingAfterConsent({ marketingNumber: MKT, from: '+18135551000', callSid: 'CA9' });
  ok('a keypress starts onboarding', r.action === 'onboarding_started');
  ok('exactly one message is sent', sent().length === 1);
  ok('it carries STOP and HELP', /STOP/.test(last(sent().map((m) => m.body))) && /HELP/.test(last(sent().map((m) => m.body))));
  const shop = _testTable('fp_shops')[0];
  ok('consent is logged with the call sid', shop.onboarding_data.voice_consent_call_sid === 'CA9');
  ok('consent is timestamped', !!shop.onboarding_data.voice_consent_at);

  const n = sent().length;
  const again = await startOnboardingAfterConsent({ marketingNumber: MKT, from: '+18135551000', callSid: 'CA10' });
  ok('a second call does not restart them', again.action === 'already_known');
  ok('and sends nothing', sent().length === n);

  const st = await handleOnboardingSms({ marketingNumber: MKT, from: '+18135551000', body: 'STOP' });
  ok('STOP works on the onboarding line', st.action === 'stop');
  ok('the opt-out is recorded', _testTable('fp_optouts').length === 1);
  // REGRESSION: someone who texts STOP before any shop record exists produced
  // a row with shop_id null, which the composite primary key rejected — so the
  // opt-out silently vanished in production while the in-memory test passed.
  _testReset(); globalThis.__FP_SENT = [];
  const cold = await handleOnboardingSms({ marketingNumber: MKT, from: '+18135553000', body: 'STOP' });
  ok('STOP from an unknown number is handled', cold.action === 'stop');
  const row = _testTable('fp_optouts')[0];
  ok('it records an opt-out with no shop attached', !!row && !row.shop_id);
  ok('and that number is then suppressed',
     (await handleOnboardingSms({ marketingNumber: MKT, from: '+18135553000', body: 'hi' })).action === 'suppressed_opted_out');

  // rebuild the earlier fixture for the checks that follow
  _testReset(); globalThis.__FP_SENT = [];
  await startOnboardingAfterConsent({ marketingNumber: MKT, from: '+18135551000', callSid: 'CA9' });
  await handleOnboardingSms({ marketingNumber: MKT, from: '+18135551000', body: 'STOP' });

  const m = sent().length;
  const after = await handleOnboardingSms({ marketingNumber: MKT, from: '+18135551000', body: 'hello' });
  ok('they are suppressed afterwards', after.action === 'suppressed_opted_out');
  ok('and nothing more is sent', sent().length === m);
  const recall = await startOnboardingAfterConsent({ marketingNumber: MKT, from: '+18135551000', callSid: 'CA11' });
  ok('a later call does not re-text an opted-out owner', recall.action === 'suppressed_opted_out');

  const hp = await handleOnboardingSms({ marketingNumber: MKT, from: '+18135552000', body: 'HELP' });
  ok('HELP works on the onboarding line', hp.action === 'help');
});

// ── runner ──────────────────────────────────────────────────
const want = process.argv.slice(2);
const names = want.length ? want : Object.keys(SUITES);
for (const n of names) {
  if (!SUITES[n]) { console.log(C.r(`unknown suite: ${n}`)); continue; }
  group = n;
  console.log('\n' + C.b(`══ ${n} ` + '═'.repeat(Math.max(0, 50 - n.length))));
  try { await SUITES[n](); }
  catch (e) { fail++; failures.push(`${n} → threw: ${e.message}`); console.log(C.r(`  ✗ threw: ${e.message}`)); }
}

console.log('\n' + C.b(`${pass} passed, ${fail} failed`));
if (failures.length) { console.log(C.y('\nfailures:')); failures.forEach((f) => console.log('  · ' + f)); }
process.exit(fail ? 1 : 0);
