process.env.FP_TEST_DB='1'; process.env.FP_TEST_SMS='1';
const { l6Guard } = await import('../lib/fp/claude.js');
const facts = { customer_stated: { complaint: 'my thermostat has no power' }, verified_from_photo: null };
const DRAFTS = [
  ['the exact draft blocked in Arun\'s test',
   "Ace Appliance: Sorry to hear your thermostat has no power — so the technician arrives with the right parts, could you text me a photo of the data plate? It's usually inside the door frame, on the back, or along the side panel."],
  ['current prompt wording (singular "part")',
   "Ace Appliance: Can you send a photo of the data plate so the technician brings the right part?"],
  ['without any mention of parts',
   "Ace Appliance: Can you send a photo of the data plate — usually inside the door frame or on the side panel?"],
  ['a genuine inventory claim (must block)',
   "Ace Appliance: We have that part in stock and can bring it out."],
  ['a genuine price claim (must block)',
   "Ace Appliance: That repair usually runs about $200."],
  ['a genuine schedule claim (must block)',
   "Ace Appliance: A technician will be there this afternoon."],
];
for (const [label, draft] of DRAFTS) {
  const v = await l6Guard({ draft, verifiedFacts: facts, ctx: {} });
  const mark = v.pass ? '\x1b[32mPASS\x1b[0m' : `\x1b[31mBLOCK (${v.violation})\x1b[0m`;
  console.log(`  ${mark}  ${label}`);
  if (!v.pass && v.span) console.log(`         span: "${v.span}"`);
}
