export class Stockfish {

  #queue = [];
  #elo = 1500;
  #depth = 12;
  #multiPV = 5;

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

    if (trimmed.startsWith('info') && typeof this.onInfo === "function") {
      const info = this.#parseInfo(trimmed);
      this.onInfo(info);
    }
  }

  #parseInfo(line) {
    const parts = line.split(' ');
    const info = { raw : line };

    for (let i = 0; i < parts.length; i++) {
      switch (parts[i]) {
        case 'depth':   info.depth   = Number(parts[++i]); break;
        case 'seldepth':info.seldepth= Number(parts[++i]); break;
        case 'time':    info.time    = Number(parts[++i]); break;
        case 'nodes':   info.nodes   = Number(parts[++i]); break;
        case 'nps':     info.nps     = Number(parts[++i]); break;
        case 'score': {
          const type = parts[++i];               // cp ou mate
          const val  = Number(parts[++i]);
          if (type === 'cp') {
            info.score = {
              type:'cp',
              value: (val / 100).toFixed(2)
            };   // pions
          } else {
            info.score = {type:'mate', value: val};
          }
          break;
        }
        case 'multipv':
          info.multipv = Number(parts[++i]); break;
        case 'pv':
          info.pv = parts.slice(i+1).join(' ');
          break;
      }
    }
    return info;
  }

  async setOptions(obj) {
    for (let key in obj) {
      this.send(`setoption name ${key} value ${obj[key]}`);
    }
    this.send('isready');
    await this.waitFor('readyok');
  }

  async init() {
    this.send('uci');
    await this.waitFor('uciok');
    await this.setOptions({ UCI_elo : this.#elo });
  }

  /** Positionne le moteur sur la partie courante */
  setPosition(movesUci) {
    const cmd = movesUci.length
        ? `position startpos moves ${movesUci.join(' ')}`
        : 'position startpos';
    this.send(cmd);
  }

  async getBestMove() {
    await this.setOptions({ MultiPV : 1 });
    this.send(`go depth ${this.#depth}`);
    const best = await this.waitFor('bestmove');
    // « bestmove e2e4 ponder e7e5 »
    return best.split(' ')[1];
  }

  async getBestMoves() {
    await this.setOptions({ MultiPV : this.#multiPV });
    this.send(`go depth ${this.#depth}`);
    const moves = []
    for (let i=1; i <= this.#multiPV; i++) {
      const line = await this.waitFor(`info depth ${12}`);
      const info = this.#parseInfo(line);
      moves.push({
        move : info.pv.split(/\s+/)[0],
        score : info.score
      });
    }

    return moves;
  }
}

