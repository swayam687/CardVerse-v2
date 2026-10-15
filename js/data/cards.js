/* ============================================================
   data/cards.js — UNIVERSES (v2.19)
   ---------------------------------------------------------
   No rarity. No antisocial cards. 3 signatures + 1 ultimate
   per universe, non-overlapping between universes.

   Deck per universe (base 112 cards):
     Numbers   : 4 colors × (1 zero + 9×2)      = 76
     Actions   : 4 colors × 3 UNO-standard × 2  = 24
     Wilds     : 4 plain + 4 wild+4             = 8
     Signatures: 3 (colored, per universe)      = 3
     Ultimate  : 1 (wild)                       = 1
     Total                                      = 112

   No Mercy extras add 11 more cards, only spawning in No
   Mercy mode (filtered out via noMercyOnly flag).

   Signature effects are universe-locked:
     Marvel:  SHIELD, SWAP_HANDS, REVEAL  (blue)
     Naruto:  COPY, EXTRA_TURN, STEAL     (green / yellow)
   ============================================================ */
const COLOR_META = {
  red:    { label: 'Red',    hex: '#E63946', theme: 'Power' },
  blue:   { label: 'Blue',   hex: '#3A7BD5', theme: 'Tech' },
  green:  { label: 'Green',  hex: '#2A9D8F', theme: 'Strength' },
  yellow: { label: 'Yellow', hex: '#E9C46A', theme: 'Speed' },
  wild:   { label: 'Wild',   hex: '#9B5DE5', theme: 'Any' }
};

/* Deprecated — kept so old custom decks that reference RARITY_META
   don't throw. Never used by the base game anymore. */
const RARITY_META = {};

