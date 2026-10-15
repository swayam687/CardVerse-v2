/* ============================================================
   ui/BetView.js — v2.21
   Online 1v1 betting with verbose logging.
   ============================================================ */
const BetView = {
  PRESETS: ['Samosa 🥟', 'Coke 🥤', 'Chai ☕', 'Canteen lunch 🍽️', 'Lift a friend\'s plate 😈'],

  _wired: false,

  mount() {
    if (this._wired) return;
    this._wired = true;
    console.log('[BetView] mount()');

    if (typeof Net === 'undefined' || !Net.on) {
      console.warn('[BetView] Net not ready — will retry in 300ms');
      this._wired = false;
      setTimeout(() => this.mount(), 300);
      return;
    }

    Net.on('room_update', (msg) => {
      console.log('[BetView] room_update received. bet =', msg.room && msg.room.bet);
      this._render();
    });
    Net.on('bet_updated', (msg) => {
      console.log('[BetView] bet_updated received. bet =', msg.bet);
      this._render();
    });
    Net.on('rejoined', () => this._render());
    Net.on('created', () => setTimeout(() => this._render(), 100));
    Net.on('joined', () => setTimeout(() => this._render(), 100));

    // Initial render in case we're already in a room
    setTimeout(() => this._render(), 200);
  },

  openHostModal() {
    if (typeof Modal === 'undefined') return;
    const room = Net.room;
    const current = (room && room.bet && room.bet.text) || '';

    const m = Modal.open(`
      <h2>🎁 Set the Bet</h2>
      <div class="hint">1v1 only. Loser owes the winner this. They must accept before the match can start.</div>
      <div class="pe-emoji-grid" id="betPresets" style="margin-top:12px"></div>
      <label class="fl" style="margin-top:14px">Or type your own</label>
      <input id="betText" maxlength="60" value="${esc(current)}" placeholder="Winner gets…" autocomplete="off">
      <button class="btn primary big" style="width:100%;margin-top:14px" id="betSave">Set Bet</button>
      <button class="btn ghost big" style="width:100%;margin-top:8px" id="betClear">Remove Bet</button>
      <button class="btn ghost" style="width:100%;margin-top:8px" id="betCancel">Cancel</button>
    `);
    if (!m) return;

    const grid = m.querySelector('#betPresets');
    const input = m.querySelector('#betText');

    this.PRESETS.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pe-emoji-btn';
      b.style.fontSize = '11px';
      b.style.padding = '10px 8px';
      b.style.lineHeight = '1.2';
      b.style.whiteSpace = 'nowrap';
      b.textContent = t;
      if (t === current) b.classList.add('active');
      b.onclick = () => {
        if (typeof Sound !== 'undefined') Sound.click();
        input.value = t;
        grid.querySelectorAll('.pe-emoji-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      };
      grid.appendChild(b);
    });

    m.querySelector('#betSave').onclick = () => {
      const text = (input.value || '').trim().slice(0, 60);
      if (!text) { if (typeof Toast !== 'undefined') Toast.show('Enter a bet or tap Remove'); return; }
      if (typeof Sound !== 'undefined') Sound.click();
      console.log('[BetView] sending set_bet:', text);
      Net._send({ type: 'set_bet', text });
      Modal.close();
      if (typeof Toast !== 'undefined') Toast.show('Bet sent — waiting for opponent to accept');
    };
    m.querySelector('#betClear').onclick = () => {
      if (typeof Sound !== 'undefined') Sound.click();
      console.log('[BetView] clearing bet');
      Net._send({ type: 'set_bet', text: '' });
      Modal.close();
    };
    m.querySelector('#betCancel').onclick = () => Modal.close();
  },

  acceptBet() {
    if (typeof Net === 'undefined') return;
    if (typeof Sound !== 'undefined') Sound.click();
    console.log('[BetView] sending accept_bet');
    Net._send({ type: 'accept_bet' });
    if (typeof Toast !== 'undefined') Toast.show('Bet accepted ✓');
  },

  _render() {
    const panel = document.getElementById('roomBetPanel');
    if (!panel) {
      console.log('[BetView] _render: no #roomBetPanel in DOM');
      return;
    }

    const room = Net.room;
    console.log('[BetView] _render:', {
      hasRoom: !!room,
      isHost: !!Net.isHost,
      players: room && room.players ? room.players.length : 0,
      bet: room && room.bet,
      panelVisible: panel.style.display !== 'none'
    });

    if (!room) { panel.style.display = 'none'; panel.innerHTML = ''; return; }

    const players = room.players || [];
    const humans = players.filter(p => !p.isBot);
    // Only 1v1 (exactly 2 humans and no bots)
    if (humans.length !== 2 || players.length !== 2) {
      panel.style.display = 'none';
      panel.innerHTML = '';
      return;
    }

    const bet = room.bet || { text: '', accepted: false };
    const isHost = !!Net.isHost;

    if (!bet.text) {
      panel.innerHTML = isHost
        ? `<div class="bet-card">
             <div class="bet-label">🎁 1v1 BET</div>
             <div class="bet-text" style="font-size:13px;opacity:.75;font-weight:700">Optional — set what the loser owes the winner.</div>
             <button class="btn primary big" id="rvSetBet" style="width:100%;margin-top:10px">Set a Bet</button>
           </div>`
        : `<div class="bet-card">
             <div class="bet-label">🎁 1v1 BET</div>
             <div class="bet-text" style="font-size:13px;opacity:.75;font-weight:700">Waiting for host to set a bet…</div>
           </div>`;
      panel.style.display = '';
      const btn = document.getElementById('rvSetBet');
      if (btn) btn.onclick = () => this.openHostModal();
      return;
    }

    if (isHost) {
      panel.innerHTML = `
        <div class="bet-card">
          <div class="bet-label">🎁 1v1 BET</div>
          <div class="bet-text">${esc(bet.text)}</div>
          <div class="bet-status ${bet.accepted ? 'good' : ''}">
            ${bet.accepted ? '✓ Accepted — ready to start' : '⏳ Waiting for opponent to accept…'}
          </div>
          <button class="btn ghost sm" id="rvSetBet" style="margin-top:10px;width:100%">Change</button>
        </div>`;
      panel.style.display = '';
      const btn = document.getElementById('rvSetBet');
      if (btn) btn.onclick = () => this.openHostModal();
    } else {
      panel.innerHTML = `
        <div class="bet-card">
          <div class="bet-label">🎁 1v1 BET</div>
          <div class="bet-text">${esc(bet.text)}</div>
          <div class="bet-status">Loser pays up. Do you accept?</div>
          ${bet.accepted
            ? `<div class="bet-status good" style="margin-top:8px">✓ You accepted</div>`
            : `<button class="btn primary big" id="rvAcceptBet" style="width:100%;margin-top:10px">Accept the Bet</button>`}
        </div>`;
      panel.style.display = '';
      const btn = document.getElementById('rvAcceptBet');
      if (btn) btn.onclick = () => this.acceptBet();
    }
  },

  renderWinBanner() {
    const wrap = document.getElementById('winBet');
    if (!wrap) { console.log('[BetView] no #winBet in DOM'); return; }
    const room = Net.room;
    console.log('[BetView] renderWinBanner:', {
      active: !!Net.active,
      hasRoom: !!room,
      bet: room && room.bet
    });
    if (!Net.active || !room || !room.bet || !room.bet.text || !room.bet.accepted) {
      wrap.style.display = 'none';
      wrap.innerHTML = '';
      return;
    }
    const s = (typeof ArenaView !== 'undefined') ? ArenaView.state : null;
    if (!s || s.winner === null || s.winner === -1) { wrap.style.display = 'none'; return; }

    const iWon = s.players[s.winner] && s.players[s.winner].id === Net.playerId;
    wrap.style.display = '';
    wrap.innerHTML = iWon
      ? `<div class="bet-banner win">🎁 You won the bet: <b>${esc(room.bet.text)}</b><br><span style="opacity:.75;font-size:12px">Collect it in person.</span></div>`
      : `<div class="bet-banner lose">😬 You lost the bet: <b>${esc(room.bet.text)}</b><br><span style="opacity:.75;font-size:12px">Pay up (or request a rematch).</span></div>`;
  }
};

