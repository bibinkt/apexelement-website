process.env.FP_TEST_DB='1'; process.env.FP_TEST_SMS='1'; process.env.FP_CALL_CONSENT='1';
const { _testTable } = await import('../lib/fp/db.js');
const { requestConsentAfterCall, handleOnboardingSms } = await import('../lib/fp/onboarding.js');

const MK='+16802032310';
const sent=()=>globalThis.__FP_SENT||[];
const last=()=>sent().at(-1)?.body||'(nothing)';
const reset=()=>{ globalThis.__FP_SENT=[]; };
let pass=0,fail=0;
const check=(label,ok)=>{ console.log((ok?'  \x1b[32m✓':'  \x1b[31m✗')+` ${label}\x1b[0m`); ok?pass++:fail++; };

async function scenario(name, fn){ console.log(`\n\x1b[1m── ${name}\x1b[0m`); _testTable('fp_shops').length=0; _testTable('fp_optouts').length=0; reset(); await fn(); }

await scenario('caller consents', async () => {
  const C='+14075551000';
  const r1=await requestConsentAfterCall({marketingNumber:MK, from:C});
  console.log('   →', last().slice(0,110));
  check('one consent request sent', r1.action==='consent_requested' && sent().length===1);
  check('asks permission before anything else', /may we send you marketing texts/i.test(last()));
  check('carries rates + STOP + HELP', /rates may apply/i.test(last()) && /STOP/.test(last()) && /HELP/.test(last()));
  check('says consent is not a condition of purchase', /not a condition of any purchase/i.test(last()));

  const r2=await handleOnboardingSms({marketingNumber:MK, from:C, body:'YES'});
  console.log('   →', last().slice(0,110));
  check('YES advances to onboarding', r2.action==='consent_granted');
  const shop=_testTable('fp_shops')[0];
  check('consent recorded with timestamp + wording', !!shop.onboarding_data.sms_consent_at && !!shop.onboarding_data.sms_consent_text);
});

await scenario('caller ignores / declines', async () => {
  const C='+14075551001';
  await requestConsentAfterCall({marketingNumber:MK, from:C});
  const before=sent().length;
  const r=await handleOnboardingSms({marketingNumber:MK, from:C, body:'who is this'});
  console.log('   →', last().slice(0,110));
  check('not treated as consent', r.action==='consent_declined');
  check('replies once and stops', sent().length===before+1);
  const r2=await handleOnboardingSms({marketingNumber:MK, from:C, body:'still no'});
  check('does not nag again', r2.action!=='consent_declined' || sent().length<=before+2);
});

await scenario('STOP on the marketing line', async () => {
  const C='+14075551002';
  await requestConsentAfterCall({marketingNumber:MK, from:C});
  const r=await handleOnboardingSms({marketingNumber:MK, from:C, body:'STOP'});
  console.log('   →', last().slice(0,110));
  check('STOP handled', r.action==='stop');
  check('confirmation names the brand', /FrontlinePros/.test(last()));
  check('opt-out recorded', _testTable('fp_optouts').length===1);
  const n=sent().length;
  const r2=await handleOnboardingSms({marketingNumber:MK, from:C, body:'hello again'});
  check('suppressed afterwards', r2.action==='suppressed_opted_out' && sent().length===n);
  const r3=await requestConsentAfterCall({marketingNumber:MK, from:C});
  check('a later call does not re-text them', r3.action==='suppressed_opted_out' && sent().length===n);
});

await scenario('HELP on the marketing line', async () => {
  const C='+14075551003';
  const r=await handleOnboardingSms({marketingNumber:MK, from:C, body:'HELP'});
  console.log('   →', last().slice(0,110));
  check('HELP handled', r.action==='help');
  check('names the brand and a contact', /FrontlinePros/.test(last()) && /@/.test(last()));
});

await scenario('never asks twice', async () => {
  const C='+14075551004';
  await requestConsentAfterCall({marketingNumber:MK, from:C});
  const n=sent().length;
  const r=await requestConsentAfterCall({marketingNumber:MK, from:C});
  check('second call sends nothing', r.action==='already_known' && sent().length===n);
});

console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`);
process.exit(fail?1:0);
