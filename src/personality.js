/**
 * Behaviour templates: how an NPC reacts to public votes and when it votes.
 * Reaction weights are suspicion deltas (0..1 scale) applied by the observer
 * to a voter after each vote reveal. Unset fields take DEFAULT values.
 */
class Personality {
  static DEFAULT = {
    voteMin: 0.5,        // votes only if its top suspicion reaches this
    minAlive: Infinity,  // votes only when living voters <= this
    votedMe: 0.1,        // X voted for me
    castVote: 0,         // X voted at all (grows with how often X votes)
    skipped: 0,          // X did not vote
    agree: 0.2,          // X voted T: += (0.5 - my suspicion of T) * agree
    crowd: 0.4,          // my suspicion of T += (T's vote share) * crowd
    majority: 0,         // X joined the most-voted target
    wrongOut: 0.15,      // X voted out someone who was not the monster
  };

  // threat: how hard the template makes the game for the player (1 easy .. 5 hard)
  static TEMPLATES = [
    {id: 'holdout',    threat: 1, note: 'will not vote until few are left', minAlive: 4, voteMin: 0.4, agree: 0.3},
    {id: 'follower',   threat: 2, note: 'goes with the crowd',             crowd: 1, agree: 0.1, votedMe: 0.05, voteMin: 0.45},
    {id: 'contrarian', threat: 2, note: 'distrusts the majority',          majority: 0.15, crowd: -0.2},
    {id: 'wary',       threat: 3, note: 'distrusts eager voters',          castVote: 0.08, crowd: 0.2},
    {id: 'hothead',    threat: 3, note: 'votes on little evidence',        voteMin: 0.25, votedMe: 0.2, agree: 0.1},
    {id: 'vengeful',   threat: 3, note: 'turns on whoever votes for it',   votedMe: 0.35, agree: 0.1, crowd: 0.2},
    {id: 'pusher',     threat: 4, note: 'distrusts those who skip',        skipped: 0.15},
    {id: 'judge',      threat: 5, note: 'punishes bad votes',              agree: 0.6, wrongOut: 0.4, votedMe: 0.05, voteMin: 0.6, crowd: 0.2},
  ];

  // target average threat per NPC
  static DIFFICULTY = {easy: 2, normal: 2.75, hard: 3.5};

  /**
   * Deal one template per NPC so the total threat lands on the difficulty's
   * budget (average threat x NPC count), preferring decks with few repeats
   * @returns {Personality[]}
   */
  static deal(count, difficulty) {
    const target = Personality.DIFFICULTY[difficulty] * count;
    let best = null, bestScore = Infinity;
    for(let tries = 0; tries < 400; tries++) {
      const deck = Array.from({length: count}, () => Personality.TEMPLATES[Math.floor(Math.random() * Personality.TEMPLATES.length)]);
      const sum = deck.reduce((n, t) => n + t.threat, 0);
      const repeats = count - new Set(deck).size;
      const score = Math.abs(sum - target) + repeats * 0.5;
      if(score < bestScore) {
        best = deck;
        bestScore = score;
      }
    }
    return best.map(t => new Personality(t));
  }

  constructor(template) {
    Object.assign(this, Personality.DEFAULT, template);
  }

  /** Roles bend the template: mods.mul multiplies a field, mods.add adds to it */
  applyRole(role) {
    Object.entries(role.mods.mul ?? {}).forEach(([k, m]) => this[k] *= m);
    Object.entries(role.mods.add ?? {}).forEach(([k, a]) => this[k] += a);
  }

  /** Would this NPC vote at all now, given its top suspicion? */
  willVote(value, voters) {
    return voters <= this.minAlive && value >= this.voteMin;
  }
}
