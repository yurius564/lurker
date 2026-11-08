/**
 * On-screen texts per language (CONFIG.lang). The font is uppercase with no
 * accents or commas (only Ç), so pt is written without them. Ids (roles, skills) stay
 * English in the logic and the debug log; only what is drawn goes through here.
 */
class Lang {
  static NAMES = {en: 'ENGLISH', pt: 'PORTUGUES'};

  static TEXT = {
    en: {
      start: 'START', easy: 'EASY', normal: 'NORMAL', hard: 'HARD',
      limit7: 'ONE WEEK', limit30: 'ONE MONTH', limit0: 'UNLIMITED',
      you: 'YOU', day: 'DAY', step: 'STEP',
      restart: 'RESTART', confirm: 'CONFIRM', cancel: 'CANCEL', pass: 'PASS', skip: 'SKIP', nextDay: 'NEXT DAY',
      passed: 'YOU PASSED',
      is: (name, role) => `${name} IS ${role}`,
      survived: name => `${name} SURVIVED`,
      protected: name => `${name} WAS PROTECTED`,
      killed: name => `${name} KILLED`,
      playOrPass: 'PLAY A CARD OR PASS', whoKill: 'WHO TO KILL?', talkWho: 'TALK TO WHO?', aboutWho: 'ABOUT WHO?',
      killAsk: name => `KILL ${name}?`,
      to: name => `to ${name}`,
      about: name => `about ${name}`,
      votePhase: 'VOTE PHASE', voteAsk: name => `VOTE ${name}?`, pickSuspect: 'PICK A SUSPECT',
      needs: n => `NEEDS ${n} VOTES`, counting: 'COUNTING',
      out: name => `${name} OUT`, noOut: 'NO ONE OUT', was: role => `WAS ${role}`,
      win: 'YOU WIN', lose: 'FOUND OUT', winWhy: 'NO ONE LEFT TO STOP YOU', timeUp: 'OUT OF TIME',
      killedBy: (name, role) => `KILLED BY ${name} THE ${role}`, gameOver: 'GAME OVER',
      roles: 'ROLES', close: 'CLICK TO CLOSE', menu: 'MENU',
    },
    pt: {
      start: 'INICIAR', easy: 'FACIL', normal: 'NORMAL', hard: 'DIFICIL',
      limit7: 'UMA SEMANA', limit30: 'UM MES', limit0: 'SEM LIMITE',
      you: 'VOCE', day: 'DIA', step: 'AÇAO',
      restart: 'REINICIAR', confirm: 'CONFIRMAR', cancel: 'CANCELAR', pass: 'PASSAR', skip: 'PULAR', nextDay: 'PROXIMO DIA',
      passed: 'VOCE PASSOU',
      is: (name, role) => `${name} E ${role}`,
      survived: name => `${name} SOBREVIVEU`,
      protected: name => `${name} FOI PROTEGIDO`,
      killed: name => `${name} MORTO`,
      playOrPass: 'JOGUE UMA CARTA OU PASSE', whoKill: 'MATAR QUEM?', talkWho: 'FALAR COM QUEM?', aboutWho: 'SOBRE QUEM?',
      killAsk: name => `MATAR ${name}?`,
      to: name => `para ${name}`,
      about: name => `sobre ${name}`,
      votePhase: 'VOTACAO', voteAsk: name => `VOTAR EM ${name}?`, pickSuspect: 'ESCOLHA UM SUSPEITO',
      needs: n => `PRECISA DE ${n} VOTOS`, counting: 'CONTANDO',
      out: name => `${name} FORA`, noOut: 'NINGUEM SAIU', was: role => `ERA ${role}`,
      win: 'VOCE VENCEU', lose: 'DESCOBERTO', winWhy: 'NINGUEM SOBROU PARA TE PARAR', timeUp: 'SEM TEMPO',
      killedBy: (name, role) => `MORTO POR ${name} O ${role}`, gameOver: 'FIM DE JOGO',
      roles: 'PAPEIS', close: 'CLIQUE PARA FECHAR', menu: 'MENU',
    },
  };

