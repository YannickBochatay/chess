export class Stockfish {

  #queue = [];
  #depth = 12;
  #debug = false;

  constructor(worker) {
    this.worker = worker;
    this.worker.onmessage = e => this.#dispatch(e.data);
  }

  set debug(value) {
    this.#debug = Boolean(value);
  }

  send(line) {
    if (this.#debug) console.log("%cstdin", "color: blue", line);
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
    if (this.#debug) console.log("%cstdout", "color: orange", line);
    
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
              value: val / 100
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
    this.setPosition([]);
  }

  /** Positionne le moteur sur la partie courante */
  setPosition(movesUci) {
    const cmd = movesUci.length
        ? `position startpos moves ${movesUci.join(' ')}`
        : 'position startpos';
    this.send(cmd);
  }

  async evalMove(moveUci) {
    await this.setOptions({ MultiPV : 1 });
    this.send(`go depth ${this.#depth} searchmoves ${moveUci}`);
    const line = await this.waitFor(`info depth ${this.#depth}`);
    const info = this.#parseInfo(line);

    return info.score;
  }

  async getBestMoves(MultiPV = 5) {
    await this.setOptions({ MultiPV });
    this.send(`go depth ${this.#depth}`);
    const moves = []
    for (let i=1; i <= MultiPV; i++) {
      const line = await this.waitFor(`info depth ${this.#depth}`);
      const info = this.#parseInfo(line);
      moves.push({
        move : info.pv.split(/\s+/)[0],
        score : info.score
      });
    }

    return moves;
  }

  async getBestMove() {
    const moves = await this.getBestMoves(1);
    return moves[0];
  }

  async getMove() {
    await this.getBestMoves(1);

    // best move n'est pas forcément le meilleur coup, cela dépend du niveau défini pour l'ordinateur
    // https://official-stockfish.github.io/docs/stockfish-wiki/Stockfish-FAQ.html#how-do-skill-level-and-uci-elo-work
    const line = await this.waitFor(`bestmove`);    
    return line.split(/\s+/)[1];
  }
}

