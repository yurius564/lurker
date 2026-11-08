class Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} size
   * @param {string} color
   */
  constructor(x, y, size=32, color='#328de2') {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.speed = 0;
  }

  //#region [ Lifecycle ]
  update(dt) {}

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
  }
  //#endregion
}
