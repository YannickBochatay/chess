export class Stockfish {

  #queue = [];
  #elo = 1500;

  constructor(worker) {
    this.worker = worker;
    this.worker.onmessage = e => this.#dispatch(e.data);
  }

  set elo(value) {
    if (typeof value !== "number") throw new TypeError("ELO value must be a number");
    if (value < 1320) throw new RangeError("ELO value must be greater or equal than 1320");
    if (value > 3190) throw new RangeError("ELO value must be lower or equal than 3190");

    this.#elo = value;
  }

  get elo() {
    return this.#elo;
  }

  send(line) {
    console.log("%cstdin", "color: blue", line);
    this.worker.postMessage(line);
  }

  /* Attend la prochaine occurrence d’un préfixe (ex.: "uciok", "readyok", "bestmove") */
  waitFor(prefix) {
    return new Promise(resolve => {
      this.#queue.push({ prefix, resolve });
    });
  }

  #getEval(line) {
    const m = line.match(/score (cp|mate) (-?\d+)/);
    if (!m) return;
    const type = m[1];
    const val  = Number(m[2]);
    return type === 'cp' ? (val / 100).toFixed(2) : `#${val}`;
  }

  /* Découpage et distribution des lignes reçues */
  #dispatch(line) {
    console.log("%cstdout", "color: orange", line);
    
    const trimmed = line.trim();
    // Recherche du premier listener dont le préfixe correspond
    for (let i = 0; i < this.#queue.length; i++) {
      const { prefix, resolve } = this.#queue[i];
      if (trimmed.startsWith(prefix)) {
        this.#queue.splice(i, 1);
        resolve(trimmed);
        break;
      }
    }

    if (!trimmed.startsWith('info')) return;
    
    if (this.onInfo) this.onInfo(trimmed);
    if (this.onEval) this.onEval(this.#getEval(trimmed));
  }

  /* === Séquence d’initialisation UCI === */
  async init() {
    this.send('uci');
    await this.waitFor('uciok');

    // Exemple d’options (décommenter selon le besoin)
    // this.send('setoption name Skill Level value 10');   // 0‑20, 0 = très faible
    // this.send('setoption name UCI_LimitStrength value true');
    this.send(`setoption name UCI_Elo value ${this.#elo}`);

    this.send('isready');
    await this.waitFor('readyok');
  }

  /** Positionne le moteur sur la partie courante */
  setPosition(movesUci) {
    const cmd = movesUci.length
        ? `position startpos moves ${movesUci.join(' ')}`
        : 'position startpos';
    this.send(cmd);
  }

  /** Demande un calcul (depth ou movetime) */
  async go({depth, movetime} = {depth: 15}) {
    const goCmd = movetime ? `go movetime ${movetime}` : `go depth ${depth}`;
    this.send(goCmd);
    const best = await this.waitFor('bestmove');
    // « bestmove e2e4 ponder e7e5 »
    return best.split(' ')[1];
  }
}

export const stockfish = new Stockfish(new Worker('lib/stockfish/stockfish-19-lite-single.js'));
