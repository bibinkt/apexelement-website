// Trade Profiles — the entire generalisation mechanism.
//
// Rule 1 of the chain: no model is asked to KNOW anything. Every trade-specific
// fact lives here and is injected at runtime. A model never asked to remember
// plumbing cannot invent plumbing. Adding a trade is a data edit, not a prompt edit.
//
// triage_bank entries are the ONLY questions that may ever be sent. L4 selects an
// index from this list; code then sends the string from here, not the model's copy.

export const TRADES = {
  appliance: {
    trade_id: 'appliance',
    trade_label: 'appliance repair',
    identity_asset: {
      name: 'data plate',
      where_to_find:
        'usually inside the door frame, on the back, or along the side panel',
      looks_like:
        'a sticker or metal plate with the model and serial numbers printed on it',
    },
    equipment_types: [
      'refrigerator', 'washer', 'dryer', 'dishwasher', 'oven', 'range',
      'microwave', 'freezer', 'unknown',
    ],
    hazard_terms: [
      'gas smell', 'smell gas', 'burning smell', 'smoke', 'sparks', 'sparking',
      'shock', 'shocked me', 'fire', 'flame', 'carbon monoxide', 'co alarm',
      'melting', 'water everywhere', 'flooding',
    ],
    triage_bank: {
      refrigerator: [
        'Is the freezer side still getting cold, or has everything warmed up?',
        'Can you hear the fridge running at all, or is it completely silent?',
      ],
      washer: [
        'Does it fill with water and then stop, or does nothing happen when you start it?',
        'Is the door latching shut properly when you close it?',
      ],
      dryer: [
        'Is the drum turning but the clothes are staying damp, or is it not turning at all?',
      ],
      dishwasher: [
        'Does it fill and drain, or is water sitting in the bottom?',
      ],
      oven: [
        'Does the oven light up and make a noise when you turn it on, or is there nothing at all?',
      ],
      range: [
        'Are the burners working but the oven is not, or is the whole thing dead?',
      ],
      unknown: [
        'Is it doing anything at all when you switch it on, or is it completely unresponsive?',
        'Have you checked whether the breaker for it has tripped?',
      ],
    },
  },

  hvac: {
    trade_id: 'hvac',
    trade_label: 'HVAC and cooling',
    identity_asset: {
      name: 'condenser nameplate',
      where_to_find: 'on the side of the outdoor unit, usually a metal plate near the top',
      looks_like:
        'a metal or foil plate with the model and serial numbers stamped or printed on it',
    },
    equipment_types: [
      'central_ac', 'heat_pump', 'furnace', 'mini_split', 'water_heater',
      'thermostat', 'unknown',
    ],
    hazard_terms: [
      'gas smell', 'smell gas', 'burning smell', 'smoke', 'sparks', 'shock',
      'carbon monoxide', 'co alarm', 'fire', 'no heat and freezing',
    ],
    triage_bank: {
      central_ac: [
        'Is the outdoor unit running at all, or is it completely silent when the thermostat calls for cool?',
        'Is air coming out of the vents but not cold, or is there no airflow at all?',
      ],
      heat_pump: [
        'Is it blowing air that is not the temperature you asked for, or is nothing coming out?',
      ],
      furnace: [
        'Does the blower run without producing heat, or does nothing happen when you raise the thermostat?',
      ],
      mini_split: [
        'Is the indoor head lighting up and responding to the remote at all?',
      ],
      water_heater: [
        'Is there any hot water at all, or has it gone completely cold?',
      ],
      thermostat: [
        'Is the thermostat screen lit up, or is it blank?',
      ],
      unknown: [
        'Is the system doing anything at all when you turn it on, or is it completely unresponsive?',
      ],
    },
  },

  plumbing: {
    trade_id: 'plumbing',
    trade_label: 'plumbing',
    identity_asset: {
      name: 'label on the unit or fixture',
      where_to_find:
        'on the side of the water heater, or under the sink on the valve body',
      looks_like: 'a sticker or plate showing the brand and model number',
    },
    equipment_types: [
      'water_heater', 'toilet', 'sink', 'shower', 'main_line', 'sump_pump',
      'garbage_disposal', 'unknown',
    ],
    hazard_terms: [
      'gas smell', 'smell gas', 'flooding', 'water everywhere', 'ceiling',
      'sewage', 'burst', 'no water at all', 'shock', 'sparks', 'carbon monoxide',
    ],
    triage_bank: {
      water_heater: [
        'Is there any hot water at all, or has it gone completely cold?',
        'Can you see water pooling around the base of the tank?',
      ],
      toilet: [
        'Is it overflowing right now, or is it just not flushing properly?',
      ],
      sink: [
        'Is it draining slowly, or is it completely blocked?',
      ],
      shower: [
        'Is the problem the temperature, the pressure, or the drain?',
      ],
      main_line: [
        'Have you been able to shut the water off at the main valve?',
      ],
      sump_pump: [
        'Is the pump running and not clearing the water, or is it not running at all?',
      ],
      unknown: [
        'Have you been able to shut the water off, and is it still leaking right now?',
      ],
    },
  },
};

// Universal hazard terms, applied on top of the trade list.
export const UNIVERSAL_HAZARDS = [
  'active flooding', 'fire', 'smoke', 'gas odor', 'gas odour', 'smell gas',
  'live wiring', 'electric shock', 'electrocuted', 'injured', 'trapped',
  'carbon monoxide', 'co alarm', '911',
];

export function getTrade(tradeId) {
  return TRADES[tradeId] || TRADES.appliance;
}

export function tradeChoices() {
  return Object.values(TRADES).map((t) => ({ id: t.trade_id, label: t.trade_label }));
}

// The bank for an equipment type, falling back to the trade's unknown bank.
export function triageFor(trade, equipmentType) {
  const bank = trade.triage_bank || {};
  return bank[equipmentType] || bank.unknown || [];
}

// Escalation text is per-shop because it names the shop's own phone number.
export function escalationSms(shop) {
  const phone = shop.owner_phone_display || shop.owner_phone || '';
  return (
    `${shop.business_name}: please stop and call us directly${phone ? ` at ${phone}` : ''} — ` +
    `this needs a person right now. If anyone is in danger, call 911 first.`
  );
}
