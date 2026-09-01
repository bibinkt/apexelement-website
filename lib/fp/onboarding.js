// Owner onboarding, driven entirely over SMS from the marketing number.
//
// The owner texts us. We ask for a website; if they have one we read it and
// pre-fill everything, so the whole thing is "text us, confirm, done". If they
// don't, we hand them a form link. Either way they end up with a profile and a
// dashboard whose login is their phone number.

import Anthropic from '@anthropic-ai/sdk';
import { selectOne, insert, update, remove, meter, modelCost } from './db.js';
import { sendSms, prettyPhone } from './twilio.js';
import { tradeChoices } from './trades.js';

// Carrier keywords, matched before anything else. The onboarding texts have
// always said "Reply STOP to opt out" but nothing implemented it here, so a
// shop owner who replied STOP was onboarded anyway.
const STOP_WORDS = ['stop','stopall','unsubscribe','cancel','quit','end','optout','optout','revoke'];
const HELP_WORDS = ['help','info'];
const YES_WORDS  = ['yes','y','yeah','yep','ok','okay','agree','agreed','start','sure','confirm'];

// Explicit consent captured by SMS, stored verbatim against the record.
export const CALL_CONSENT_TEXT =
  'FrontlinePros: thanks for calling. Before we text you anything else — may we send you ' +
  'marketing texts about FrontlinePros? Reply YES to agree. About 2-4 msgs/month. Msg & data ' +
  'rates may apply. Consent is not a condition of any purchase. Reply STOP to opt out, HELP for ' +
  'help. Terms: frontlinepros.apexelement.ai/messaging-terms';

const BRAND = 'FrontlinePros';

function siteUrl() {
  return process.env.FP_SITE_URL || 'https://frontlinepros.apexelement.ai';
}

const say = (n, from, text) => sendSms(n, from, text);

/**
 * Read a shop's public website and pull out the facts we'd otherwise ask for.
 * Extraction only — anything not on the page comes back null rather than guessed.
 */