(function selfMount() {
  const go = () => {
    try { if (typeof BetView !== 'undefined') BetView.mount(); }
    catch (e) { console.error('[BetView] self-mount error', e); }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go, { once: true });
  } else setTimeout(go, 0);
})();

(function injectCss() {
  const css = `
    .bet-card {
      background: var(--bg-surface-2);
      border: 1px solid var(--border-strong);
      border-radius: var(--r-md);
      padding: 12px;
      margin: 12px 0;
    }
    .bet-label {
      font-size: 10px; font-weight: 900; letter-spacing: 2px;
      color: var(--accent); margin-bottom: 6px;
    }
    .bet-text {
      font-size: 15px; font-weight: 900; color: var(--text-primary);
      margin-bottom: 6px; word-break: break-word;
    }
    .bet-status {
      font-size: 11px; font-weight: 700; color: var(--text-secondary);
    }
    .bet-status.good { color: var(--success); }
    .bet-banner {
      margin: 12px 0; padding: 12px 14px;
      border-radius: var(--r-md);
      font-weight: 800; font-size: 14px; text-align: center;
      line-height: 1.4;
    }
    .bet-banner.win {
      background: linear-gradient(135deg, rgba(42,157,143,.2), rgba(42,157,143,.05));
      border: 1px solid var(--success);
      color: var(--success);
    }
    .bet-banner.lose {
      background: linear-gradient(135deg, rgba(230,57,70,.2), rgba(230,57,70,.05));
      border: 1px solid var(--danger);
      color: var(--danger);
    }
  `;
  if (typeof document !== 'undefined' && !document.getElementById('betStyles')) {
    const st = document.createElement('style');
    st.id = 'betStyles';
    st.textContent = css;
    document.head.appendChild(st);
  }
})();