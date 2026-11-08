class Input {
  static keys = new Set();
  static mouse = {x: 0, y: 0, down: false};

  static init(cvn) {
    addEventListener('keydown', e => Input.keys.add(e.code));
    addEventListener('keyup', e => Input.keys.delete(e.code));
    addEventListener('blur', () => Input.keys.clear());

    cvn.addEventListener('mousemove', e => {
      Input.mouse.x = e.offsetX;
      Input.mouse.y = e.offsetY;
    });
    cvn.addEventListener('mousedown', () => Input.mouse.down = true);
    cvn.addEventListener('mouseup', () => Input.mouse.down = false);
    cvn.addEventListener('mouseleave', () => Input.mouse.down = false);
  }

  static isDown(...codes) {
    return codes.some(code => Input.keys.has(code));
  }
}
