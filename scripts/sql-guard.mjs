const { inspect } = await import('../lib/fp/sqlconsole.js');
let pass=0, fail=0;
const check=(label, sql, shouldAllow)=>{
  const r=inspect(sql);
  const ok = r.ok === shouldAllow;
  console.log((ok?'  \x1b[32m✓':'  \x1b[31m✗')+` ${label}\x1b[0m`+(ok?'':`  → ${r.ok?'ALLOWED':'blocked: '+r.error}`));
  ok?pass++:fail++;
};

console.log('\n\x1b[1mmust be allowed\x1b[0m');
check('plain select', 'select * from fp_shops', true);
check('join', 'select s.business_name, c.status from fp_shops s join fp_conversations c on c.shop_id = s.id', true);
check('aggregate', 'select kind, sum(usd) from fp_costs group by 1', true);
check('explain', 'explain select * from fp_messages', true);
check('CTE that only reads', 'with x as (select id from fp_shops) select * from x', true);
check('trailing semicolon is tolerated', 'select 1 from fp_shops;', true);

console.log('\n\x1b[1mmust be blocked\x1b[0m');
check('delete', 'delete from fp_shops', false);
check('update', 'update fp_shops set business_name = 3', false);
check('drop', 'drop table fp_shops', false);
check('truncate', 'truncate fp_messages', false);
check('alter', 'alter table fp_shops add column x int', false);
check('insert', 'insert into fp_admins (email) values (3)', false);
check('grant', 'grant all on fp_shops to public', false);
check('stacked statement', 'select 1 from fp_shops; drop table fp_shops', false);
check('comment-hidden write', 'select 1 from fp_shops -- ; delete from fp_shops', false);
check('block-comment evasion', 'select /* x */ 1 from fp_shops', false);
check('CTE hiding a delete', 'with d as (delete from fp_shops returning *) select * from d', false);
check('writing CTE via update', 'with u as (update fp_shops set trade_id = 3 returning *) select * from u', false);
check('reads another product table', 'select * from a2z_users', false);
check('reads auth schema', 'select * from auth.users', false);
check('pg_sleep DoS', 'select pg_sleep(60) from fp_shops', false);
check('file read', 'select pg_read_file(3) from fp_shops', false);
check('empty', '   ', false);

console.log('\n\x1b[1mrow cap\x1b[0m');
const raw=(label, cond)=>{ console.log((cond?'  \x1b[32m✓':'  \x1b[31m✗')+` ${label}\x1b[0m`); cond?pass++:fail++; };
const capped=inspect('select * from fp_messages');
raw('adds a limit when none given', capped.ok && /limit 500$/.test(capped.sql));
const kept=inspect('select * from fp_messages limit 3');
raw('respects an existing limit', kept.ok && !/limit 500/.test(kept.sql));
raw('CTE alias is not mistaken for a table', inspect('with x as (select id from fp_shops) select * from x').ok);
raw('table alias is not mistaken for a table', inspect('select s.id from fp_shops s').ok);

console.log(`\n\x1b[1m${pass} passed, ${fail} failed\x1b[0m`);
process.exit(fail?1:0);
