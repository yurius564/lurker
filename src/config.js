// Low-res square screen, scaled up by whole numbers (pixel look)
const CONFIG = {
  res: 256,
  debug: false,         // debug panel open (backquote toggles): also shows who talks to whom in the day phase
  difficulty: 'normal', // easy | normal | hard (Personality.DIFFICULTY)
  npcs: {easy: 6, normal: 8, hard: 8}, // NPCs per difficulty (first ones of NPCS)
  limit: 7,             // days to win in, 0 = unlimited (start menu)
  lang: 'en',           // en | pt (start menu toggle, texts in src/lang.js)
  circle: {radius: 92, size: 24},
  suspicion: {
    start: [0, 0.3],     // random starting value per observer -> target
    // vote reactions and voting rules per NPC: src/personality.js
  },
  vote: {revealStep: 0.3}, // seconds between each revealed vote
  day: {
    steps: 3,
    hand: 3,             // skill cards dealt each day
    talkTrust: 3,        // NPCs pick listeners by (1 - suspicion) ^ this
    smallTalk: 0.08,     // listener's suspicion of the speaker's top suspect += this x trust
    gossip: 0.2,         // same, for GOSSIP
    hunter: 0.15,        // same, for HUNTER
    seerRight: 0.7,      // chance the SEER sees the truth
    seerFound: 0.5,      // SEER suspicion change when it sees the monster
    seerClear: -0.3,     // ... when it sees someone clear
    witness: 0.6,        // a witness of a kill suspects the player this much more
  },
};

// 8-bit palette (PICO-8 style colors), black background
const PALETTE = {
  black : '#000000',
  white : '#fff1e8',
  gray  : '#5f574f',
  dark  : '#1d2b53',
  red   : '#ff004d',
  orange: '#ffa300',
  yellow: '#ffec27',
  green : '#00e436',
  blue  : '#29adff',
  indigo: '#83769c',
  pink  : '#ff77a8',
  peach : '#ffccaa',
  teal  : '#008751',
  brown : '#ab5236',
};

const MONSTER = {name: 'YOU', color: PALETTE.red, role: 'MONSTER'};

// roles are dealt per game: src/role.js
const NPCS = [
  {name: 'ADA', color: PALETTE.orange},
  {name: 'BOB', color: PALETTE.yellow},
  {name: 'CEL', color: PALETTE.green},
  {name: 'DAX', color: PALETTE.blue},
  {name: 'EVE', color: PALETTE.indigo},
  {name: 'FIN', color: PALETTE.pink},
  {name: 'GUS', color: PALETTE.peach},
  {name: 'IVY', color: PALETTE.teal},
];
