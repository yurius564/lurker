/**
 * Start menu: START, difficulty row, time limit row, then the language toggle
 * and the ? button (roles window). Choices live in CONFIG, so they stay across games.
 */
class MenuScene extends Scene {
  static DIFFICULTY = ['easy', 'normal', 'hard'];
  static LIMITS = [7, 30, 0];    // days, 0 = unlimited

  static W = 146;
  static X = (256 - MenuScene.W) / 2;   // centered on the 256 screen
  static GAP = 4;

  //#region [ Layout ]
  get startRect() { return {x: MenuScene.X, y: 98, w: MenuScene.W, h: 16}; }

  /** Three equal boxes in a row */
  row(y) {
    const gap = MenuScene.GAP, w = (MenuScene.W - gap * 2) / 3;
    return [0, 1, 2].map(i => ({x: MenuScene.X + i * (w + gap), y, w, h: 13}));
  }

  get diffRects() { return this.row(120); }
  get limitRects() { return this.row(137); }

  get langRect() {
    const h = 14;
    return {x: MenuScene.X, y: 165, w: MenuScene.W - MenuScene.GAP - h, h};
  }

  // the ? lives in the menu's bottom row; no ! here
  get helpRect() {
    const l = this.langRect;
    return {x: l.x + l.w + MenuScene.GAP, y: l.y, w: l.h, h: l.h};
  }

  get peekRect() { return {x: -99, y: -99, w: 0, h: 0}; }
  get menuRect() { return {x: -99, y: -99, w: 0, h: 0}; }
  //#endregion

  //#region [ Input ]
  press() {
    this.flow.next();
  }

  click(px, py) {
    if(this.hitRect(this.startRect, px, py))
      return this.press();
    const d = this.diffRects.findIndex(r => this.hitRect(r, px, py));
    if(d >= 0)
      return CONFIG.difficulty = MenuScene.DIFFICULTY[d];
    const l = this.limitRects.findIndex(r => this.hitRect(r, px, py));
    if(l >= 0)
      return CONFIG.limit = MenuScene.LIMITS[l];
    if(this.hitRect(this.langRect, px, py))
      CONFIG.lang = CONFIG.lang === 'en'? 'pt': 'en';
  }
  //#endregion

  //#region [ Drawing ]
  hot(r) {
    return !Scene.helpOpen && this.mouse && this.hitRect(r, ...this.mouse);
  }

  /** 1px frame box; filled boxes get black text */
  box(ctx, r, color, label, filled) {
    ctx.fillStyle = color;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if(!filled) {
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    }
    PixelFont.draw(ctx, label, r.x + r.w / 2, r.y + r.h / 2, filled? PALETTE.black: color);
  }

  /** Main buttons: yellow frame, filled on hover */
  action(ctx, r, label, on=false) {
    this.box(ctx, r, PALETTE.yellow, label, on || this.hot(r));
  }

  /** Option row: the chosen one filled yellow, hovered ones framed yellow */
  options(ctx, rects, labels, values, value) {
    rects.forEach((r, i) => {
      const label = labels[i], chosen = values[i] === value;
      this.box(ctx, r, chosen || this.hot(r)? PALETTE.yellow: PALETTE.white, label, chosen);
    });
  }

  draw(ctx) {
    const c = CONFIG.res / 2;
    PixelFont.draw(ctx, 'LURKER', c, 82, PALETTE.red, 2);
    this.action(ctx, this.startRect, Lang.t('start'));
    this.options(ctx, this.diffRects, MenuScene.DIFFICULTY.map(d => Lang.t(d)), MenuScene.DIFFICULTY, CONFIG.difficulty);
    this.options(ctx, this.limitRects, MenuScene.LIMITS.map(n => Lang.t(`limit${n}`)), MenuScene.LIMITS, CONFIG.limit);

    ctx.fillStyle = PALETTE.gray;
    ctx.fillRect(MenuScene.X + 10, 157, MenuScene.W - 20, 1);

    this.action(ctx, this.langRect, Lang.NAMES[CONFIG.lang]);
    this.action(ctx, this.helpRect, '?', Scene.helpOpen);
  }

  /** Only the roles window: the menu draws its own ? button */
  drawHelp(ctx) {
    if(Scene.helpOpen)
      this.drawHelpWindow(ctx);
  }
  //#endregion
}
