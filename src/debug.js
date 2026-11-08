/** Debug side panel (DOM): suspicion matrix of every NPC and the event log */
class DebugPanel {
  /** @param {HTMLElement} $root */
  constructor($root) {
    this.$root = $root;
    this.$root.innerHTML = `
      <h2>DIFFICULTY <select id="debug-difficulty">${Object.keys(Personality.DIFFICULTY)
        .map(d => `<option${d === CONFIG.difficulty? ' selected': ''}>${d}</option>`).join('')}</select> <small>restarts the game</small></h2>
      <h2>SUSPICION <small>row = observer, column = target</small></h2>
      <table id="debug-matrix"></table>
      <h2>LOG</h2>
      <ol id="debug-log"></ol>`;
    this.$root.hidden = !CONFIG.debug;
    document.body.classList.toggle('debug-on', CONFIG.debug);
    this.$matrix = $root.querySelector('#debug-matrix');
    this.$log = $root.querySelector('#debug-log');
    this.onDifficulty = null; // callback(level)
    $root.querySelector('#debug-difficulty').onchange = e => {
      this.onDifficulty?.(e.target.value);
      e.target.blur(); // give the keys back to the game
    };
    this.logLength = -1;
    this.logRef = null;
  }

  toggle() {
    this.$root.hidden = !this.$root.hidden;
    CONFIG.debug = !this.$root.hidden;
    document.body.classList.toggle('debug-on', !this.$root.hidden);
    dispatchEvent(new Event('resize'));
  }

  /** @param {Village} scene */
  render(scene) {
    if(this.$root.hidden)
      return;
    this.renderMatrix(scene);
    this.renderLog(scene);
  }

  renderMatrix(scene) {
    const chars = scene.characters;
    const head = chars.map(t => `<th style="color:${t.color}" class="${t.alive? '': 'dead'}">${t.name}</th>`).join('');
    const rows = chars.filter(o => !o.isPlayer).map(o => {
      const top = o.alive? scene.suspicion.top(o, chars).target: null;
      const cells = chars.map(t => {
        if(t === o)
          return '<td class="self"></td>';
        const pct = Math.round(scene.suspicion.get(o, t) * 100);
        const cls = [t.alive? '': 'dead', t === top? 'top': ''].join(' ');
        return `<td class="${cls}"><i style="width:${pct}%"></i><span>${pct}</span></td>`;
      }).join('');
      return `<tr class="${o.alive? '': 'dead'}"><th style="color:${o.color}" title="${o.role}: ${o.roleData.note} / ${o.personality.id}: ${o.personality.note}">${o.name} <em>${o.role} ${o.personality.id} ${o.personality.threat}</em></th>${cells}</tr>`;
    }).join('');
    this.$matrix.innerHTML = `<tr><th></th>${head}</tr>${rows}`;
  }

  renderLog(scene) {
    if(scene.log === this.logRef && scene.log.length === this.logLength)
      return;
    this.logRef = scene.log;
    this.logLength = scene.log.length;
    this.$log.innerHTML = scene.log.map(e => `<li><b>D${e.day}</b> ${e.text}</li>`).join('');
    this.$log.scrollTop = this.$log.scrollHeight;
  }
}
