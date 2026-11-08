/** Base for the circle scenes (day and vote): shared drawing and input helpers */
class Scene {
  /**
   * @param {Village} village
   * @param {{next: Function, restart: Function, menu: Function}} flow
   */
  constructor(village, flow) {
    this.village = village;
    this.flow = flow;
    this.mouse = null;
    this.village.characters.forEach(ch => {
      ch.mark = null;
      ch.used = false;
      ch.hovered = false;
      ch.pointed = false;
    });
  }

  get characters() { return this.village.characters; }
  get suspicion() { return this.village.suspicion; }
  get player() { return this.village.player; }
  get npcsAlive() { return this.village.npcsAlive; }
  get voters() { return this.village.voters; }
  get day() { return this.village.day; }

  note(text) {
    this.village.note(text);
  }

  //#region [ Override ]
  /** Label of the center button, '' hides it */
  get buttonLabel() { return ''; }
  /** Can this character be hovered / picked now? */
  canPick(ch) { return false; }
  press() {}
  pick(ch) {}
  //#endregion

  //#region [ Input ]
  get button() {
    const c = CONFIG.res / 2, label = this.buttonLabel;
    const w = PixelFont.width(label) + 10, h = 11;
    return {label, x: c - Math.ceil(w / 2), y: c + this.buttonY, w, h};
  }

  get buttonY() { return 16; }

  hitButton(px, py) {
    const b = this.button;
    return b.label && px >= b.x && px < b.x + b.w && py >= b.y && py < b.y + b.h;
  }

  //#region [ Corner buttons ]
  static helpOpen = false;   // roles window, kept across scenes

  /** Bottom-right corner: ! (hover shows known roles) then ? (click opens the roles window) */
  corner(i) {
    const size = 13, gap = 3;
    return {x: CONFIG.res - (size + gap) * (2 - i), y: CONFIG.res - size - gap, w: size, h: size};
  }

  get peekRect() { return this.corner(0); }
  get helpRect() { return this.corner(1); }

  /** Bottom-left: back to the start menu (drops the current game) */
  get menuRect() {
    const size = 13, gap = 3;
    return {x: gap, y: CONFIG.res - size - gap, w: PixelFont.width(Lang.t('menu')) + 8, h: size};
  }

  hitRect(b, px, py) {
    return px >= b.x && px < b.x + b.w && py >= b.y && py < b.y + b.h;
  }

  /** Click entry point: the roles window eats every click while open */
  tap(px, py) {
    if(Scene.helpOpen)
      return Scene.helpOpen = false;
    if(this.hitRect(this.helpRect, px, py))
      return Scene.helpOpen = true;
    if(this.hitRect(this.menuRect, px, py))
      return this.flow.menu();
    this.click(px, py);
  }
  //#endregion

  hover(px, py) {
    this.mouse = [px, py];
    Character.peek = !Scene.helpOpen && this.hitRect(this.peekRect, px, py);
    this.characters.forEach(ch => {
      ch.hovered = this.canPick(ch) && ch.contains(px, py);
      ch.pointed = !Scene.helpOpen && ch.contains(px, py);
    });
  }

  click(px, py) {
    if(this.hitButton(px, py))
      return this.press();
    const ch = this.characters.find(o => o.contains(px, py));
    if(ch && this.canPick(ch))
      this.pick(ch);
  }

  /** Restart button on the game-over screen */
  pressOver() {
    this.flow.restart();
  }
  //#endregion

  //#region [ Drawing ]
  update(dt) {
    this.characters.forEach(ch => ch.update(dt, ch.isPlayer? 5: 1 + Math.round(this.suspicion.get(ch, this.player) * 8)));
  }

  /**
   * Pips in the source's color next to each target, toward the center
   * @param {{voter: Character, target: Character}[]} pairs
   * @param {(target: Character) => number[]} [place] center of a target's pip row
   */
  drawPips(ctx, pairs, place=null) {
    const c = CONFIG.res / 2, pip = 4, gap = 1;
    const byTarget = new Map();
    pairs.forEach(({voter, target}) => {
      if(!byTarget.has(target))
        byTarget.set(target, []);
      byTarget.get(target).push(voter);
    });

    byTarget.forEach((voters, target) => {
      const dx = c - target.x, dy = c - target.y, len = Math.hypot(dx, dy) || 1;
      const [px, py] = place? place(target): [Math.round(target.x + dx / len * 26), Math.round(target.y + dy / len * 26)];
      const w = voters.length * (pip + gap) - gap;
      voters.forEach((v, i) => {
        const x = Math.round(px - w / 2) + i * (pip + gap), y = py - pip / 2;
        ctx.fillStyle = PALETTE.white;
        ctx.fillRect(x - 1, y - 1, pip + 2, pip + 2);
        ctx.fillStyle = v.color;
        ctx.fillRect(x, y, pip, pip);
      });
    });
  }