const UNIVERSES = {
  marvel: {
    id: 'marvel', name: 'Marvel', icon: '🦸',
    tagline: 'Heroes, villains, and one very expensive glove.',
    colors: ['red', 'blue', 'green', 'yellow'],
    numberNames: {
      red:    ['Red Guardian','Hawkeye','Black Widow','Falcon','War Machine','Heimdall','Sif','Winter Soldier','Mockingbird','Punisher'],
      blue:   ['Shuri','Nick Fury','Wong','Mantis','Star-Lord','Captain Marvel','Maria Hill','Agent Coulson','Everett Ross','Hank Pym'],
      green:  ['Okoye','Valkyrie','Korg',"M'Baku",'Wasp','Rocket','Nebula','Yondu','Nova','Adam Warlock'],
      yellow: ['Darcy Lewis','Jimmy Woo','Happy Hogan','Ned Leeds','Jane Foster','Erik Selvig','Pepper Potts','Nakia','Luis','Katy']
    },
    actions: [
      /* ═══════════ RED — Avengers Frontline ═══════════ */
      { name:'Hulk', color:'red', type:'action', icon:'💥', count:2,
        text:'SMASH — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Scarlet Witch', color:'red', type:'action', icon:'🔮', count:2,
        text:'Chaos Magic — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Thor', color:'red', type:'action', icon:'🔨', count:2,
        text:'Mjolnir — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ BLUE — S.H.I.E.L.D. & Cosmic ═══════════ */
      { name:'Iron Man', color:'blue', type:'action', icon:'🤖', count:2,
        text:'Repulsor Blast — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Captain America', color:'blue', type:'action', icon:'🛡️', count:2,
        text:'Shield Deflection — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Ultron', color:'blue', type:'action', icon:'⚙️', count:2,
        text:'Replication Beam — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ GREEN — Street-Level & Guardians ═══════════ */
      { name:'Drax', color:'green', type:'action', icon:'🗡️', count:2,
        text:'Nothing Goes Over My Head — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Ant-Man', color:'green', type:'action', icon:'🐜', count:2,
        text:'Pym Particles — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Gamora', color:'green', type:'action', icon:'⚔️', count:2,
        text:'Deadliest Woman — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ YELLOW — Speed & Quirky ═══════════ */
      { name:'Bullseye', color:'yellow', type:'action', icon:'🎯', count:2,
        text:'Perfect Aim — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Whiplash', color:'yellow', type:'action', icon:'⚡', count:2,
        text:'Whip Lash — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Green Goblin', color:'yellow', type:'action', icon:'🎃', count:2,
        text:'Pumpkin Bomb — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ WILD ═══════════ */
      { name:'Loki', color:'wild', type:'special', icon:'🎭', count:4,
        text:'Illusion — change the active color.',
        effects:[] },
      { name:'Thanos', color:'wild', type:'special', icon:'🧤', count:4,
        text:'The Snap — change the color; next player draws 4.',
        effects:[{type:'DRAW',target:'next',amount:4}] },

      /* ═══════════ SIGNATURE ABILITIES — Marvel-only, BLUE ═══════════ */
      { name:'Spider-Man', color:'blue', type:'action', icon:'🕷️', count:1,
        tier:'signature',
        text:'Spider-Sense — negate the next attack on you.',
        effects:[{type:'SHIELD',target:'self'}] },
      { name:'Doctor Strange', color:'blue', type:'action', icon:'🌀', count:1,
        tier:'signature',
        text:'Time Stone — swap hands with any player you choose.',
        effects:[{type:'SWAP_HANDS',target:'choose'}] },
      { name:'Vision', color:'blue', type:'action', icon:'💎', count:1,
        tier:'signature',
        text:'Mind Stone — reveal the next player\'s hand.',
        effects:[{type:'REVEAL',target:'next'}] },

      /* ═══════════ ULTIMATE ═══════════ */
      { name:'Infinity Gauntlet', color:'wild', type:'special', icon:'💠', count:1,
        tier:'ultimate',
        text:'Ultimate — next player is skipped; the one after them draws 4.',
        effects:[{type:'DRAW',target:'next',amount:4},{type:'SKIP',target:'next'}] },

      /* ═══════════ NO MERCY EXTRAS (only spawn when enabled) ═══════════ */
      { name:'+6', color:'red', type:'action', icon:'🔴', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'red', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every red card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+6', color:'blue', type:'action', icon:'🔵', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'blue', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every blue card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+6', color:'green', type:'action', icon:'🟢', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'green', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every green card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+6', color:'yellow', type:'action', icon:'🟡', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'yellow', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every yellow card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+10', color:'wild', type:'special', icon:'💀', count:2, noMercyOnly:true, tier:'noMercy',
        text:'+10 — next player draws 10.',
        effects:[{type:'DRAW',target:'next',amount:10}] },
      { name:'Skip Everyone', color:'wild', type:'special', icon:'🚫', count:2, noMercyOnly:true, tier:'noMercy',
        text:'Skip Everyone — every other player skips; you play again.',
        effects:[{type:'SKIP_EVERYONE'}] }
    ]
  },

  naruto: {
    id: 'naruto', name: 'Naruto', icon: '🍥',
    tagline: 'Chakra natures, jutsu, and a lot of shouting.',
    colors: ['red', 'blue', 'green', 'yellow'],
    numberNames: {
      red:    ['Kagami','Sakura','Ino','Choji','Asuma','Kurenai','Anko','Hayate','Genma','Rin'],
      blue:   ['Karin','Jugo','Mei','Yagura','Ao','Mangetsu','Kushimaru','Juzo','Ameyuri','Mabui'],
      green:  ['Kankuro','Shino','Kiba','Hinata','Neji','Rock Lee','TenTen','Yamato','Sai','Shikamaru'],
      yellow: ['C','Omoi','Samui','Izumo','Kotetsu','Shikaku','Inoichi','Raido','Tsunade','Onoki']
    },
    actions: [
      /* ═══════════ RED — Akatsuki ═══════════ */
      { name:'Pain', color:'red', type:'action', icon:'🖐️', count:2,
        text:'Shinra Tensei — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Madara', color:'red', type:'action', icon:'👁️', count:2,
        text:'Perfect Susanoo — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Itachi', color:'red', type:'action', icon:'🔥', count:2,
        text:'Amaterasu — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ BLUE — Mist & Kage ═══════════ */
      { name:'Zabuza', color:'blue', type:'action', icon:'🌫️', count:2,
        text:'Hidden Mist — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Suigetsu', color:'blue', type:'action', icon:'💦', count:2,
        text:'Hydrification — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Kisame', color:'blue', type:'action', icon:'🦈', count:2,
        text:'Samehada — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ GREEN — Konoha 12 ═══════════ */
      { name:'Gaara', color:'green', type:'action', icon:'🏜️', count:2,
        text:'Sand Burial — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Temari', color:'green', type:'action', icon:'🌪️', count:2,
        text:'Kamaitachi — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Jiraiya', color:'green', type:'action', icon:'🐸', count:2,
        text:'Sage Mode — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ YELLOW — Lightning & Support ═══════════ */
      { name:'Sasuke', color:'yellow', type:'action', icon:'⚡', count:2,
        text:'Chidori — next player skips their turn.',
        effects:[{type:'SKIP',target:'next'}] },
      { name:'Kakashi', color:'yellow', type:'action', icon:'👁️', count:2,
        text:'Sharingan — reverse direction.',
        effects:[{type:'REVERSE'}] },
      { name:'Killer B', color:'yellow', type:'action', icon:'🐙', count:2,
        text:'Eight-Tails — next player draws 2.',
        effects:[{type:'DRAW',target:'next',amount:2}] },

      /* ═══════════ WILD ═══════════ */
      { name:'Rinnegan', color:'wild', type:'special', icon:'👁️', count:4,
        text:'Change the active color.',
        effects:[] },
      { name:'Kaguya', color:'wild', type:'special', icon:'🌙', count:4,
        text:'Infinite Tsukuyomi — change the color; next player draws 4.',
        effects:[{type:'DRAW',target:'next',amount:4}] },

      /* ═══════════ SIGNATURE ABILITIES — Naruto-only ═══════════ */
      { name:'Naruto', color:'green', type:'action', icon:'🍥', count:1,
        tier:'signature',
        text:'Shadow Clone — copy the last action card\'s ability, or make the next player draw 2 if there\'s nothing to copy.',
        effects:[{type:'COPY'}] },
      { name:'Minato', color:'yellow', type:'action', icon:'💠', count:1,
        tier:'signature',
        text:'Flying Thunder God — take another turn immediately.',
        effects:[{type:'EXTRA_TURN'}] },
      { name:'Orochimaru', color:'green', type:'action', icon:'🐍', count:1,
        tier:'signature',
        text:'Kusanagi — take 1 card of your choice from the next player.',
        effects:[{type:'STEAL',target:'next',amount:1,pick:true}] },

      /* ═══════════ ULTIMATE ═══════════ */
      { name:'Hagoromo', color:'wild', type:'special', icon:'🌌', count:1,
        tier:'ultimate',
        text:'Ultimate — reverse direction; the next player in the new order draws 4.',
        effects:[{type:'REVERSE'},{type:'DRAW',target:'next',amount:4}] },

      /* ═══════════ NO MERCY EXTRAS (only spawn when enabled) ═══════════ */
      { name:'+6', color:'red', type:'action', icon:'🔴', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'red', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every red card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+6', color:'blue', type:'action', icon:'🔵', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'blue', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every blue card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+6', color:'green', type:'action', icon:'🟢', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'green', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every green card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+6', color:'yellow', type:'action', icon:'🟡', count:1, noMercyOnly:true, tier:'noMercy',
        text:'+6 — next player draws 6.',
        effects:[{type:'DRAW',target:'next',amount:6}] },
      { name:'Discard All', color:'yellow', type:'action', icon:'🗑️', count:1, noMercyOnly:true, tier:'noMercy',
        text:'Discard All — discard every yellow card in your hand.',
        effects:[{type:'DISCARD_COLOR',target:'self'}] },
      { name:'+10', color:'wild', type:'special', icon:'💀', count:2, noMercyOnly:true, tier:'noMercy',
        text:'+10 — next player draws 10.',
        effects:[{type:'DRAW',target:'next',amount:10}] },
      { name:'Skip Everyone', color:'wild', type:'special', icon:'🚫', count:2, noMercyOnly:true, tier:'noMercy',
        text:'Skip Everyone — every other player skips; you play again.',
        effects:[{type:'SKIP_EVERYONE'}] }
    ]
  }
};