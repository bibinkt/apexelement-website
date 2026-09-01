process.env.FP_TEST_DB='1'; process.env.FP_TEST_SMS='1'; process.env.FP_CALL_CONSENT='1';
const { _testTable } = await import('../lib/fp/db.js');
const { startOnboardingAfterConsent, handleOnboardingSms } = await import('../lib/fp/onboarding.js');

const MK='+16802032310';
const sent=()=>globalThis.__FP_SENT||[];
const last=()=>sent().at(-1)?.body||'(nothing)';
let pass=0,fail=0;
const check=(l,ok)=>{ console.log((ok?'  \x1b[32m✓':'  \x1b[31m✗')+` ${l}\x1b[0m`); ok?pass++:fail++; };
async function sc(n,fn){ console.log(`\n\x1b[1m── ${n}\x1b[0m`); _testTable('fp_shops').length=0; _testTable('fp_optouts').length=0; globalThis.__FP_SENT=[]; await fn(); }

await sc('caller presses 1', async () => {
  const C='+14075551000';
  const r=await startOnboardingAfterConsent({marketingNumber:MK, from:C, callSid:'CA1'});
  console.log('   →', last().slice(0,120));
  check('onboarding starts', r.action==='onboarding_started');
  check('exactly one text sent', sent().length===1);
  check('carries rates, STOP and HELP', /rates may apply/i.test(last()) && /STOP/.test(last()) && /HELP/.test(last()));
  const shop=_testTable('fp_shops')[0];
  check('keypress consent logged with call sid',
        shop.onboarding_data.voice_consent_method==='dtmf_1_on_inbound_call' &&
        shop.onboarding_data.voice_consent_call_sid==='CA1' &&
        !!shop.onboarding_data.voice_consent_at);
});

await sc('caller does not press 1', async () => {
  // The consent route simply never calls into onboarding, so nothing happens.
  check('no shop created', _testTable('fp_shops').length===0);
  check('no text sent', sent().length===0);
});

await sc('opted-out caller rings again', async () => {
  const C='+14075551002';
  _testTable('fp_optouts').push({shop_id:null, phone:C});
  const r=await startOnboardingAfterConsent({marketingNumber:MK, from:C, callSid:'CA2'});
  check('suppressed even though they pressed 1', r.action==='suppressed_opted_out');
  check('nothing sent', sent().length===0);
});

await sc('STOP still works on the marketing line', async () => {
  const C='+14075551003';
  await startOnboardingAfterConsent({marketingNumber:MK, from:C, callSid:'CA3'});
  const r=await handleOnboardingSms({marketingNumber:MK, from:C, body:'STOP'});
  console.log('   →', last().slice(0,110));
  check('STOP handled', r.action==='stop');
  check('opt-out recorded', _testTable('fp_optouts').length===1);
  const n=sent().length;
  const r2=await handleOnboardingSms({marketingNumber:MK, from:C, body:'hello'});
  check('suppressed afterwards', r2.action==='suppressed_opted_out' && sent().length===n);
});

await sc('HELP works', async () => {
  const r=await handleOnboardingSms({marketingNumber:MK, from:'+14075551004', body:'HELP'});
  check('HELP handled', r.action==='help');
  check('names brand + contact', /FrontlinePros/.test(last()) && /@/.test(last()));
});

await sc('repeat caller is not restarted', async () => {
  const C='+14075551005';
  await startOnboardingAfterConsent({marketingNumber:MK, from:C, callSid:'CA4'});
  await handleOnboardingSms({marketingNumber:MK, from:C, body:'NONE'});
  const n=sent().length;
  const r=await startOnboardingAfterConsent({marketingNumber:MK, from:C, callSid:'CA5'});
  check('not restarted mid-flow', r.action==='already_known');
  check('no duplicate opener', sent().length===n);
  const shop=_testTable('fp_shops')[0];
  check('fresh consent still logged', shop.onboarding_data.voice_consent_call_sid==='CA5');
});

console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`);
process.exit(fail?1:0);
