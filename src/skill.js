/**
 * Player skill cards. Each day deals 3 distinct skills weighted by rarity;
 * once-per-run skills leave the pool after being played.
 * kind: defend (listener suspects you less), accuse (listener suspects target more),
 * charm (big defend), frame (every NPC suspects target more), reveal (you learn target's role).
 * The effect scales with the listener's own suspicion (see Skill.apply).
 */
class Skill {
  static LIST = [
    {id: 'CHAT',  rarity: 'common',   limit: 'none', listener: true,  target: false, kind: 'defend', base: 0.1,  note: 'listener suspects you less'},
    {id: 'HINT',  rarity: 'common',   limit: 'none', listener: true,  target: true,  kind: 'accuse', base: 0.1,  note: 'listener suspects target more'},
    {id: 'ALIBI', rarity: 'uncommon', limit: 'day',  listener: true,  target: false, kind: 'defend', base: 0.25, note: 'listener suspects you a lot less'},
    {id: 'SNOOP', rarity: 'uncommon', limit: 'day',  listener: false, target: true,  kind: 'reveal', base: 0,    note: 'learn the role of target'},
    {id: 'RUMOR', rarity: 'uncommon', limit: 'day',  listener: true,  target: true,  kind: 'accuse', base: 0.25, note: 'listener suspects target a lot more'},
    {id: 'CHARM', rarity: 'rare',     limit: 'run',  listener: true,  target: false, kind: 'charm',  base: 0,    note: 'listener almost forgets you'},
    {id: 'FRAME', rarity: 'rare',     limit: 'run',  listener: false, target: true,  kind: 'frame',  base: 0.2,  note: 'every NPC suspects target more'},
  ];

  // special card: always in hand, once a day, replaces a skill use
  static KILL = {id: 'KILL', rarity: 'kill', limit: 'day', listener: true, target: false, kind: 'kill', note: 'kill the listener'};

  static RARITY = {common: 6, uncommon: 3, rare: 1};

  /** @returns {object[]} n distinct skills, weighted by rarity */
  static deal(n, runUsed) {
    let pool = Skill.LIST.filter(s => !runUsed.has(s.id));
    const hand = [];
    while(hand.length < n && pool.length) {
      const s = Role.pick(pool, x => Skill.RARITY[x.rarity]);
      hand.push(s);
      pool = pool.filter(x => x !== s);
    }
    return hand;
  }

  /**
   * Accuse factor: how much the listener believes an accusation of target,
   * from its suspicion of target vs of the player. Below 0 it backfires.
   */
  static belief(village, listener, target) {
    const s = village.suspicion, diff = s.get(listener, target) - s.get(listener, village.player);
    return Math.max(-1, Math.min(2, 1 + 2 * diff));
  }

  /**
   * Apply a played skill
   * @returns {string} log text
   */
  static apply(village, skill, listener, target) {
    const s = village.suspicion, me = village.player, pct = d => `${d > 0? '+': ''}${Math.round(d * 100)}`;

    const accuse = (l, base) => {
      const f = Skill.belief(village, l, target);
      if(f >= 0)
        return `${l.name}: ${target.name} ${pct(s.add(l, target, base * f))} (x${f.toFixed(1)})`;
      return `${l.name}: YOU ${pct(s.add(l, me, base * -f))} (backfire x${f.toFixed(1)})`;
    };

    switch(skill.kind) {
      case 'defend': {
        const trust = 1 - s.get(listener, me);   // a suspicious listener believes you less
        return `${listener.name}: YOU ${pct(s.add(listener, me, -skill.base * (0.5 + trust)))}`;
      }
      case 'charm': {
        const v = s.get(listener, me);
        return `${listener.name}: YOU ${pct(s.add(listener, me, -v * (1 - v / 2)))}`;
      }
      case 'accuse':
        return accuse(listener, skill.base);
      case 'reveal':
        target.revealed = true;
        return `${target.name} is ${target.role}`;
      case 'frame':
        return village.npcsAlive.filter(o => o !== target).map(o => accuse(o, skill.base)).join('; ');
    }
    return '';
  }
}