export async function readWebsite(url) {
  let html = '';
  try {
    const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const r = await fetch(target, {
      headers: { 'User-Agent': 'FrontlineProsBot/1.0 (+https://frontlinepros.apexelement.ai)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return null;
    html = await r.text();
  } catch {
    return null;
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 12000);

  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['business_name', 'trade_id', 'service_area', 'address', 'owner_name'],
    properties: {
      business_name: { type: ['string', 'null'] },
      trade_id: { type: ['string', 'null'], enum: [...tradeChoices().map((t) => t.id), null] },
      service_area: { type: ['string', 'null'] },
      address: { type: ['string', 'null'] },
      owner_name: { type: ['string', 'null'] },
    },
  };

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 500,
      system:
        'You extract facts from a business website. Copy only what is literally stated on the page. ' +
        'If a fact is not present, return null for it. Never infer, never guess, never fill a field ' +
        'from what businesses like this usually have. trade_id must be one of the allowed values, or null.',
      messages: [{ role: 'user', content: `WEBSITE TEXT:\n${text}` }],
      output_config: { format: { type: 'json_schema', schema } },
    });
    const usage = res.usage || {};
    await meter({
      kind: 'onboarding_scrape',
      model: 'claude-sonnet-5',
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      usd: modelCost('claude-sonnet-5', usage.input_tokens || 0, usage.output_tokens || 0),
    });
    const body = (res.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
    const m = body.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch (e) {
    console.error('[fp] website read failed', e.message);
    return null;
  }
}

/**
 * SMS state machine. Kept deliberately small — four steps and an escape hatch
 * to the web form, because a blue-collar owner texting from a van will not
 * complete a twelve-question interview.
 */
export async function handleOnboardingSms({ marketingNumber, from, body }) {
  const text = (body || '').trim();
  const word = text.toLowerCase().replace(/[^a-z]/g, '');

  let shop = await selectOne('fp_shops', `owner_phone=eq.${encodeURIComponent(from)}`);

  // ── carrier keywords, before any other branch ──
  if (STOP_WORDS.includes(word)) {
    await insert('fp_optouts', { shop_id: shop?.id || null, phone: from }).catch(() => {});
    if (shop) await update('fp_shops', `id=eq.${shop.id}`, { onboarding_step: 'opted_out', status: 'paused' });
    await say(marketingNumber, from,
      `${BRAND}: you have been unsubscribed and will not receive any more messages from this number. Reply START to resubscribe.`);
    return { action: 'stop' };
  }

  if (HELP_WORDS.includes(word)) {
    await say(marketingNumber, from,
      `${BRAND} by ApexElement LLC - missed-call text-back for repair shops. Help: hello@apexelement.ai. ` +
      `Msg frequency varies, about 2-4/month. Msg & data rates may apply. Reply STOP to unsubscribe.`);
    return { action: 'help' };
  }

  // Someone who opted out is never messaged again unless they resubscribe.
  const suppressed = await selectOne('fp_optouts', `phone=eq.${encodeURIComponent(from)}`);
  if (suppressed && !YES_WORDS.includes(word)) return { action: 'suppressed_opted_out' };
  if (suppressed && YES_WORDS.includes(word)) {
    await remove('fp_optouts', `phone=eq.${encodeURIComponent(from)}`).catch(() => {});
  }

  // ── consent gate: they phoned us, we asked permission, this is the answer ──
  if (shop && shop.onboarding_step === 'awaiting_consent') {
    if (!YES_WORDS.includes(word)) {
      await update('fp_shops', `id=eq.${shop.id}`, { onboarding_step: 'consent_declined' });
      await say(marketingNumber, from,
        `${BRAND}: no problem, we'll leave it there. Reply YES any time if you change your mind.`);
      return { action: 'consent_declined' };
    }
    await update('fp_shops', `id=eq.${shop.id}`, {
      onboarding_step: 'ask_website',
      onboarding_data: {
        ...(shop.onboarding_data || {}),
        sms_consent_at: new Date().toISOString(),
        sms_consent_text: CALL_CONSENT_TEXT,
        sms_consent_reply: text,
      },
    });
    await say(marketingNumber, from,
      `${BRAND}: thanks. What's your shop's website? I'll read it and set you up so you barely ` +
      `have to type anything.\n\nNo website? Reply NONE and I'll send you a short form instead.`);
    return { action: 'consent_granted' };
  }

  // Already onboarded → this is a login request.
  if (shop && shop.status !== 'onboarding') {
    const { sendLoginLink } = await import('./auth.js');
    await sendLoginLink({ shop, viaNumber: marketingNumber });
    return { action: 'login_link' };
  }

  if (!shop) {
    shop = await insert('fp_shops', {
      business_name: 'Pending',
      owner_phone: from,
      status: 'onboarding',
      onboarding_step: 'ask_website',
      onboarding_data: {},
    });
    await say(
      marketingNumber,
      from,
      `${BRAND}: great to hear from you. What's your shop's website? ` +
        `I'll read it and set you up so you barely have to type anything.\n\n` +
        `No website? Reply NONE and I'll send you a short form instead.\n` +
        `Msg & data rates may apply. Reply STOP to opt out.`
    );
    return { action: 'started' };
  }

  const data = shop.onboarding_data || {};

  switch (shop.onboarding_step) {
    case 'ask_website': {
      if (word === 'none' || word === 'no') {
        await update('fp_shops', `id=eq.${shop.id}`, { onboarding_step: 'form_sent' });
        await say(
          marketingNumber,
          from,
          `${BRAND}: no problem. Fill this in and you're done — takes about a minute:\n${siteUrl()}/join?p=${encodeURIComponent(from)}`
        );
        return { action: 'form_sent' };
      }

      const found = await readWebsite(text);
      if (!found || !found.business_name) {
        await update('fp_shops', `id=eq.${shop.id}`, {
          onboarding_step: 'form_sent',
          website: text,
        });
        await say(
          marketingNumber,
          from,
          `${BRAND}: I couldn't read much from that site. Quicker to fill this in — about a minute:\n${siteUrl()}/join?p=${encodeURIComponent(from)}`
        );
        return { action: 'form_sent' };
      }

      Object.assign(data, found);
      await update('fp_shops', `id=eq.${shop.id}`, {
        business_name: found.business_name,
        trade_id: found.trade_id || 'appliance',
        owner_name: found.owner_name || null,
        service_area: found.service_area || null,
        address: found.address || null,
        website: text,
        onboarding_step: 'confirm',
        onboarding_data: data,
      });

      const trade = tradeChoices().find((t) => t.id === (found.trade_id || 'appliance'));
      await say(
        marketingNumber,
        from,
        `${BRAND}: got it —\n` +
          `Business: ${found.business_name}\n` +
          `Trade: ${trade?.label || 'appliance repair'}\n` +
          `${found.service_area ? `Area: ${found.service_area}\n` : ''}` +
          `\nReply YES if that's right, or NO to fix it.`
      );
      return { action: 'confirm_sent' };
    }

    case 'confirm': {
      if (word === 'yes' || word === 'y' || word === 'correct') {
        await update('fp_shops', `id=eq.${shop.id}`, {
          status: 'active',
          onboarding_step: 'done',
          activated_at: new Date().toISOString(),
        });
        const { sendLoginLink } = await import('./auth.js');
        const fresh = await selectOne('fp_shops', `id=eq.${shop.id}`);
        await say(
          marketingNumber,
          from,
          `${BRAND}: you're set up. ${
            fresh.assigned_number
              ? `Your FrontlinePros number is ${prettyPhone(fresh.assigned_number)}. ` +
                `Dial *71${fresh.assigned_number.replace('+1', '')} on your business line to switch it on, and *73 to turn it off.`
              : `We'll assign your number and text you the forwarding code shortly.`
          }`
        );
        await sendLoginLink({ shop: fresh, viaNumber: marketingNumber });
        return { action: 'activated' };
      }
      await update('fp_shops', `id=eq.${shop.id}`, { onboarding_step: 'form_sent' });
      await say(
        marketingNumber,
        from,
        `${BRAND}: no problem — put it right here and you're done:\n${siteUrl()}/join?p=${encodeURIComponent(from)}`
      );
      return { action: 'form_sent' };
    }

    default: {
      await say(
        marketingNumber,
        from,
        `${BRAND}: finish your setup here and you're done:\n${siteUrl()}/join?p=${encodeURIComponent(from)}`
      );
      return { action: 'form_reminder' };
    }
  }
}


/**
 * The caller pressed 1 on the consent gate, so they have asked to be texted.
 * Send the opening onboarding message and record the keypress as the consent.
 *
 * This authorises our reply to their own enquiry. Recurring marketing still
 * requires the written consent checkbox on the contact page — a spoken or
 * keypad "yes" is weaker than a written one under TCPA, so it is not treated
 * as marketing consent on its own.
 */
export async function startOnboardingAfterConsent({ marketingNumber, from, callSid }) {
  const opted = await selectOne('fp_optouts', `phone=eq.${encodeURIComponent(from)}`);
  if (opted) return { action: 'suppressed_opted_out' };

  const consent = {
    voice_consent_at: new Date().toISOString(),
    voice_consent_method: 'dtmf_1_on_inbound_call',
    voice_consent_call_sid: callSid,
    source: 'inbound_call',
  };

  let shop = await selectOne('fp_shops', `owner_phone=eq.${encodeURIComponent(from)}`);

  if (shop) {
    // Log the fresh consent either way, then decide whether to greet them again.
    await update('fp_shops', `id=eq.${shop.id}`, {
      onboarding_data: { ...(shop.onboarding_data || {}), ...consent },
    });
    // Only someone who has not started, or who previously declined, gets the
    // opener. Anyone part-way through keeps their place — re-sending it would
    // reset a shop that is halfway set up.
    const restartable = ['awaiting_consent', 'consent_declined', 'opted_out', 'start'];
    if (!restartable.includes(shop.onboarding_step)) {
      return { action: 'already_known' };
    }
    await update('fp_shops', `id=eq.${shop.id}`, {
      status: 'onboarding',
      onboarding_step: 'ask_website',
    });
  } else {
    shop = await insert('fp_shops', {
      business_name: 'Pending',
      owner_phone: from,
      status: 'onboarding',
      onboarding_step: 'ask_website',
      onboarding_data: consent,
    });
  }

  await say(
    marketingNumber,
    from,
    `${BRAND}: thanks for calling. What's your shop's website? I'll read it and set you up so ` +
      `you barely have to type anything.\n\nNo website? Reply NONE and I'll send you a short ` +
      `form instead.\nMsg & data rates may apply. Reply STOP to opt out, HELP for help.`
  );
  return { action: 'onboarding_started' };
}
