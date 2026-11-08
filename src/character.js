class Character extends Entity {
  static #nextId = 0;
  static peek = false;   // ? button hovered: names show roles (or ? if unknown)

  /**
   * @param {{name: string, color: string, role?: string}} data
   * @param {boolean} isPlayer
   * @param {Personality|null} personality
   * @param {object|null} roleData entry of Role.LIST
   */
  constructor(data, isPlayer=false, personality=null, roleData=null) {
    super(0, 0, CONFIG.circle.size, data.color);
    this.id = Character.#nextId++;
    this.name = data.name;
    this.roleData = roleData;
    this.role = roleData?.id ?? data.role;
    this.isPlayer = isPlayer;
    this.personality = personality;
    this.votesCast = 0;    // public vote history
    this.skips = 0;
    this.alive = true;
    this.revealed = false; // role known to the player: died or was investigated
    this.hovered = false;
    this.mark = null;      // corners: 'pick' / 'target' (yellow), 'kill' / 'vote' (red)
    this.used = false;     // already involved in a player action today
    this.flash = 0;        // seconds left of the elimination flash
    this.pointed = false;  // mouse over it (any scene state)
    this.mood = 5;         // suspicion of the player as a face level 1..9 (5 = neutral)
    this.look = 0;         // suspicion face frame progress 0..3 (rises while pointed)
    this.idle = Math.random() * Character.IDLE[1];   // seconds to the next behaviour animation
    this.act = -1;         // behaviour animation progress in seconds, -1 = not playing
  }

  static IDLE = [20, 40];  // seconds between behaviour animations (min, max)
  static ACT_TICK = 0.2;   // seconds per behaviour animation tick (slower than the hover)

  /** Hit test in screen pixels (a bit larger than the square) */
  contains(px, py) {
    const half = this.size / 2 + 3;
    return Math.abs(px - this.x) <= half && Math.abs(py - this.y) <= half;
  }

  eliminate() {
    this.alive = false;
    this.revealed = true;
    this.flash = 0.4;
  }

  //#region [ Lifecycle ]
  /** @param {number} mood suspicion of the player as a face level 1..9 */
  update(dt, mood=5) {
    this.flash = Math.max(0, this.flash - dt);
    this.mood = mood;
    this.animate(dt);
  }

  //#region [ Face ]
  get tick() { return Faces.TICK / 1000; }

  /** Pointed: play to the suspicion face and hold it; else play back. Behaviour animation on a random timer */
  animate(dt) {
    if(this.isPlayer || !this.alive)
      return;
    const show = this.pointed && this.mood !== 5;
    this.look = Math.min(3, Math.max(0, this.look + (show? dt: -dt) / this.tick));
    if(this.pointed || this.look > 0)
      return this.act = -1;

    if(this.act >= 0) {
      this.act += dt;
      if(this.act >= Faces.PING.length * Character.ACT_TICK) {
        this.act = -1;
        this.idle = Character.IDLE[0] + Math.random() * (Character.IDLE[1] - Character.IDLE[0]);
      }
      return;
    }
    this.idle -= dt;
    if(this.idle <= 0)
      this.act = 0;
  }

  /** Current face id and frame */
  get face() {
    if(this.look > 0)
      return [`sus${this.mood}`, Math.floor(this.look)];
    if(this.act >= 0 && this.personality)
      return [this.personality.id, Faces.PING[Math.floor(this.act / Character.ACT_TICK) % Faces.PING.length]];
    return ['sus5', 0];
  }
  //#endregion

  draw(ctx, time) {
    const s = this.size, half = s / 2;
    const x = Math.round(this.x - half), y = Math.round(this.y - half);

    if(this.flash > 0) {
      ctx.fillStyle = Math.floor(this.flash * 20) % 2? PALETTE.white: PALETTE.red;
      ctx.fillRect(x - 2, y - 2, s + 4, s + 4);
    }
    else if(this.alive) {
      // solid frame in the character color around the living, 1px black gap inside it
      ctx.fillStyle = this.color;
      ctx.fillRect(x - 2, y - 2, s + 4, s + 4);
      ctx.fillStyle = PALETTE.black;
      ctx.fillRect(x - 1, y - 1, s + 2, s + 2);
      Faces.draw(ctx, ...this.face, x, y, this.color);   // black body (the gap fill), face in the character color
    }
    else {
      // dead: hollow gray square with an X, pixel by pixel
      ctx.fillStyle = PALETTE.gray;
      ctx.fillRect(x, y, s, 1);
      ctx.fillRect(x, y + s - 1, s, 1);
      ctx.fillRect(x, y, 1, s);
      ctx.fillRect(x + s - 1, y, 1, s);
      for(let i = 4; i < s - 4; i++) {
        ctx.fillRect(x + i, y + i, 1, 1);
        ctx.fillRect(x + s - 1 - i, y + i, 1, 1);
      }
    }

    if(this.mark)
      this.drawCorners(ctx, x - 5, y - 5, s + 10, ['kill', 'vote'].includes(this.mark)? PALETTE.red: PALETTE.yellow);
    else if(this.hovered)
      this.drawCorners(ctx, x - 5, y - 5, s + 10, PALETTE.white);

    if(this.used && this.alive) {
      ctx.fillStyle = PALETTE.gray;
      ctx.fillRect(x + s - 4, y + 1, 3, 3);
    }

    const color = this.alive? (this.isPlayer? PALETTE.red: PALETTE.white): PALETTE.gray;
    if(Character.peek)
      return PixelFont.draw(ctx, this.isPlayer || this.revealed? Lang.role(this.role): '?', this.x, y + s + 7, this.isPlayer? PALETTE.red: PALETTE.yellow);
    PixelFont.draw(ctx, this.isPlayer? Lang.t('you'): this.name, this.x, y + s + 7, color);
  }

  /** Bracket corners around a square area (target marker) */
  drawCorners(ctx, x, y, s, color) {
    const l = 4;
    ctx.fillStyle = color;
    [[x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]].forEach(([cx, cy, dx, dy]) => {
      ctx.fillRect(dx > 0? cx: cx - l, dy > 0? cy: cy - 1, l, 1);
      ctx.fillRect(dx > 0? cx: cx - 1, dy > 0? cy: cy - l, 1, l);
    });
  }
  //#endregion
}