  drawButton(ctx) {
    const b = this.button;
    if(!b.label)
      return;
    const hot = this.mouse && this.hitButton(...this.mouse);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if(!hot) {
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }
    PixelFont.draw(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, hot? PALETTE.black: PALETTE.white);
  }

  drawCornerButton(ctx, b, label, on) {
    ctx.fillStyle = on? PALETTE.yellow: PALETTE.gray;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if(!on) {
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }
    PixelFont.draw(ctx, label, b.x + b.w / 2, b.y + b.h / 2, on? PALETTE.black: PALETTE.gray);
  }

  /** Corner buttons, then the roles window on top of everything */
  drawHelp(ctx) {
    const hotHelp = this.mouse && this.hitRect(this.helpRect, ...this.mouse);
    this.drawCornerButton(ctx, this.menuRect, Lang.t('menu'), !Scene.helpOpen && this.mouse && this.hitRect(this.menuRect, ...this.mouse));
    this.drawCornerButton(ctx, this.peekRect, '!', Character.peek);
    this.drawCornerButton(ctx, this.helpRect, '?', Scene.helpOpen || hotHelp);
    if(Scene.helpOpen)
      this.drawHelpWindow(ctx);
  }

  /** Left-aligned text (PixelFont.draw centers) */
  text(ctx, text, x, y, color) {
    PixelFont.draw(ctx, text, x + PixelFont.width(text) / 2, y, color);
  }

  /** Split text into lines of at most max characters */
  wrap(text, max) {
    const lines = [''];
    text.split(' ').forEach(word => {
      const line = lines.at(-1);
      if(line && (line + ' ' + word).length > max)
        lines.push(word);
      else
        lines[lines.length - 1] = line? `${line} ${word}`: word;
    });
    return lines;
  }

  drawHelpWindow(ctx) {
    const names = Lang.help.map(([id]) => id === 'YOU'? Lang.t('you'): Lang.role(id));
    const m = 12, x = m, w = CONFIG.res - m * 2, line = 8;
    const col = Math.max(...names.map(n => PixelFont.width(n))) + 6, max = Math.floor((w - col - 12) / 4);
    const rows = Lang.help.map(([id, text], i) => [id, names[i], this.wrap(text, max)]);
    const h = 26 + rows.reduce((n, [, , lines]) => n + lines.length * line + 4, 0) + 10;
    const y = Math.round((CONFIG.res - 16 - h) / 2);

    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = PALETTE.black;
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    PixelFont.draw(ctx, Lang.t('roles'), CONFIG.res / 2, y + 9, PALETTE.yellow);

    let ty = y + 24;
    rows.forEach(([id, name, lines]) => {
      this.text(ctx, name, x + 6, ty, id === 'YOU'? PALETTE.red: PALETTE.yellow);
      lines.forEach((l, i) => this.text(ctx, l, x + 6 + col, ty + i * line, PALETTE.white));
      ty += lines.length * line + 4;
    });
    PixelFont.draw(ctx, Lang.t('close'), CONFIG.res / 2, y + h - 7, PALETTE.gray);
  }

  /** Win / lose text, centered on y (default: screen center) */
  drawOver(ctx, y=CONFIG.res / 2) {
    const c = CONFIG.res / 2, v = this.village, win = v.result === 'win';
    const why = win? Lang.t('winWhy'): v.timeUp? Lang.t('timeUp'): v.killedBy? Lang.t('killedBy', v.killedBy.name, Lang.role(v.killedBy.role)): Lang.t('gameOver');
    PixelFont.draw(ctx, Lang.t(win? 'win': 'lose'), c, y - 6, PALETTE.red, 2);
    PixelFont.draw(ctx, why, c, y + 4, PALETTE.gray);
  }
  //#endregion
}
