/** Each NPC keeps its own suspicion (0..1) of every other character */
class Suspicion {
  /** @param {Character[]} characters */
  constructor(characters) {
    this.values = new Map(); // observer id -> Map(target id -> value)
    characters.filter(ch => !ch.isPlayer).forEach(o => {
      const row = new Map();
      characters.filter(t => t !== o).forEach(t => row.set(t.id, Suspicion.random(CONFIG.suspicion.start)));
      this.values.set(o.id, row);
    });
  }

  static random([min, max]) {
    return min + Math.random() * (max - min);
  }

  get(observer, target) {
    return this.values.get(observer.id)?.get(target.id) ?? 0;
  }

  /** @returns {number} the change actually applied (after clamping) */
  add(observer, target, delta) {
    const row = this.values.get(observer.id);
    if(!row || !row.has(target.id))
      return 0;
    const old = row.get(target.id), value = Math.min(1, Math.max(0, old + delta));
    row.set(target.id, value);
    return value - old;
  }

  /**
   * Most suspected living character for an observer (ties broken at random)
   * @returns {{target: Character|null, value: number}}
   */
  top(observer, characters) {
    let best = [], value = -1;
    characters.filter(t => t.alive && t !== observer).forEach(t => {
      const v = this.get(observer, t);
      if(v > value) {
        value = v;
        best = [t];
      }
      else if(v === value)
        best.push(t);
    });
    return {target: best[Math.floor(Math.random() * best.length)] ?? null, value};
  }
}
