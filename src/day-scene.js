/**
 * Day phase: 3 skill cards (plus KILL) for the whole day, then 3 steps.
 * Each step the NPCs talk first (pips show who talks to whom), then the player
 * plays one card on an NPC, or passes. One player action per NPC per day.
 * Layout: characters in two staggered rows on top, cards in the middle,
 * KILL and PASS / CONFIRM at the bottom.
 */
class DayScene extends Scene {
  static CHOOSE = 'choose';
  static OVER = 'over';

  static CARD = {w: 38, h: 50, gap: 6, art: 32, y: 168};
  // player position, and the NPC seats of the left half as offsets from the player
  // (bottom-left first, measured from the user's reference); the right half mirrors them
  static ARC = {x: 128, y: 84, seats: [[-94, 26], [-94, -16], [-64, -54], [-24, -64]]};
  static BOTTOM = 238;                    // y of the main button
  static SPLIT = 13;                      // space between the skills and the KILL card (line in the middle)

  constructor(village, flow) {
    super(village, flow);
    this.state = DayScene.CHOOSE;
    this.hand = Skill.deal(CONFIG.day.hand, village.runUsed).map(skill => ({skill, used: false}));
    this.killCard = {skill: Skill.KILL, used: false};
    this.step = 0;
    this.last = '';   // short summary of the player's last action
    this.protected = new Set();  // NPCs the DOCTOR protects for the whole day
    this.note(`DAY ${this.day}: day phase, hand ${this.hand.map(c => c.skill.id).join(', ')}`);
    this.layout();
    this.nextStep();
  }

  /** Player in the center, NPCs on the seats around it, left to right */
  layout() {
    const {x, y, seats} = DayScene.ARC, npcs = this.village.npcs;
    const half = seats.slice(-Math.ceil(npcs.length / 2));   // fewer NPCs drop the bottom seats first
    const all = [...half, ...half.toReversed().map(([dx, dy]) => [-dx, dy])];
    this.player.x = x;
    this.player.y = y;
    npcs.forEach((ch, i) => {
      const [dx, dy] = all[i] ?? [0, 0];
      ch.x = x + dx;
      ch.y = y + dy;
    });
  }

  nextStep() {
    this.step++;
    this.sel = {card: null, listener: null, target: null};
    this.marks();
    this.npcTurn();
  }

  //#region [ NPC turn ]
  /** Every living NPC talks to someone it trusts, and may use its role skill */
  npcTurn() {
    this.talks = [];          // {voter: speaker, target: listener}, shown as pips
    this.npcsAlive.forEach(npc => {
      const listener = this.pickListener(npc);
      if(!listener)
        return;
      this.talks.push({voter: npc, target: listener});
      this.npcAct(npc, listener);
    });
  }

  pickListener(npc) {
    const options = this.voters.filter(ch => ch !== npc);
    if(!options.length)
      return null;
    return Role.pick(options, ch => (1 - this.suspicion.get(npc, ch)) ** CONFIG.day.talkTrust + 0.01);
  }

  npcAct(npc, listener) {
    const d = CONFIG.day;
    switch(npc.role) {
      case 'GOSSIP':
        return this.share(npc, listener, d.gossip, 'gossips');
      case 'HUNTER':
        return this.share(npc, listener, d.hunter, 'warns');
      case 'DOCTOR':
        if(npc.doctorDay !== this.day && !listener.isPlayer) {
          npc.doctorDay = this.day;   // one NPC, protected until the day ends
          this.protected.add(listener);
          return this.share(npc, listener, d.smallTalk, 'protects');
        }
        break;
      case 'SEER':
        if(npc.seerDay !== this.day) {
          npc.seerDay = this.day;
          return this.vision(npc, listener);
        }
    }
    this.share(npc, listener, d.smallTalk, 'talks to');
  }

  /** Speaker passes its top suspect to the listener, weighted by the listener's trust in it */
  share(npc, listener, amount, verb) {
    const who = `${npc.name} [${npc.role}] ${verb}`;
    if(listener.isPlayer)
      return this.note(`${who} YOU`);
    const top = this.suspicion.top(npc, this.characters).target;
    if(!top || top === listener)
      return this.note(`${who} ${listener.name}`);
    const trust = 1 - this.suspicion.get(listener, npc);
    const real = this.suspicion.add(listener, top, amount * trust);
    this.note(`${who} ${listener.name}: ${listener.name} on ${top.name} +${Math.round(real * 100)}`);
  }

  vision(npc, listener) {
    const d = CONFIG.day, right = Math.random() < d.seerRight;
    const seen = right? listener.isPlayer: !listener.isPlayer;
    this.suspicion.add(npc, listener, seen? d.seerFound: d.seerClear);
    this.note(`${npc.name} [SEER] sees ${listener.isPlayer? 'YOU': listener.name}: ${seen? 'MONSTER': 'clear'}${right? '': ' (wrong)'}`);
  }
  //#endregion

