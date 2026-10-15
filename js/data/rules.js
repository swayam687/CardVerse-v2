/* ============================================================
   data/rules.js — RULE_SCHEMA (v2.19)
   New: handLimit group, noMercy flags, powerStacking, extraDraws.
   ============================================================ */
const RULE_SCHEMA = [
  {
    group: 'Matching', key: 'matching', icon: '🎯',
    items: [
      { key: 'color',     label: 'Match Color',     type: 'bool', def: true },
      { key: 'rank',      label: 'Match Number',    type: 'bool', def: true },
      { key: 'character', label: 'Match Character', type: 'bool', def: false },
      { key: 'type',      label: 'Match Card Type', type: 'bool', def: false }
    ]
  },
  {
    group: 'Stacking', key: 'stacking', icon: '📚',
    items: [
      { key: 'draw2OnDraw2',  label: '+2 on +2', type: 'bool', def: true },
      { key: 'draw4OnDraw2',  label: '+4 on +2', type: 'bool', def: false },
      { key: 'draw4OnDraw4',  label: '+4 on +4', type: 'bool', def: false },
      { key: 'draw2OnDraw4',  label: '+2 on +4', type: 'bool', def: false },
      { key: 'anyColor',      label: 'Stack Any Color', type: 'bool', def: false,
        note: 'No Mercy: +2 on +2 even when colors differ' },
      { key: 'powerStacking', label: 'Power Stacking (+6/+10 chains)', type: 'bool', def: false,
        note: 'Enables +6 and +10 to chain with +2/+4' }
    ]
  },
  {
    group: 'Turn', key: 'turn', icon: '⏱️',
    items: [
      { key: 'timer',             label: 'Turn Timer', type: 'num', def: 0, min: 0, max: 60, step: 5, suffix: 'sec (0 = off)' },
      { key: 'drawUntilPlayable', label: 'Draw Until Playable', type: 'bool', def: false }
    ]
  },
  {
    group: 'Drawing', key: 'draw', icon: '🃏',
    items: [
      { key: 'count',         label: 'Cards Per Draw', type: 'num', def: 1, min: 1, max: 5 },
      { key: 'playAfterDraw', label: 'May Play After Drawing', type: 'bool', def: true },
      { key: 'forcePlay',     label: 'Must Play If Able', type: 'bool', def: false }
    ]
  },
  {
    group: 'Limits', key: 'handLimit', icon: '🚫',
    items: [
      { key: 'forcePlayAt', label: 'Force-Play At', type: 'num', def: 0, min: 0, max: 30,
        suffix: '0 = off · Must play if hand ≥ value' },
      { key: 'eliminateAt', label: 'Elimination At', type: 'num', def: 0, min: 0, max: 40,
        suffix: '0 = off · Out if hand ≥ value' },
      { key: 'drawCap',     label: 'Draw Cap Per Turn', type: 'num', def: 0, min: 0, max: 10,
        suffix: '0 = unlimited' }
    ]
  },
  {
    group: 'Abilities', key: 'abilities', icon: '✨',
    items: [
      { key: 'enabled',      label: 'Character Abilities', type: 'bool', def: true },
      { key: 'stickyShield', label: 'Sticky Shields', type: 'bool', def: false,
        note: 'Shield survives until used · Reveal pierces shields' }
    ]
  },
  {
    group: 'Table', key: 'deal', icon: '🎲',
    items: [
      { key: 'handSize',       label: 'Starting Hand', type: 'num', def: 7, min: 3, max: 20 },
      { key: 'reshuffle',      label: 'Reshuffle Discard', type: 'bool', def: true },
      { key: 'noMercyExtras',  label: 'No Mercy Cards (+6/+10/Discard All/Skip Everyone)', type: 'bool', def: false },
      { key: 'noMercyNumbers', label: 'No Mercy Numbers (7=swap, 0=rotate)', type: 'bool', def: false },
      { key: 'extraDraws',     label: 'Extra +2/+4 Cards (Chaos)', type: 'bool', def: false },
      { key: 'deckMode',       label: 'Deck Mode', type: 'str', def: 'normal', hidden: true }
    ]
  }
];

function defaultRules() {
  const out = {};
  for (const group of RULE_SCHEMA) {
    const g = {};
    for (const item of group.items) {
      g[item.key] = (item.def !== undefined) ? item.def : 0;
    }
    out[group.key] = g;
  }
  return out;
}

function sanitizeRules(r) {
  const src = (r && typeof r === 'object') ? r : {};
  const out = {
    matching:  { ...(src.matching  || {}) },
    stacking:  { ...(src.stacking  || {}) },
    turn:      { ...(src.turn      || {}) },
    draw:      { ...(src.draw      || {}) },
    handLimit: { ...(src.handLimit || {}) },
    abilities: { ...(src.abilities || {}) },
    deal:      { ...(src.deal      || {}) }
  };

  const num = (v, lo, hi, dflt) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return dflt;
    return Math.max(lo, Math.min(hi, n));
  };

  out.deal.handSize       = num(out.deal.handSize, 3, 20, 7);
  out.draw.count          = num(out.draw.count, 1, 5, 1);
  out.turn.timer          = num(out.turn.timer, 0, 120, 0);
  out.handLimit.forcePlayAt = num(out.handLimit.forcePlayAt, 0, 30, 0);
  out.handLimit.eliminateAt = num(out.handLimit.eliminateAt, 0, 40, 0);
  out.handLimit.drawCap     = num(out.handLimit.drawCap, 0, 10, 0);

  if (out.deal.deckMode !== 'allWild') out.deal.deckMode = 'normal';
  return out;
}