/** 3x5 bitmap font drawn pixel by pixel (sharp at any whole-number scale) */
class PixelFont {
  static W = 3;
  static H = 5;
  static GAP = 1;

  // each glyph: 5 rows of 3 bits, top to bottom
  static GLYPHS = {
    'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110',
    'E': '111100110100111', 'F': '111100110100100', 'G': '011100101101011', 'H': '101101111101101',
    'I': '111010010010111', 'J': '001001001101010', 'K': '101101110101101', 'L': '100100100100111',
    'M': '101111111101101', 'N': '110101101101101', 'O': '010101101101010', 'P': '110101110100100',
    'Q': '010101101110011', 'R': '110101110101101', 'S': '011100010001110', 'T': '111010010010010',
    'U': '101101101101111', 'V': '101101101101010', 'W': '101101111111101', 'X': '101101010101101',
    'Y': '101101010010010', 'Z': '111001010100111',
    '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
    '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010',
    '8': '111101111101111', '9': '111101111001110',
    '?': '110001010000010', '!': '010010010000010', '.': '000000000000010', ':': '000010000010000',
    '-': '000000111000000', '/': '001001010100100', '%': '101001010100101', 'Ç': '011100100011010', ' ': '000000000000000',
  };

  static width(text, scale=1) {
    return (text.length * (PixelFont.W + PixelFont.GAP) - PixelFont.GAP) * scale;
  }

  /**
   * Draw text centered on (x, y)
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @param {number} scale whole number
   */
  static draw(ctx, text, x, y, color, scale=1) {
    const {W, H, GAP, GLYPHS} = PixelFont;
    let left = Math.round(x - PixelFont.width(text, scale) / 2);
    const top = Math.round(y - H * scale / 2);

    ctx.fillStyle = color;
    for(const ch of text.toUpperCase()) {
      const bits = GLYPHS[ch] ?? GLYPHS['?'];
      for(let i = 0; i < bits.length; i++)
        if(bits[i] === '1')
          ctx.fillRect(left + (i % W) * scale, top + Math.floor(i / W) * scale, scale, scale);
      left += (W + GAP) * scale;
    }
  }
}
