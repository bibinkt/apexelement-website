process.env.FP_TEST_DB='1'; process.env.FP_TEST_SMS='1';
const { insert, _testTable } = await import('../lib/fp/db.js');
const { handleInbound, sendOpeningSms } = await import('../lib/fp/chain.js');
const { assembleCard } = await import('../lib/fp/jobcard.js');

const C='+18135550123';
const shop = await insert('fp_shops',{id:'s1',business_name:'Ace Appliance',trade_id:'appliance',
  owner_phone:'+18133178178',assigned_number:'+16802032310',status:'active',timezone:'America/New_York'});
globalThis.__FP_SENT=[];
const seen=new Set();
const show=()=>{ for(const m of globalThis.__FP_SENT){ if(seen.has(m)) continue; seen.add(m);
  console.log(`   ${m.to===C?'\x1b[36m→ them\x1b[0m':'\x1b[33m→ OWNER\x1b[0m'}  ${m.body.replace(/\n/g,'\n            ')}`); } };

await sendOpeningSms(shop, C, 'CAx'); show();
const say=async(t)=>{ console.log(`\n\x1b[1m   ← "${t}"\x1b[0m`); const r=await handleInbound({shop,from:C,body:t}); show(); return r; };

await say("my fridge is making a loud buzzing noise and its not cold inside anymore");
await say("started maybe 3 days ago. it still hums but nothing is cold");
await say("i cant get behind it to find any sticker sorry");
await say("door shuts fine and the breaker hasnt tripped");
await say("2118 W Sligh Ave Tampa. im home most afternoons");

const conv=_testTable('fp_conversations')[0];
const card=_testTable('fp_jobcards')[0];
console.log('\n\x1b[1m── JOB CARD ──\x1b[0m');
console.log(card ? card.card_text : '(no card yet) state: '+JSON.stringify(conv.state,null,1));
