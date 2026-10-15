/* ============================================================
   ui/LobbyView.js — v3.1 Home screen controller
   · All 4 modes shown in a single grid
   · No 1v1 tab (online 1v1 lives inside Multiplayer)
   ============================================================ */
const AVATARS = ['🙂', '😎', '🤖', '👾', '🦊', '🐲', '🦉', '🐺', '👽', '🧙', '🥷', '🦁'];

const LobbyView = {
  profile: { name: 'Player', avatar: '🙂' },
  players: 4,
  bots: 3,
  universeId: 'marvel',
  customDef: null,

  init() {
    try {
      const p = JSON.parse(localStorage.getItem('rv_profile') || 'null');
      if (p && p.name) this.profile = p;
    } catch (e) {}
    this._applyProfile();

    // Universe dropdown
    const sel = document.getElementById('selUniverse');
    if (sel) {
      sel.innerHTML = '';
      Object.values(UNIVERSES).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${u.icon} ${u.name}`;
        sel.appendChild(opt);
      });
      sel.value = this.universeId;
      sel.onchange = () => {
        this.universeId = sel.value;
        if (sel.value !== 'custom') {
          const customOpt = Array.from(sel.options).find(o => o.value === 'custom');
          if (customOpt) customOpt.remove();
          this.customDef = null;
        }
        this._updateHero();
        Sound.click();
      };
    }

    // Players dropdown
    const selP = document.getElementById('selPlayers');
    if (selP) {
      selP.value = this.players;
      selP.onchange = () => {
        this.players = parseInt(selP.value, 10);
        const maxBots = this.players - 1;
        const selBots = document.getElementById('selBots');
        if (this.bots > maxBots) {
          this.bots = maxBots;
          if (selBots) selBots.value = String(maxBots);
        }
        if (selBots) {
          Array.from(selBots.options).forEach(o => {
            o.disabled = parseInt(o.value, 10) > maxBots;
          });
        }
        this._updateHero();
      };
    }

    // Bots dropdown
    const selB = document.getElementById('selBots');
    if (selB) {
      selB.value = this.bots;
      selB.onchange = () => {
        this.bots = parseInt(selB.value, 10);
        this._updateHero();
      };
    }

    // Mode cards
    this._buildModeCards();

    // Buttons
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.onclick = fn;
    };

    bind('btnProfile', () => { Sound.click(); this.openProfileModal(); });
    bind('btnQuickPlay', () => { Sound.click(); GameFlow.startGame(); });
    bind('btnOpenRules', () => {
      Sound.click();
      RuleStudioView.openModal(() => {
        this._markActiveMode(RuleStudioView.presetKey);
        this._updateHero();
      });
    });
    bind('btnOpenCustom', () => {
      Sound.click();
      Modal.customDeck(def => this.addCustomUniverse(def));
    });

    this._updateHero();
  },

  _buildModeCards() {
    const grid = document.getElementById('mainModeGrid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.entries(RULE_PRESETS).forEach(([key, p]) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mode-card' + (key === RuleStudioView.presetKey ? ' sel' : '');
      el.dataset.mode = key;
      el.innerHTML = `
        <span class="mc-icon">${p.icon || '🎴'}</span>
        <span class="mc-name">${esc(p.name || key)}</span>
        <span class="mc-desc">${esc(p.desc || '')}</span>
      `;
      el.onclick = () => {
        Sound.click();
        RuleStudioView.presetKey = key;
        RuleStudioView.rules = RULE_PRESETS[key].rules();
        this._markActiveMode(key);
        this._updateHero();
      };
      grid.appendChild(el);
    });
  },

  _markActiveMode(key) {
    document.querySelectorAll('.mode-card').forEach(el => {
      el.classList.toggle('sel', el.dataset.mode === key);
    });
  },

  _applyProfile() {
    const av = document.getElementById('myAvatar');
    const nm = document.getElementById('myName');
    if (av) av.textContent = this.profile.avatar;
    if (nm) nm.textContent = this.profile.name;
  },

  _saveProfile() {
    try { localStorage.setItem('rv_profile', JSON.stringify(this.profile)); } catch (e) {}
  },

  _updateHero() {
    const sub = document.querySelector('.bh-sub');
    if (!sub) return;
    let universeName;
    if (this.universeId === 'custom' && this.customDef) {
      universeName = this.customDef.name;
    } else {
      const u = UNIVERSES[this.universeId];
      universeName = u ? u.name : 'Unknown';
    }
    const preset = RULE_PRESETS[RuleStudioView.presetKey];
    const rulesName = preset ? preset.name : 'Custom';
    sub.textContent = `${universeName} · ${this.players} players · ${rulesName}`;
  },

  addCustomUniverse(def) {
    this.customDef = def;
    this.universeId = 'custom';
    const sel = document.getElementById('selUniverse');
    if (sel) {
      Array.from(sel.options).forEach(o => { if (o.value === 'custom') o.remove(); });
      const opt = document.createElement('option');
      opt.value = 'custom';
      opt.textContent = `🎨 ${def.name}`;
      sel.appendChild(opt);
      sel.value = 'custom';
    }
    this._updateHero();
    Toast.show(`Loaded "${def.name}"`);
  },

  /* Kept for backward compat with app.js — no 1v1 tab anymore */
  get1v1Bet() { return null; },
  get1v1P2Name() { return 'Player 2'; },

  openProfileModal() {
    const m = Modal.open(`
      <h2>Your Profile</h2>
      <div class="hint">Your name shows to other players.</div>
      <label class="fl">Display Name</label>
      <input id="profName" maxlength="14" autocomplete="off" value="${esc(this.profile.name)}">
      <label class="fl" style="margin-top:16px">Avatar</label>
      <div id="profAvatars" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px"></div>
      <button class="btn primary big" id="profSave" style="width:100%;margin-top:20px">Save</button>
    `);
    if (!m) return;

    const grid = m.querySelector('#profAvatars');
    AVATARS.forEach(a => {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = a;
      const sel = a === this.profile.avatar;
      el.style.cssText = `
        aspect-ratio: 1;
        border-radius: 12px;
        font-size: 22px;
        background: ${sel ? 'var(--accent-soft)' : 'var(--bg-surface-2)'};
        border: 2px solid ${sel ? 'var(--accent)' : 'var(--border)'};
        cursor: pointer;
        font-family: inherit;
        transition: .15s;
      `;
      el.onclick = () => {
        this.profile.avatar = a;
        grid.querySelectorAll('button').forEach(x => {
          x.style.background = 'var(--bg-surface-2)';
          x.style.borderColor = 'var(--border)';
        });
        el.style.background = 'var(--accent-soft)';
        el.style.borderColor = 'var(--accent)';
        Sound.click();
      };
      grid.appendChild(el);
    });

    m.querySelector('#profSave').onclick = () => {
      const n = m.querySelector('#profName').value.trim();
      if (n) this.profile.name = n;
      this._saveProfile();
      this._applyProfile();
      Sound.click();
      Modal.close();
      Toast.show(`Hi, ${this.profile.name}`);
    };
  }
};