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
const { looksOutOfTrade, guessTrade, offerText, noMatchText } = await import('../lib/fp/referral.js');
const { setSetting, clearSettingsCache } = await import('../lib/fp/settings.js');
const { update } = await import('../lib/fp/db.js');

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

// ── out-of-trade and referral ───────────────────────────────
suite('referral', async () => {
  // ---- pure logic, no model, no network ----
  const applianceShop = { trade_id: 'appliance', business_name: 'Ace Appliance' };
  const hvacShop = { trade_id: 'hvac', business_name: 'Cool Air' };
  const plumbShop = { trade_id: 'plumbing', business_name: 'Tampa Pipes' };

  ok('a thermostat is not appliance work',
     looksOutOfTrade(applianceShop, 'my thermostat is blank') === 'hvac');
  ok('a fridge is appliance work',
     looksOutOfTrade(applianceShop, 'my fridge stopped getting cold') === null);
  ok('a blocked toilet is not appliance work',
     looksOutOfTrade(applianceShop, 'the toilet is completely blocked') === 'plumbing');
  // REGRESSION: HVAC firms fit water heaters, and "water heater" reads as
  // plumbing on a word list. The shop's own equipment list has to win.
  ok('a water heater is in scope for an HVAC shop',
     looksOutOfTrade(hvacShop, 'no hot water from the water heater') === null);
  ok('a water heater is in scope for a plumber',
     looksOutOfTrade(plumbShop, 'no hot water from the water heater') === null);
  ok('a furnace is out of scope for a plumber',
     looksOutOfTrade(plumbShop, 'the furnace wont light') === 'hvac');
  // Ambiguity must never trigger a referral.
  ok('an equal tie is treated as unclear',
     looksOutOfTrade(applianceShop, 'the dryer vent and the furnace both smell odd') === null);
  ok('a vague message is left alone',
     looksOutOfTrade(applianceShop, 'its broken and i need someone out') === null);
  ok('an empty message is left alone', looksOutOfTrade(applianceShop, '') === null);
  ok('guessTrade returns null on nothing recognisable', guessTrade('hello there') === null);

  // REGRESSION: substring matching found "range" inside "arrangement", "ac"
  // inside "back" and "shower" inside nothing useful. Every false positive here
  // is a paying customer told their job is not this shop's work.
  for (const [shop, text, expect] of [
    [applianceShop, 'the AC is blowing warm air', 'hvac'],
    [applianceShop, 'my a/c unit is dead', 'hvac'],
    [applianceShop, 'air conditioner not cooling', 'hvac'],
    [applianceShop, 'the toilet keeps running', 'plumbing'],
    [applianceShop, 'we need to make an arrangement for tuesday', null],
    [applianceShop, 'i want to backup my washer', null],
    [applianceShop, 'call me back please', null],
    [applianceShop, 'my range hood fan died', null],
    [applianceShop, 'my oven wont heat', null],
    [applianceShop, 'my dryer wont heat', null],
    [hvacShop, 'the thermostat is blank', null],
    [plumbShop, 'toilet overflowing', null],
  ]) {
    ok(`"${text}" → ${expect || 'in scope'}`, looksOutOfTrade(shop, text) === expect,
       String(looksOutOfTrade(shop, text)));
  }

  // ---- the offer text never names the other shop, and never recommends ----
  const offer = offerText({ business_name: 'Ace Appliance', trade_id: 'appliance' }, 'hvac');
  ok('the offer asks rather than recommends', /would you like us to pass/i.test(offer));
  ok('the offer carries an opt-out', /reply stop/i.test(offer));
  ok('the offer names no third party', !/\b(Cool Air|Tampa Pipes)\b/.test(offer));
  const nomatch = noMatchText({ business_name: 'Ace Appliance', trade_id: 'appliance' }, 'hvac');
  ok('with nobody to refer to we say so plainly', /outside what we can help with/i.test(nomatch));
  ok('and still carry an opt-out', /reply stop/i.test(nomatch));

  // ---- live chain: referrals OFF (the shipped default) ----
  let shop = await shopFixture('appliance');
  clearSettingsCache();
  await sendOpeningSms(shop, CALLER, 'CA');
  let r = await say(shop, 'my thermostat is completely blank, no display at all');
  ok('an out-of-trade call stops the intake', r.action === 'out_of_scope', r.action);
  ok('we never asked for a data plate',
     !toCaller().some((m) => /data plate|sticker|photo/i.test(m)));
  ok('the customer is told plainly', /outside what we can help with/i.test(last(toCaller())));
  ok('the owner is told a call came in', toOwner().some((m) => /not your trade/i.test(m)));
  ok('the owner note is not quoted as the customer speaking',
     !toOwner().some((m) => /text from .*Not your trade/is.test(m)));
  let conv = _testTable('fp_conversations')[0];
  ok('the conversation is closed', conv.status === 'out_of_scope');
  ok('no job card was created', _testTable('fp_jobcards').length === 0);

  // ---- referrals ON, but nobody has opted in ----
  shop = await shopFixture('appliance');
  clearSettingsCache();
  await setSetting('guardrails', { referrals_enabled: true });
  await insert('fp_shops', {
    id: 'shop-2', business_name: 'Cool Air', trade_id: 'hvac',
    owner_phone: '+18135559000', assigned_number: '+16805550000',
    status: 'active', subscription_status: 'active', referrals_ok: false,
  });
  await sendOpeningSms(shop, CALLER, 'CA');
  r = await say(shop, 'my thermostat is completely blank, no display at all');
  ok('a shop that has not opted in is never used', r.action === 'out_of_scope', r.action);

  // ---- referrals ON with an eligible shop: the customer declines ----
  shop = await shopFixture('appliance');
  clearSettingsCache();
  await setSetting('guardrails', { referrals_enabled: true });
  const other = await insert('fp_shops', {
    id: 'shop-2', business_name: 'Cool Air', trade_id: 'hvac',
    owner_phone: '+18135559000', assigned_number: '+16805550000',
    status: 'active', subscription_status: 'active', referrals_ok: true,
  });
  await sendOpeningSms(shop, CALLER, 'CA');
  r = await say(shop, 'my thermostat is completely blank, no display at all');
  ok('an introduction is offered', r.action === 'referral_offered', r.action);
  ok('the offer went to the customer', /would you like us to pass/i.test(last(toCaller())));
  r = await say(shop, 'no thanks');
  ok('a no is honoured', r.action === 'referral_declined', r.action);
  ok('nothing was passed on', _testTable('fp_jobcards').length === 0);
  ok('we say so to the customer', /haven.t passed your details/i.test(last(toCaller())));

  // ---- silence and hedging are not consent ----
  for (const reply of ['maybe', 'who are they', 'i dont know', 'stop asking']) {
    shop = await shopFixture('appliance');
    clearSettingsCache();
    await setSetting('guardrails', { referrals_enabled: true });
    await insert('fp_shops', { ...other, id: 'shop-2' });
    await sendOpeningSms(shop, CALLER, 'CA');
    await say(shop, 'my thermostat is completely blank, no display at all');
    const out = await say(shop, reply);
    ok(`"${reply}" is not treated as consent`, out.action === 'referral_declined', out.action);
  }

  // ---- the customer accepts ----
  shop = await shopFixture('appliance');
  clearSettingsCache();
  await setSetting('guardrails', { referrals_enabled: true });
  await insert('fp_shops', { ...other, id: 'shop-2' });
  await sendOpeningSms(shop, CALLER, 'CA');
  await say(shop, 'my thermostat is completely blank, no display at all');
  r = await say(shop, 'yes please');
  ok('a yes creates the introduction', r.action === 'referred', r.action);
  const card = _testTable('fp_jobcards')[0];
  ok('the card belongs to the receiving shop', card && card.shop_id === 'shop-2');
  ok('the card is marked as an introduction', card && /INTRODUCTION/.test(card.card_text));
  ok('the card names who passed it on', card && /Ace Appliance/.test(card.card_text));
  ok('the card carries the not-diagnosed warning', card && /NOT DIAGNOSED/.test(card.card_text));
  ok('the card is not marked identified', card && card.identified === false);
  ok('the receiving owner is texted on their own line',
     sent().some((m) => m.to === '+18135559000' && m.from === '+16805550000'));
  conv = _testTable('fp_conversations')[0];
  ok('the conversation records where it went', conv.state.referred_to === 'shop-2');
  ok('the conversation is closed as referred', conv.status === 'referred');

  // ---- REGRESSION: "yes" must not be read as a resubscribe keyword ----
  ok('a yes to the offer did not clear the opt-out table',
     _testTable('fp_optouts').length === 0);
  ok('and did not send the resubscribe text',
     !toCaller().some((m) => /opted back in/i.test(m)));

  // ---- STOP always wins, even mid-offer ----
  shop = await shopFixture('appliance');
  clearSettingsCache();
  await setSetting('guardrails', { referrals_enabled: true });
  await insert('fp_shops', { ...other, id: 'shop-2' });
  await sendOpeningSms(shop, CALLER, 'CA');
  await say(shop, 'my thermostat is completely blank, no display at all');
  r = await say(shop, 'STOP');
  ok('STOP outranks an outstanding offer', r.action === 'stop', r.action);
  ok('no introduction was made', _testTable('fp_jobcards').length === 0);
  ok('the opt-out is recorded', await isOptedOut(shop.id, CALLER));

  // ---- the receiving shop drops out between offer and answer ----
  shop = await shopFixture('appliance');
  clearSettingsCache();
  await setSetting('guardrails', { referrals_enabled: true });
  await insert('fp_shops', { ...other, id: 'shop-2' });
  await sendOpeningSms(shop, CALLER, 'CA');
  await say(shop, 'my thermostat is completely blank, no display at all');
  await update('fp_shops', 'id=eq.shop-2', { subscription_status: 'canceled' });
  r = await say(shop, 'yes');
  ok('a lapsed shop never receives details', r.action === 'referral_unavailable', r.action);
  ok('and no card was written', _testTable('fp_jobcards').length === 0);

  // ---- a hazard outranks scope ----
  shop = await shopFixture('appliance');
  clearSettingsCache();
  await setSetting('guardrails', { referrals_enabled: true });
  await insert('fp_shops', { ...other, id: 'shop-2' });
  await sendOpeningSms(shop, CALLER, 'CA');
  r = await say(shop, 'i can smell gas near the furnace');
  ok('a hazard is handled before scope', r.action === 'hazard', r.action);
  ok('no referral was offered on a hazard', _testTable('fp_conversations')[0].status === 'hazard');

  // ---- an in-trade call is untouched by any of this ----
  shop = await shopFixture('appliance');
  clearSettingsCache();
  await setSetting('guardrails', { referrals_enabled: true });
  await insert('fp_shops', { ...other, id: 'shop-2' });
  await sendOpeningSms(shop, CALLER, 'CA');
  r = await say(shop, 'my dishwasher wont drain, water sitting in the bottom');
  ok('normal work still runs the intake', r.action === 'dialogue', r.action);
  ok('and nothing was referred', _testTable('fp_jobcards').length === 0);

  clearSettingsCache();
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
