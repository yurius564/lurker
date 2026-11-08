/**
 * Vote phase: the player picks a suspect (or skips) and confirms, the NPCs vote
 * from their own suspicion, then all votes are revealed. At least half of the
 * living voters on one name (no draw) votes them out.
 */
class VoteScene extends Scene {
  static CHOOSE = 'choose';
  static REVEAL = 'reveal';
  static RESULT = 'result';
  static OVER = 'over';

  constructor(village, flow) {
    super(village, flow);
    village.place();  // back to the circle
    this.state = VoteScene.CHOOSE;
    this.choice = null;
    this.votes = [];      // {voter, target}, in reveal order
    this.ballots = [];    // every living voter, target null = skipped
    this.shown = 0;       // how many votes are revealed
    this.timer = 0;
    this.out = null;      // character voted out this round
    this.note(`DAY ${this.day}: vote phase, needs ${this.needed} of ${this.voters.length}`);
  }

  /** Votes needed to be voted out: at least half of the living voters */
  get needed() {
    return Math.ceil(this.voters.length / 2);
  }

  get buttonLabel() {
    return {
      [VoteScene.CHOOSE]: Lang.t(this.choice? 'confirm': 'skip'),
      [VoteScene.REVEAL]: '',
      [VoteScene.RESULT]: Lang.t('nextDay'),
      [VoteScene.OVER]: Lang.t('restart'),
    }[this.state];
  }

  canPick(ch) {
    return this.state === VoteScene.CHOOSE && ch.alive && !ch.isPlayer;
  }

  //#region [ Voting ]
  pick(ch) {
    this.choice = this.choice === ch? null: ch;
    this.characters.forEach(o => o.mark = o === this.choice? 'vote': null);
  }

  /** Player confirmed: NPCs vote without seeing the player's vote, then reveal */
  confirm() {
    this.ballots = [{voter: this.player, target: this.choice}];  // target null = skipped
    this.note(`YOU vote ${this.choice?.name ?? '(skip)'}`);

    const voters = this.voters.length;
    this.npcsAlive.forEach(npc => {
      const {target, value} = this.suspicion.top(npc, this.characters);
      const pct = Math.round(value * 100);
      const votes = target && npc.personality.willVote(value, voters);
      this.ballots.push({voter: npc, target: votes? target: null});
      this.note(votes? `${npc.name} votes ${target.name} (${pct}%)`: `${npc.name} skips (top ${target?.name ?? '-'} ${pct}%)`);
    });

    this.votes = this.ballots.filter(b => b.target);
    this.state = VoteScene.REVEAL;
    this.shown = 0;
    this.timer = 0;
  }

  /** @returns {Map<Character, number>} votes per target */
  countVotes() {
    const counts = new Map();
    this.votes.forEach(({target}) => counts.set(target, (counts.get(target) ?? 0) + 1));
    return counts;
  }

  /**
   * Change an observer's suspicion and keep the reason for the debug log
   * @param {Map} changes target -> {delta, why[]}
   */
  bump(changes, observer, target, delta, why) {
    if(!delta)
      return;
    const real = this.suspicion.add(observer, target, delta);
    if(!real)
      return;
    const c = changes.get(target) ?? {delta: 0, why: []};
    c.delta += real;
    c.why.push(why);
    changes.set(target, c);
  }

  logChanges(observer, changes) {
    const text = [...changes].filter(([, c]) => Math.abs(c.delta) >= 0.05)
      .map(([t, c]) => `${t.name} ${c.delta > 0? '+': ''}${Math.round(c.delta * 100)} (${c.why.join(', ')})`).join('; ');
    if(text)
      this.note(`${observer.name} [${observer.personality.id}]: ${text}`);
  }

  /** Public ballots change what each NPC thinks, by its personality */
  applyInfluence(counts) {
    const total = this.voters.length;
    const max = Math.max(0, ...counts.values());
    const majority = max >= 2? [...counts].filter(([, n]) => n === max).map(([t]) => t): [];

    this.npcsAlive.forEach(o => {
      const p = o.personality, changes = new Map();
      this.ballots.forEach(({voter, target}) => {
        if(voter === o)
          return;
        if(!target)
          return this.bump(changes, o, voter, p.skipped, 'skipped');
        if(target === o)
          this.bump(changes, o, voter, p.votedMe, 'voted me');
        else
          this.bump(changes, o, voter, (0.5 - this.suspicion.get(o, target)) * p.agree, `voted ${target.name}`);
        this.bump(changes, o, voter, p.castVote * (1 + voter.votesCast / this.day), 'eager voter');
        if(majority.includes(target))
          this.bump(changes, o, voter, p.majority, 'joined majority');
      });
      counts.forEach((n, t) => {
        if(t !== o)
          this.bump(changes, o, t, p.crowd * n / total, 'crowd');
      });
      this.logChanges(o, changes);
    });

    this.ballots.forEach(({voter, target}) => target? voter.votesCast++: voter.skips++);
  }

