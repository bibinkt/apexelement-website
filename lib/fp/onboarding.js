// Owner onboarding, driven entirely over SMS from the marketing number.
//
// The owner texts us. We ask for a website; if they have one we read it and
// pre-fill everything, so the whole thing is "text us, confirm, done". If they
// don't, we hand them a form link. Either way they end up with a profile and a
// dashboard whose login is their phone number.

import Anthropic from '@anthropic-ai/sdk';
import { selectOne, insert, update, meter, modelCost } from './db';
import { sendSms, prettyPhone } from './twilio';
import { tradeChoices } from './trades';

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

  // Already onboarded → this is a login request.
  if (shop && shop.status !== 'onboarding') {
    const { sendLoginLink } = await import('./auth');
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
        const { sendLoginLink } = await import('./auth');
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
