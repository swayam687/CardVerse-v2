/* ============================================================
   core/RuleEngine.js — v2.19
   +6 / +10 stacking · filters eliminated players.
   ============================================================ */
const RuleEngine = {
  top(state) { return state.discard[state.discard.length - 1] || null; },

  stackAmount(card) {
    if (!card || !Array.isArray(card.effects)) return 0;
    const e = card.effects.find(x => x.type === 'DRAW' && x.target === 'next');
    return e ? e.amount : 0;
  },

  canStack(card, state, rules) {
    const pending = state.pendingDraw;
    if (!pending) return false;
    const amt = this.stackAmount(card);
    if (!amt) return false;

    const s = (rules && rules.stacking) ? rules.stacking : {};
    const anyColor = s.anyColor === true;

    if (!anyColor) {
      const colorOK = card.color === 'wild' || card.color === state.activeColor;
      if (!colorOK) return false;
    }

    const power = s.powerStacking === true;

    // Power stacking (No Mercy): +6 and +10 chain with everything
    if (power && amt >= 6) return true;
    if (power && pending >= 6) return true;

    const d2d2 = s.draw2OnDraw2 !== false;
    const d4d2 = s.draw4OnDraw2 === true;
    const d4d4 = s.draw4OnDraw4 === true;
    const d2d4 = s.draw2OnDraw4 === true;

    if (pending === 2 && amt === 2) return d2d2;
    if (pending === 2 && amt >= 4) return d4d2;
    if (pending >= 4 && amt >= 4) return d4d4;
    if (pending >= 4 && amt === 2) return d2d4;
    return false;
  },

  isPlayable(card, state, rules) {
    const top = this.top(state);
    if (!top) return true;
    if (state.pendingDraw > 0) return this.canStack(card, state, rules);
    if (card.color === 'wild') return true;

    const m = (rules && rules.matching) ? rules.matching : {};
    if (m.color && card.color === state.activeColor) return true;
    if (m.rank && card.type === 'number' && top.type === 'number' && card.value === top.value) return true;
    if (m.character && card.name === top.name) return true;
    if (m.type && card.type === top.type && card.type !== 'number') return true;
    return false;
  },

  meetsRequirement(card, player) {
    if (!card.requires) return true;
    if (card.color === 'wild') return true;
    if (card.requires.minHand && player.hand.length < card.requires.minHand) return false;
    return true;
  },

  targets(state, actor, keyword) {
    const n = state.players.length;
    const dir = state.direction;
    // Next non-eliminated player
    const next = (() => {
      let i = mod(actor + dir, n);
      let guard = 0;
      while (state.players[i] && state.players[i].eliminated && guard++ < n) {
        i = mod(i + dir, n);
      }
      return i;
    })();
    const prev = (() => {
      let i = mod(actor - dir, n);
      let guard = 0;
      while (state.players[i] && state.players[i].eliminated && guard++ < n) {
        i = mod(i - dir, n);
      }
      return i;
    })();
    const alive = state.players.map((_, i) => i).filter(i => !state.players[i].eliminated);
    switch (keyword) {
      case 'self':   return [actor];
      case 'next':   return [next];
      case 'prev':   return [prev];
      case 'all':    return alive;
      case 'others': return alive.filter(i => i !== actor);
      default:       return [];
    }
  }
};