  /** Voters of an eliminated non-monster lose trust, by personality */
  punishWrongOut() {
    const voters = this.votes.filter(v => v.target === this.out).map(v => v.voter);
    this.npcsAlive.forEach(o => {
      const changes = new Map();
      voters.forEach(v => v !== o && this.bump(changes, o, v, o.personality.wrongOut, `voted out ${this.out.name}`));
      this.logChanges(o, changes);
    });
  }

  resolve() {
    const counts = this.countVotes();
    this.applyInfluence(counts);

    const max = Math.max(0, ...counts.values());
    const top = [...counts].filter(([, n]) => n === max).map(([ch]) => ch);

    this.out = max >= this.needed && top.length === 1? top[0]: null;
    const tally = [...counts].sort((a, b) => b[1] - a[1]).map(([ch, n]) => `${ch.name} ${n}`).join(', ') || 'none';
    this.note(`tally: ${tally}`);
    if(this.out)
      this.note(`${this.out.name} voted out, was ${this.out.role}`);
    else
      this.note(max >= this.needed? 'draw, no one out': 'no one reached the threshold');
    if(this.out) {
      this.out.eliminate();
      if(!this.out.isPlayer)
        this.punishWrongOut();
    }

    this.state = this.village.checkEnd(true)? VoteScene.OVER: VoteScene.RESULT;
  }

  press() {
    if(this.state === VoteScene.CHOOSE)
      this.confirm();
    else if(this.state === VoteScene.RESULT)
      this.flow.next();
    else if(this.state === VoteScene.OVER)
      this.pressOver();
  }

  /** Move the pick to the next living NPC around the ring (dir: 1 or -1) */
  cycle(dir) {
    if(this.state !== VoteScene.CHOOSE)
      return;
    const n = this.characters.length;
    let i = this.choice? this.characters.indexOf(this.choice): 0;
    for(let step = 0; step < n; step++) {
      i = (i + dir + n) % n;
      if(this.canPick(this.characters[i])) {
        this.choice = null;
        this.pick(this.characters[i]);
        return;
      }
    }
  }
  //#endregion

  //#region [ Lifecycle ]
  update(dt) {
    super.update(dt);

    if(this.state === VoteScene.REVEAL) {
      this.timer += dt;
      if(this.timer >= CONFIG.vote.revealStep) {
        this.timer = 0;
        if(this.shown < this.votes.length)
          this.shown++;
        else
          this.resolve();
      }
    }
  }

  draw(ctx, time) {
    this.characters.forEach(ch => ch.draw(ctx, time));
    this.drawPips(ctx, this.votes.slice(0, this.shown));
    this.drawCenter(ctx);
    this.drawButton(ctx);
  }

  drawCenter(ctx) {
    const c = CONFIG.res / 2;
    if(this.state === VoteScene.OVER)
      return this.drawOver(ctx);

    PixelFont.draw(ctx, this.village.dayLabel, c, c - 30, PALETTE.gray);
    PixelFont.draw(ctx, Lang.t('votePhase'), c, c - 22, PALETTE.white);

    if(this.state === VoteScene.CHOOSE) {
      PixelFont.draw(ctx, this.choice? Lang.t('voteAsk', this.choice.name): Lang.t('pickSuspect'), c, c - 6, this.choice? PALETTE.red: PALETTE.white);
      PixelFont.draw(ctx, Lang.t('needs', this.needed), c, c + 2, PALETTE.gray);
    }
    else if(this.state === VoteScene.REVEAL)
      PixelFont.draw(ctx, Lang.t('counting'), c, c - 6, PALETTE.white);
    else {
      PixelFont.draw(ctx, this.out? Lang.t('out', this.out.name): Lang.t('noOut'), c, c - 6, this.out? PALETTE.red: PALETTE.white);
      if(this.out)
        PixelFont.draw(ctx, Lang.t('was', Lang.role(this.out.role)), c, c + 2, PALETTE.gray);
    }
  }
  //#endregion
}