  //#region [ Player turn ]
  get complete() {
    const {card, listener, target} = this.sel;
    return card && (!card.skill.listener || listener) && (!card.skill.target || target);
  }

  get buttonLabel() {
    if(this.state === DayScene.OVER)
      return Lang.t('restart');
    return Lang.t(this.complete? 'confirm': this.sel.card? 'cancel': 'pass');
  }

  /** Main button (PASS / CANCEL / CONFIRM / RESTART), a bit bigger than the vote one */
  get button() {
    const label = this.buttonLabel, w = PixelFont.width(label) + 20, h = 15;
    return {label, x: Math.round(CONFIG.res / 2 - w / 2), y: DayScene.BOTTOM, w, h};
  }

  canPick(ch) {
    const {card, listener, target} = this.sel;
    if(this.state !== DayScene.CHOOSE || !card || !ch.alive || ch.isPlayer)
      return false;
    if(ch === listener || ch === target)
      return true;  // click again to undo
    if(card.skill.listener && !listener)
      return !ch.used;
    if(card.skill.target && !target)
      return card.skill.listener? ch !== listener: !ch.used && !(card.skill.kind === 'reveal' && ch.revealed);
    return false;
  }

  pick(ch) {
    const s = this.sel;
    if(ch === s.listener)
      s.listener = s.target = null;
    else if(ch === s.target)
      s.target = null;
    else if(s.card.skill.listener && !s.listener)
      s.listener = ch;
    else
      s.target = ch;
    this.marks();
  }

  marks() {
    const kill = this.sel.card?.skill.kind === 'kill';
    this.characters.forEach(ch => ch.mark = ch === this.sel.listener? (kill? 'kill': 'pick'): ch === this.sel.target? 'target': null);
  }

  pickCard(card) {
    if(this.state !== DayScene.CHOOSE || card.used)
      return;
    this.sel = {card: this.sel.card === card? null: card, listener: null, target: null};
    this.marks();
  }

  press() {
    if(this.state === DayScene.OVER)
      return this.pressOver();
    if(this.complete) {
      this.play();
      this.sel = {card: null, listener: null, target: null};
      this.marks();
    }
    else if(this.sel.card) {
      this.sel = {card: null, listener: null, target: null};
      this.marks();
      return;
    }
    else {
      this.note('YOU pass');
      this.last = Lang.t('passed');
    }
    this.endStep();
  }

  play() {
    const {card, listener, target} = this.sel, skill = card.skill;
    card.used = true;
    if(skill.limit === 'run')
      this.village.runUsed.add(skill.id);
    [listener, skill.listener? null: target].forEach(ch => ch && (ch.used = true));

    if(skill.kind === 'kill')
      return this.kill(listener);

    const text = Skill.apply(this.village, skill, listener, target);
    this.note(`YOU play ${skill.id}${listener? ` to ${listener.name}`: ''}${target? ` about ${target.name}`: ''}: ${text}`);
    this.last = skill.kind === 'reveal'? Lang.t('is', target.name, Lang.role(target.role)): DayScene.phrase(skill, listener, target);
  }

  /** Witnesses: NPCs who talked to the victim this step. A guard kills the monster, a doctor saves the victim */
  kill(victim) {
    const witnesses = this.talks.filter(t => t.target === victim && t.voter.alive).map(t => t.voter);
    const guard = witnesses.find(w => w.roleData.guard);
    if(guard) {
      this.village.killedBy = guard;
      this.player.eliminate();
      this.note(`YOU try to kill ${victim.name}: ${guard.name} the ${guard.role} saw it and killed you`);
      return;
    }

    if(victim.role === 'HUNTER') {
      this.note(`YOU try to kill ${victim.name}: the HUNTER cannot be killed, failed`);
      this.last = Lang.t('survived', victim.name);
      const real = this.suspicion.add(victim, this.player, CONFIG.day.witness);
      this.note(`${victim.name} fought you off: YOU +${Math.round(real * 100)}`);
    }
    else if(this.protected.has(victim)) {
      this.note(`YOU try to kill ${victim.name}: protected by the DOCTOR, failed`);
      this.last = Lang.t('protected', victim.name);
    }
    else {
      victim.eliminate();
      this.note(`YOU kill ${victim.name}, was ${victim.role}`);
      this.last = Lang.t('killed', victim.name);
    }
    witnesses.filter(w => w !== victim).forEach(w => {
      const real = this.suspicion.add(w, this.player, CONFIG.day.witness);
      this.note(`${w.name} witnessed it: YOU +${Math.round(real * 100)}`);
    });
  }

