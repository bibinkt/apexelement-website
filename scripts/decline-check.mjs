process.env.FP_TEST_DB='1'; process.env.FP_TEST_SMS='1';
const { insert } = await import('../lib/fp/db.js');
const { handleInbound, sendOpeningSms } = await import('../lib/fp/chain.js');
const CALLER='+14075550110';
const shop = await insert('fp_shops',{id:'s1',business_name:'Ace Appliance',trade_id:'appliance',
  owner_phone:'+14075559999',assigned_number:'+15550001111',status:'active',timezone:'America/New_York'});
globalThis.__FP_SENT=[];
await sendOpeningSms(shop, CALLER, 'CA1');
const say=(t)=>handleInbound({shop,from:CALLER,body:t});
console.log('1)', (await say('My fridge stopped cooling, freezer is fine')).action);
console.log('2)', (await say("I can't find that sticker anywhere")).action);
console.log('3)', (await say('the door shuts fine and the breaker is on')).action);
console.log('\n--- to customer ---');
for (const m of globalThis.__FP_SENT.filter(m=>m.to===CALLER)) console.log('  →', m.body.slice(0,160));
console.log('\n--- to owner ---');
for (const m of globalThis.__FP_SENT.filter(m=>m.to!==CALLER)) console.log('  →', m.body.replace(/\n/g,' | ').slice(0,220));
