/* ============================================================
   ui/RoomView.js — v2.20
   · Bet panel lives in #roomBetPanel (index.html)
   · Start button disabled until bet is accepted (1v1 only)
   · Custom Rules button for host
   ============================================================ */
const RoomView = {
  _bound: false,
  _starting: false,

  init() {
    if (this._bound) return;
    this._bound = true;

    document.getElementById('btnRoomBack').onclick = () => {
      Sound.click();
      if (Net.active) Net.leave();
      show('screen-home');
    };

    document.getElementById('codeCard').onclick = () => {
      const code = (Net.room && Net.room.code) || '';
      if (!code) return;
      try { navigator.clipboard.writeText(code); } catch (e) {}
      Toast.show('Code copied');
      if (typeof Haptics !== 'undefined') Haptics.tap();
    };

    document.getElementById('btnAddBot').onclick = () => {
      Sound.click(); Net.addBot();
    };

    document.getElementById('btnStartMatch').onclick = () => {
      if (this._starting) return;
      this._starting = true;
      const btn = document.getElementById('btnStartMatch');
      if (btn) { btn.disabled = true; btn.textContent = 'Starting…'; }
      Sound.click();
      try { GameFlow.hostStartGame(); }
      finally {
        setTimeout(() => {
          this._starting = false;
          this.render();
        }, 1200);
      }
    };

    document.getElementById('chatForm').onsubmit = e => {
      e.preventDefault();
      const inp = document.getElementById('chatInput');
      const text = inp.value.trim();
      if (!text) return;
      Net.chat(text);
      inp.value = '';
    };

    document.getElementById('btnClearChat').onclick = () => {
      Sound.click(); Net.clearChat();
    };

    // Custom Rules button (host only) — event delegation
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('#btnCustomRules')) {
        Sound.click();
        if (typeof RuleStudioView !== 'undefined') {
          RuleStudioView.openModal(() => {
            const rules = JSON.parse(JSON.stringify(RuleStudioView.rules));
            Net.updateRoom({ customRules: rules, rules: RuleStudioView.presetKey });
          });
        }
      }
    });

    // Universe dropdown
    const ru = document.getElementById('roomUniverse');
    Object.values(UNIVERSES).forEach(u => {
      const o = document.createElement('option');
      o.value = u.id;
      o.textContent = `${u.icon} ${u.name}`;
      ru.appendChild(o);
    });
    ru.onchange = () => {
      const u = UNIVERSES[ru.value];
      if (!u) return;
      Net.updateRoom({
        universe: u.id, universeId: u.id,
        universeName: `${u.icon} ${u.name}`,
        customDef: null
      });
    };

    // Rules dropdown
    const rr = document.getElementById('roomRules');
    Object.entries(RULE_PRESETS).forEach(([k, p]) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = `${p.icon} ${p.name}`;
      rr.appendChild(o);
    });
    rr.onchange = () => {
      Net.updateRoom({ rules: rr.value, rulesKey: rr.value, customRules: null });
    };
  },

  /* ── Net event handlers ─────────────────────────────── */
  onCreated() { this._resetChatLog(); this.render(); },
  onJoined()  { this._resetChatLog(); this.render(); },

  onRejoined(msg) {
    this.render();
    const state = msg.state || (msg.room && msg.room.state) || null;
    const rulesKey = msg.rulesKey || (msg.room && msg.room.rulesKey) || 'classic';
    if (state) {
      if (ArenaView.state) GameFlow.applyStateUpdate(state);
      else GameFlow.enterMultiplayerGame(state, rulesKey);
    }
  },

  onRoomUpdate(msg) {
    this.render();
    if (!msg.room) return;
    if (msg.room.started === false && ArenaView.state) {
      this._teardownGame();
      show('screen-room');
      Toast.show('Match ended');
      return;
    }
    if (msg.room.started && msg.room.state && !ArenaView.state) {
      GameFlow.enterMultiplayerGame(msg.room.state, msg.room.rulesKey);
    }
  },

  onChat(msg) {
    const log = document.getElementById('chatLog');
    if (!log) return;
    const data = msg.line || msg;
    const line = document.createElement('div');
    if (msg.system || data.system) {
      line.className = 'chat-line system';
      line.textContent = data.text || '';
    } else {
      line.className = 'chat-line';
      const who = data.name || data.from || 'Player';
      const av  = data.avatar || '🙂';
      const txt = data.text || '';
      line.innerHTML =
        `<span class="chat-av">${esc(av)}</span>` +
        `<span class="who">${esc(who)}:</span>` +
        `<span class="txt">${esc(txt)}</span>`;
    }
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
    const fromId = data.from || data.playerId;
    if (fromId && fromId !== Net.playerId && typeof Haptics !== 'undefined') Haptics.tap();
  },

  onChatCleared(msg) {
    const log = document.getElementById('chatLog');
    if (!log) return;
    log.innerHTML = '';
    const line = document.createElement('div');
    line.className = 'chat-line system';
    line.textContent = (msg && msg.by) ? `${msg.by} cleared the chat` : 'Chat cleared';
    log.appendChild(line);
  },

  onEmote(msg) {
    const el = document.createElement('div');
    el.className = 'emoji-float';
    el.textContent = msg.emoji || '';
    el.style.left = (10 + Math.random() * 80) + '%';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  },

  onPlayerLeft(msg) {
    const id = msg.playerId || msg.id;
    const name = msg.name || 'A player';
    const log = document.getElementById('chatLog');
    if (log) {
      const line = document.createElement('div');
      line.className = 'chat-line system';
      line.textContent = `${name} left`;
      log.appendChild(line);
      log.scrollTop = log.scrollHeight;
    }
    if (!Net.isHost) return;
    const s = ArenaView.state;
    if (!s || s.winner !== null) return;
    const idx = s.players.findIndex(p => p.id === id);
    if (idx === -1 || s.players[idx].isBot) return;
    s.players[idx].isBot = true;
    s.players[idx].name += ' (AI)';
    GameEngine.log(`${esc(s.players[idx].name)} disconnected — bot took over`, 'hot');
    ArenaView.render();
    if (s.turn === idx) {
      clearTimeout(GameEngine._botTimer);
      const myState = s;
      GameEngine._botTimer = setTimeout(() => {
        if (GameEngine.state !== myState) return;
        if (myState.winner !== null) return;
        BotAI.takeTurn(myState);
      }, 600);
    }
  },

  onRoomClosed(msg) {
    Toast.show((msg && msg.reason) || 'Room closed');
    this._teardownGame();
    Net.active = false; Net.isHost = false; Net.room = null;
    show('screen-home');
  },

  onKicked(msg) {
    Toast.show((msg && msg.reason) || 'Removed from room');
    this._teardownGame();
    Net.active = false; Net.isHost = false; Net.room = null;
    show('screen-home');
  },

  onError(msg) {
    Toast.show((msg && (msg.reason || msg.message)) || 'Something went wrong');
    Sound.bad();
  },

  /* ── Helpers ────────────────────────────────────────── */
  _resetChatLog() {
    const log = document.getElementById('chatLog');
    if (log) log.innerHTML = '';
  },

  _teardownGame() {
    ArenaView.stopTimer();
    if (GameEngine._botTimer) { clearTimeout(GameEngine._botTimer); GameEngine._botTimer = null; }
    ArenaView.state = null;
    ArenaView._cardPool = null;
    if (typeof PrivacyScreen !== 'undefined') PrivacyScreen.hide();
    ['hand', 'opponents', 'log', 'discardPile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
  },

  /* ── Rendering ──────────────────────────────────────── */
  render() {
    const room = Net.room;
    if (!room) return;

    document.getElementById('roomCode').textContent = room.code || '·····';

    const clearBtn = document.getElementById('btnClearChat');
    if (clearBtn) clearBtn.style.display = Net.isHost ? '' : 'none';

    const players = room.players || [];
    const onlineCount = players.filter(p => p.connected).length;
    document.getElementById('roomCount').textContent = `${players.length}/8`;
    document.getElementById('roomStatusLine').textContent =
      Net.isHost ? `You're the host · ${onlineCount} online`
                 : `Waiting for host · ${onlineCount} online`;

    /* Player list */
    const list = document.getElementById('playerList');
    list.innerHTML = '';
    players.forEach(p => {
      const isHost = (p.id === room.hostId) || (p.isHost === true);
      const isMe = p.id === Net.playerId;
      const row = document.createElement('div');
      row.className = 'player-row' + (!p.connected && !p.isBot ? ' disconnected' : '');
      row.innerHTML = `
        <div class="player-av">${esc(p.avatar || '🙂')}</div>
        <div class="player-info">
          <div class="player-name">
            ${esc(p.name || 'Player')}${isMe ? ' <span style="color:var(--text-tertiary);font-size:11px">(you)</span>' : ''}
            ${isHost ? '<span class="crown">Host</span>' : ''}
          </div>
          <div class="player-meta">${p.isBot ? 'Bot' : (p.connected ? 'Ready' : 'Disconnected')}</div>
        </div>`;
      const actions = document.createElement('div');
      actions.className = 'player-actions';
      if (Net.isHost && !isMe) {
        const b = document.createElement('button');
        b.className = 'btn-mini';
        b.textContent = p.isBot ? 'Remove' : 'Kick';
        b.onclick = () => { if (p.isBot) Net.removeBot(p.id); else Net.kick(p.id); };
        actions.appendChild(b);
      }
      row.appendChild(actions);
      list.appendChild(row);
    });

    /* Add bot */
    const addBotRow = document.getElementById('addBotRow');
    if (addBotRow) addBotRow.style.display = (Net.isHost && players.length < 8) ? '' : 'none';

    /* Settings (host only) */
    const settings = document.getElementById('roomSettings');
    if (settings) settings.style.display = Net.isHost ? '' : 'none';
    if (Net.isHost) {
      const ru = document.getElementById('roomUniverse');
      const rr = document.getElementById('roomRules');
      const uniKey = room.universe || room.universeId;
      const rulesKey = room.rules || room.rulesKey;
      if (uniKey && ru.value !== uniKey) ru.value = uniKey;
      if (rulesKey && rr.value !== rulesKey) rr.value = rulesKey;
    }

    /* Custom Rules button — inject once, host-only */
    let rulesBtnWrap = document.getElementById('customRulesBtnWrap');
    if (Net.isHost && !rulesBtnWrap && settings) {
      const panel = settings.querySelector('.room-panel');
      if (panel) {
        rulesBtnWrap = document.createElement('div');
        rulesBtnWrap.id = 'customRulesBtnWrap';
        rulesBtnWrap.style.cssText = 'margin-top:10px';
        rulesBtnWrap.innerHTML = `<button class="btn ghost" id="btnCustomRules" style="width:100%">⚙️ Advanced Custom Rules</button>`;
        panel.appendChild(rulesBtnWrap);
      }
    }
    if (rulesBtnWrap) rulesBtnWrap.style.display = Net.isHost ? '' : 'none';

    /* Bet panel — BetView owns the rendering */
    if (typeof BetView !== 'undefined' && BetView._render) {
      try { BetView._render(); } catch (e) { console.warn('[RoomView] bet render', e); }
    }

    /* Start button + bet gate */
    const startBtn = document.getElementById('btnStartMatch');
    const waiting = document.getElementById('waitingBanner');
    const humans = players.filter(p => !p.isBot);
    const canStart = Net.isHost && players.length >= 2;

    const is1v1 = (humans.length === 2 && players.length === 2);
    let betBlocked = false;
    if (is1v1 && room.bet && room.bet.text && !room.bet.accepted) {
      betBlocked = true;
    }

    if (startBtn) {
      startBtn.style.display = canStart ? '' : 'none';
      startBtn.disabled = betBlocked;
      startBtn.textContent = betBlocked ? 'Waiting for bet…' : 'Start Match';
    }
    if (waiting) {
      waiting.style.display = (!Net.isHost || !canStart) ? '' : 'none';
      if (!Net.isHost) waiting.textContent = 'Waiting for the host to start…';
      else if (players.length < 2) waiting.textContent = 'Need at least 2 players to start.';
      else if (betBlocked) waiting.textContent = 'Bet set — waiting for opponent to accept.';
      else waiting.textContent = '';
    }
  }
};