  endStep() {
    if(this.village.checkEnd()) {
      this.state = DayScene.OVER;
      this.sel = {card: null, listener: null, target: null};
      this.marks();
      return;
    }
    if(this.step < CONFIG.day.steps)
      this.nextStep();
    else
      this.flow.next();
  }
  //#endregion

  //#region [ Input ]
  /** Skill cards, then a separator, then the KILL card */
  get cardRects() {
    const {w, h, gap, y} = DayScene.CARD, split = DayScene.SPLIT, c = CONFIG.res / 2;
    const cards = [...this.hand, this.killCard];
    const total = cards.length * w + (this.hand.length - 1) * gap + split;
    const x0 = Math.round(c - total / 2);
    return cards.map((card, i) => ({card, x: x0 + i * (w + gap) + (card === this.killCard? split - gap: 0), y, w, h}));
  }

  cardAt(px, py) {
    return this.cardRects.find(r => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h)?.card ?? null;
  }

  click(px, py) {
    const card = this.cardAt(px, py);
    if(card)
      return this.pickCard(card);
    super.click(px, py);
  }

  /** Number keys 1-3 pick a card, 4 the KILL */
  key(n) {
    const card = n === 3? this.killCard: this.hand[n];
    if(card)
      this.pickCard(card);
  }
  //#endregion

  //#region [ Drawing ]
  draw(ctx, time) {
    this.characters.forEach(ch => ch.draw(ctx, time));
    if(CONFIG.debug)
      this.drawPips(ctx, this.talks, t => [t.x, t.y + 27]);  // who talks to whom, under the name
    if(this.state === DayScene.OVER) {
      this.drawOver(ctx, DayScene.CARD.y + 16);  // in the card area, clear of the characters
      return this.drawButton(ctx);
    }
    this.drawCenter(ctx);
    this.drawButton(ctx);
  }

  /** "HINT to BOB about IVY", "ALIBI to CEL", "FRAME about IVY" */
  static phrase(skill, listener, target) {
    return [Lang.skill(skill.id), listener && Lang.t('to', listener.name), target && Lang.t('about', target.name)].filter(Boolean).join(' ');
  }

  get prompt() {
    const {card, listener, target} = this.sel;
    if(!card)
      return Lang.t('playOrPass');
    const s = card.skill;
    if(s.listener && !listener)
      return Lang.t(s.kind === 'kill'? 'whoKill': 'talkWho');
    if(s.target && !target)
      return Lang.t('aboutWho');
    if(s.kind === 'kill')
      return Lang.t('killAsk', listener.name);
    return DayScene.phrase(s, listener, target);
  }

  drawCenter(ctx) {
    const c = CONFIG.res / 2, {y, h} = DayScene.CARD;
    PixelFont.draw(ctx, `${this.village.dayLabel}  ${Lang.t('step')} ${this.step}/${CONFIG.day.steps}`, c, y - 18, PALETTE.gray);
    PixelFont.draw(ctx, this.prompt, c, y - 10, !this.sel.card? PALETTE.white: this.sel.card.skill.kind === 'kill'? PALETTE.red: PALETTE.yellow);

    const rects = this.cardRects, hot = this.mouse && this.cardAt(...this.mouse);
    rects.forEach(r => this.drawCard(ctx, r, r.card === this.sel.card, r.card === hot));

    // vertical line between the skills and the KILL card
    const kill = rects.at(-1), lx = kill.x - Math.ceil(DayScene.SPLIT / 2);
    ctx.fillStyle = PALETTE.gray;
    ctx.fillRect(lx, y + 4, 1, h - 8);

    const shown = hot ?? this.sel.card, info = shown? Lang.note(shown.skill.id): this.last;
    if(info)
      PixelFont.draw(ctx, info, c, y + h + 12, PALETTE.gray);
  }

  drawCard(ctx, r, selected, hot) {
    const {card} = r, s = card.skill, y = r.y - (selected? 3: 0), kill = s.kind === 'kill';
    const frame = card.used? PALETTE.gray: kill && selected? PALETTE.red: selected || hot? PALETTE.yellow: kill? PALETTE.red: PALETTE.white;
    ctx.fillStyle = frame;
    ctx.fillRect(r.x, y, r.w, r.h);
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(r.x + 1, y + 1, r.w - 2, r.h - 2);

    // 24x24 art centered in the 32x32 art slot, in the label color
    const color = card.used? PALETTE.gray: kill? PALETTE.red: PALETTE.white;
    const art = DayScene.CARD.art, pad = (art - CardArts.SIZE) / 2;
    CardArts.draw(ctx, s.id, r.x + (r.w - art) / 2 + pad, y + 3 + pad, color);

    PixelFont.draw(ctx, Lang.skill(s.id), r.x + r.w / 2, y + r.h - 8, color);
  }
  //#endregion
}
