const $cvn = document.getElementById('screen');

Input.init($cvn);

const game = new Game($cvn);

$cvn.addEventListener('mousemove', e => game.scene.hover(...game.toScreen(e)));
$cvn.addEventListener('mouseleave', () => game.scene.hover(-1, -1));
$cvn.addEventListener('click', e => game.scene.tap(...game.toScreen(e)));

addEventListener('keydown', e => {
  if(e.repeat)
    return;
  if(Scene.helpOpen && e.code !== 'Backquote')
    return Scene.helpOpen = false;  // any key closes the roles window
  if(['ArrowRight', 'ArrowDown', 'KeyD', 'KeyS'].includes(e.code))
    game.scene.cycle?.(1);
  else if(['ArrowLeft', 'ArrowUp', 'KeyA', 'KeyW'].includes(e.code))
    game.scene.cycle?.(-1);
  else if(/^Digit[1-4]$/.test(e.code))
    game.scene.key?.(Number(e.code.at(-1)) - 1);
  else if(['Enter', 'Space'].includes(e.code))
    game.scene.press();
  else if(e.code === 'Backquote')
    debug.toggle();
});

// debug panel: suspicion matrix + log, refreshed independent of the frame rate
const debug = new DebugPanel(document.getElementById('debug'));
debug.onDifficulty = level => {
  CONFIG.difficulty = level;
  game.restart();
};
setInterval(() => debug.render(game.village), 200);
game.resize();

game.start();
