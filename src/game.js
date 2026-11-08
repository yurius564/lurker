class Game {
  constructor(cvn) {
    this.cvn = cvn;
    this.ctx = cvn.getContext('2d');
    this.village = new Village();
    const menu = () => this.toMenu();
    this.flowDay = {next: () => this.toVote(), restart: () => this.restart(), menu};
    this.flowVote = {next: () => this.toDay(true), restart: () => this.restart(), menu};
    this.flowMenu = {next: () => this.restart(), restart: () => this.restart(), menu};
    this.toMenu();
    this.last = 0;
    this.time = 0;

    // fixed low-res square buffer, scaled by CSS
    this.cvn.width = CONFIG.res;
    this.cvn.height = CONFIG.res;
    this.ctx.imageSmoothingEnabled = false;

    this.resize();
    addEventListener('resize', () => this.resize());
  }

  toDay(newDay=false) {
    if(newDay)
      this.village.day++;
    this.scene = new DayScene(this.village, this.flowDay);
  }

  toMenu() {
    this.scene = new MenuScene(this.village, this.flowMenu);
  }

  toVote() {
    this.scene = new VoteScene(this.village, this.flowVote);
  }

  restart() {
    this.village.reset();
    this.toDay();
  }

  /** Largest whole-number scale that fits the window */
  resize() {
    const $debug = document.getElementById('debug');
    const free = innerWidth - ($debug && !$debug.hidden? $debug.offsetWidth: 0); // room left of the debug panel
    this.scale = Math.max(1, Math.floor(Math.min(free, innerHeight) / CONFIG.res));
    this.cvn.style.width = `${CONFIG.res * this.scale}px`;
    this.cvn.style.height = `${CONFIG.res * this.scale}px`;
  }

  /** Mouse event offset (CSS px) to screen pixels */
  toScreen(e) {
    return [Math.floor(e.offsetX / this.scale), Math.floor(e.offsetY / this.scale)];
  }

  start() {
    requestAnimationFrame(t => {
      this.last = t;
      this.loop(t);
    });
  }

  loop(time) {
    const dt = Math.min((time - this.last) / 1000, 0.1); // seconds, clamped
    this.last = time;
    this.time += dt;

    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    this.scene.update(dt);
  }

  draw() {
    this.ctx.fillStyle = PALETTE.black;
    this.ctx.fillRect(0, 0, CONFIG.res, CONFIG.res);
    this.scene.draw(this.ctx, this.time);
    this.scene.drawHelp(this.ctx);
  }
}
