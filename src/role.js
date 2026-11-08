/**
 * NPC roles: a day-phase skill plus strong changes to the behaviour weights.
 * mods.mul multiplies a personality field, mods.add adds to it.
 * unique roles appear at most once; guard roles kill the monster when they witness a kill.
 */
class Role {
  static LIST = {
    VILLAGER: {id: 'VILLAGER', weight: 4, unique: false, note: 'no skill, small talk',
      mods: {}},
    GOSSIP:   {id: 'GOSSIP',   weight: 2, unique: false, note: 'pushes its top suspect on everyone it talks to',
      mods: {mul: {crowd: 2, agree: 0.5}}},
    SEER:     {id: 'SEER',     weight: 1, unique: true,  note: 'once a day sees if its listener is the monster (70% right)',
      mods: {mul: {agree: 1.5}, add: {voteMin: 0.1}}},
    DOCTOR:   {id: 'DOCTOR',   weight: 1, unique: true,  note: 'once a day protects the first NPC it talks to for the whole day',
      mods: {mul: {votedMe: 0.5, skipped: 0.5}}},
    KNIGHT:   {id: 'KNIGHT',   weight: 1, unique: true,  guard: true, note: 'kills the monster if it witnesses a kill; calm voter',
      mods: {mul: {votedMe: 0.5}, add: {voteMin: 0.15}}},
    HUNTER:   {id: 'HUNTER',   weight: 1, unique: true,  guard: true, note: 'cannot be killed; kills the monster if it witnesses a kill; points others at its suspect',
      mods: {add: {voteMin: -0.1, castVote: 0.04}}},
  };

  // per difficulty: roles always dealt ('GUARD' = knight or hunter) and the max number of guards
  static RULES = {
    easy:   {require: [],               guards: 0},
    normal: {require: ['SEER'],         guards: 1},
    hard:   {require: ['SEER', 'GUARD'], guards: 2},
  };

  static pick(list, weight) {
    let roll = Math.random() * list.reduce((n, x) => n + weight(x), 0);
    return list.find(x => (roll -= weight(x)) < 0) ?? list.at(-1);
  }

  /** @returns {object[]} one role per NPC, shuffled */
  static deal(count, difficulty) {
    const rule = Role.RULES[difficulty], LIST = Role.LIST;
    const ids = rule.require.map(r => r === 'GUARD'? Role.pick(['KNIGHT', 'HUNTER'], () => 1): r);
    const guards = () => ids.filter(id => LIST[id].guard).length;

    while(ids.length < count) {
      const pool = Object.values(LIST).filter(r => !(r.unique && ids.includes(r.id)) && !(r.guard && guards() >= rule.guards));
      ids.push(Role.pick(pool, r => r.weight).id);
    }
    return ids.toSorted(() => Math.random() - 0.5).map(id => LIST[id]);
  }
}
