/** Shared game state: characters, suspicion, day counter, log and result */
class Village {
  constructor() {
    this.reset();
  }

  reset() {
    const list = NPCS.slice(0, CONFIG.npcs[CONFIG.difficulty]);
    const deck = Personality.deal(list.length, CONFIG.difficulty);
    const roles = Role.deal(list.length, CONFIG.difficulty);
    deck.forEach((p, i) => p.applyRole(roles[i]));

    this.player = new Character(MONSTER, true);
    this.characters = [this.player, ...list.map((data, i) => new Character(data, false, deck[i], roles[i]))];
    this.suspicion = new Suspicion(this.characters);
    this.day = 1;
    this.log = [];          // debug event log: {day, text}
    this.result = '';       // 'win' | 'lose'
    this.killedBy = null;   // guard that killed the player
    this.timeUp = false;    // lost on the time limit
    this.runUsed = new Set(); // once-per-run skills already played
    this.place();

    const threat = deck.reduce((n, p) => n + p.threat, 0);
    this.note(`NEW GAME: ${CONFIG.difficulty}, threat ${threat} (target ${Personality.DIFFICULTY[CONFIG.difficulty] * list.length})`);
    this.note(`roles: ${this.npcs.map(ch => `${ch.name} ${ch.role}`).join(', ')}`);
  }

  note(text) {
    this.log.push({day: this.day, text});
  }

  /** Seat everyone on a ring, the player at the bottom */
  place() {
    const c = CONFIG.res / 2, r = CONFIG.circle.radius, n = this.characters.length;
    this.characters.forEach((ch, i) => {
      const angle = Math.PI / 2 + i * Math.PI * 2 / n;
      ch.x = Math.round(c + Math.cos(angle) * r);
      ch.y = Math.round(c + Math.sin(angle) * r);
    });
  }

  get npcs() {
    return this.characters.filter(ch => !ch.isPlayer);
  }

  get npcsAlive() {
    return this.npcs.filter(ch => ch.alive);
  }

  get voters() {
    return this.characters.filter(ch => ch.alive);
  }

  /** DAY 3/7, or DAY 3 without a time limit */
  get dayLabel() {
    return `${Lang.t('day')} ${this.day}${CONFIG.limit? `/${CONFIG.limit}`: ''}`;
  }

  /**
   * @param {boolean} dayOver the day's vote just ended: the time limit applies
   * @returns {string} '' while the game goes on
   */
  checkEnd(dayOver=false) {
    if(!this.result) {
      if(!this.player.alive)
        this.result = 'lose';
      else if(this.npcsAlive.length <= 1)
        this.result = 'win';
      else if(dayOver && CONFIG.limit && this.day >= CONFIG.limit) {
        this.result = 'lose';
        this.timeUp = true;
      }
      if(this.result)
        this.note(this.result === 'win'? 'GAME OVER: you win': `GAME OVER: ${this.timeUp? 'out of time': this.killedBy? `killed by ${this.killedBy.name} the ${this.killedBy.role}`: 'you were found out'}`);
    }
    return this.result;
  }
}
