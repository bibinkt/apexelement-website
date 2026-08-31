// L3 — Confidence Router, and L5 — Job Card Assembler.
// Neither contains a model. That is the whole point: a threshold enforced in a
// prompt is a suggestion; in code it is a rule. And the artifact the owner acts
// on is assembled by code from typed fields, so a model can never compose it.

import { prettyPhone } from './twilio.js';

export const CONFIDENCE_THRESHOLD = 0.8;

const FIELDS = ['brand', 'equipment_type', 'model_number', 'serial_number', 'error_code'];

/**
 * L3. Hard-overwrites any field below threshold to "unknown" and stamps
 * provenance. Returns { fields, needsReshoot }.
 */
export function routeConfidence(extract) {
  const fields = {};
  if (!extract) {
    for (const f of FIELDS) fields[f] = { value: 'unknown', provenance: 'not_provided' };
    return { fields, needsReshoot: true, imageUsable: false };
  }

  for (const f of FIELDS) {
    const raw = extract[f] || {};
    const value = String(raw.value ?? 'unknown').trim() || 'unknown';
    const conf = Number(raw.confidence ?? 0);
    if (value.toLowerCase() === 'unknown' || conf < CONFIDENCE_THRESHOLD) {
      fields[f] = { value: 'unknown', provenance: 'unreadable', confidence: conf };
    } else {
      fields[f] = { value, provenance: 'verified_from_photo', confidence: conf, evidence: raw.evidence };
    }
  }

  const needsReshoot =
    !extract.image_usable ||
    extract.multiple_plates_visible === true ||
    fields.model_number.value === 'unknown';

  return { fields, needsReshoot, imageUsable: !!extract.image_usable };
}

const pad = (s, n) => String(s ?? '').padEnd(n);

/**
 * L5. Pure string templating. Every line carries provenance so the owner can
 * tell a verified glyph from a blank at a glance.
 */
export function assembleCard({ shop, conversation, fields, complaint, question, answer, mediaUrl, address }) {
  const f = fields || {};
  const g = (k) => (f[k]?.value ?? 'unknown');
  const p = (k) => `[${f[k]?.provenance ?? 'not_provided'}]`;

  const when = new Date().toLocaleString('en-US', {
    timeZone: shop.timezone || 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const lines = [
    `NEW JOB — ${shop.business_name}`,
    '─────────────────────────────────',
    `CUSTOMER    ${prettyPhone(conversation.caller_phone)}`,
    `ADDRESS     ${address || 'not provided'}${address ? '   [customer-stated, unverified]' : ''}`,
    `RECEIVED    ${when}`,
    '',
    'EQUIPMENT',
    `  Brand     ${pad(g('brand'), 22)}${p('brand')}`,
    `  Type      ${pad(g('equipment_type'), 22)}${p('equipment_type')}`,
    `  Model     ${pad(g('model_number'), 22)}${p('model_number')}`,
    `  Serial    ${pad(g('serial_number'), 22)}${p('serial_number')}`,
    `  Err code  ${pad(g('error_code'), 22)}${p('error_code')}`,
    '',
    "IN THE CUSTOMER'S OWN WORDS",
    `  "${complaint || 'not given'}"`,
  ];

  if (question) {
    lines.push('', 'SCREENING', `  Asked:    ${question}`, `  Answered: "${answer || 'no answer'}"`);
  }
  if (mediaUrl) lines.push('', `PHOTO       ${mediaUrl}`);

  lines.push(
    '',
    '⚠ NOT DIAGNOSED. No cause, part, or repair has been determined.',
    '  Fields marked [unreadable] were not legible in the photo.',
    '─────────────────────────────────'
  );

  return lines.join('\n');
}

/** The SMS the owner gets. Short — the full card lives in the dashboard. */
export function ownerSms({ shop, conversation, fields, complaint, dashboardUrl }) {
  const brand = fields?.brand?.value;
  const model = fields?.model_number?.value;
  const kit =
    brand && brand !== 'unknown'
      ? `${brand}${model && model !== 'unknown' ? ` ${model}` : ''}`
      : 'equipment not identified';
  return (
    `${shop.business_name} — new job from ${prettyPhone(conversation.caller_phone)}\n` +
    `"${(complaint || '').slice(0, 90)}"\n` +
    `${kit}\n` +
    `Full card: ${dashboardUrl}`
  );
}

export function isIdentified(fields) {
  return fields?.model_number?.provenance === 'verified_from_photo';
}
