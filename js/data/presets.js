/* ============================================================
   data/presets.js — 4 modes (v2.19)
   ============================================================ */
const RULE_PRESETS = {
  classic: {
    icon: '🎴', name: 'Classic',
    desc: 'UNO rules + universe signature abilities. Light stacking.',
    rules() {
      const r = defaultRules();
      r.matching.color = true;
      r.matching.rank = true;
      r.stacking.draw2OnDraw2 = true;
      r.stacking.anyColor = false;
      r.draw.count = 1;
      r.draw.playAfterDraw = true;
      r.abilities.enabled = true;
      r.abilities.stickyShield = false;
      r.deal.handSize = 7;
      r.deal.deckMode = 'normal';
      return r;
    }
  },
  blitz: {
    icon: '⚡', name: 'Blitz',
    desc: 'Four cards, fifteen seconds. Ninety-second games.',
    rules() {
      const r = defaultRules();
      r.matching.color = true;
      r.matching.rank = true;
      r.stacking.draw2OnDraw2 = true;
      r.turn.timer = 15;
      r.draw.count = 1;
      r.draw.playAfterDraw = true;
      r.draw.forcePlay = true;
      r.abilities.enabled = true;
      r.deal.handSize = 4;
      return r;
    }
  },
  chaos: {
    icon: '🌪️', name: 'Chaos',
    desc: 'Full stacking + extra +2 / +4 in the deck.',
    rules() {
      const r = defaultRules();
      r.matching.color = true;
      r.matching.rank = true;
      r.stacking.draw2OnDraw2 = true;
      r.stacking.draw4OnDraw2 = true;
      r.stacking.draw4OnDraw4 = true;
      r.stacking.draw2OnDraw4 = true;
      r.stacking.anyColor = false;
      r.draw.count = 1;
      r.draw.playAfterDraw = true;
      r.abilities.enabled = true;
      r.abilities.stickyShield = true;
      r.deal.handSize = 7;
      r.deal.extraDraws = true;
      return r;
    }
  },
  noMercy: {
    icon: '💀', name: 'No Mercy',
    desc: 'The full 2024 ruleset. +6, +10, Discard All, 7-swap, 0-rotate, 25-card elimination.',
    rules() {
      const r = defaultRules();
      r.matching.color = true;
      r.matching.rank = true;
      r.stacking.draw2OnDraw2 = true;
      r.stacking.draw4OnDraw2 = true;
      r.stacking.draw4OnDraw4 = true;
      r.stacking.draw2OnDraw4 = true;
      r.stacking.anyColor = true;
      r.stacking.powerStacking = true;
      r.turn.drawUntilPlayable = true;
      r.draw.count = 1;
      r.draw.playAfterDraw = true;
      r.abilities.enabled = true;
      r.abilities.stickyShield = true;
      r.handLimit.eliminateAt = 25;
      r.deal.handSize = 7;
      r.deal.noMercyExtras = true;
      r.deal.noMercyNumbers = true;
      return r;
    }
  }
};