  static ROLES = {
    en: {MONSTER: 'MONSTER', VILLAGER: 'VILLAGER', GOSSIP: 'GOSSIP', SEER: 'SEER', DOCTOR: 'DOCTOR', KNIGHT: 'KNIGHT', HUNTER: 'HUNTER'},
    pt: {MONSTER: 'MONSTRO', VILLAGER: 'ALDEAO', GOSSIP: 'FOFOQUEIRO', SEER: 'VIDENTE', DOCTOR: 'MEDICO', KNIGHT: 'CAVALEIRO', HUNTER: 'CACADOR'},
  };

  // card names fit 9 letters
  static SKILLS = {
    en: {CHAT: 'CHAT', HINT: 'HINT', ALIBI: 'ALIBI', SNOOP: 'SNOOP', RUMOR: 'RUMOR', CHARM: 'CHARM', FRAME: 'FRAME', KILL: 'KILL'},
    pt: {CHAT: 'PAPO', HINT: 'DICA', ALIBI: 'ALIBI', SNOOP: 'XERETAR', RUMOR: 'BOATO', CHARM: 'CHARME', FRAME: 'ARMACAO', KILL: 'MATAR'},
  };

  static NOTES = {
    en: {
      CHAT: 'listener suspects you less', HINT: 'listener suspects target more', ALIBI: 'listener suspects you a lot less',
      SNOOP: 'learn the role of target', RUMOR: 'listener suspects target a lot more', CHARM: 'listener almost forgets you',
      FRAME: 'every NPC suspects target more', KILL: 'kill the listener',
    },
    pt: {
      CHAT: 'ouvinte suspeita menos de voce', HINT: 'ouvinte suspeita mais do alvo', ALIBI: 'ouvinte suspeita bem menos de voce',
      SNOOP: 'descubra o papel do alvo', RUMOR: 'ouvinte suspeita bem mais do alvo', CHARM: 'ouvinte quase esquece de voce',
      FRAME: 'todo NPC suspeita mais do alvo', KILL: 'mate o ouvinte',
    },
  };

  /** Role summaries for the ? window, [role id, text] ('YOU' = the player) */
  static HELP = {
    en: [
      ['YOU', 'the monster. kill and deceive everyone.'],
      ['VILLAGER', 'no skill.'],
      ['GOSSIP', 'spreads its top suspect to someone.'],
      ['SEER', 'once a day guess if someone is the monster. with about 70% certainty.'],
      ['DOCTOR', 'whoever it talks to cannot be killed that day.'],
      ['KNIGHT', 'guard. if it talked to your victim that step it kills you. tends to not vote.'],
      ['HUNTER', 'cannot be killed. if it talked to your victim that step it kills you.'],
    ],
    pt: [
      ['YOU', 'o monstro. mate e engane todos.'],
      ['VILLAGER', 'sem habilidade.'],
      ['GOSSIP', 'espalha seu maior suspeito para alguem.'],
      ['SEER', 'uma vez por dia adivinha se alguem e o monstro. com cerca de 70% de certeza.'],
      ['DOCTOR', 'com quem ele conversa nao pode morrer naquele dia.'],
      ['KNIGHT', 'guarda. se falou com sua vitima naquela açao ele mata voce. tende a nao votar.'],
      ['HUNTER', 'nao pode morrer. se falou com sua vitima naquela açao ele mata voce.'],
    ],
  };

  /** Text by key in the current language; function entries get args */
  static t(key, ...args) {
    const v = Lang.TEXT[CONFIG.lang][key] ?? Lang.TEXT.en[key];
    return typeof v === 'function'? v(...args): v;
  }

  static role(id) { return Lang.ROLES[CONFIG.lang][id] ?? id; }
  static skill(id) { return Lang.SKILLS[CONFIG.lang][id] ?? id; }
  static note(id) { return Lang.NOTES[CONFIG.lang][id] ?? ''; }
  static get help() { return Lang.HELP[CONFIG.lang]; }
}
