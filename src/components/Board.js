import { Chess, KING, WHITE, BLACK } from "chess.js";
import Chessboard from "chessboard";
import { Stockfish } from "../stockfish.js";
import { state, resetState, onStateChange, offStateChange } from "../state.js"
import { throwConfetti } from "../utils/throwConfetti.js";
import { playSound } from "../utils/playSound.js";

const template = document.createElement("template");

const HIGHLIGHT_CLASS = "highlighted"
const CHECK_CLASS = "check"

template.innerHTML = `
  <style>
    .${HIGHLIGHT_CLASS} {
      background-color:#a9a9a9;
      &.black-3c85d {
        background-color:#696969;
      }
    }
    .${CHECK_CLASS} {
      box-shadow : inset 0 0 15px 3px #b40808;  
    }
  </style>
  <div id="board"></div>
`;

class Board extends HTMLElement {

  #board;
  #game;
  #stockfish;
  #delayId;
  #from = null;

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
    this.#game = new Chess();
    this.#stockfish = new Stockfish(new Worker('lib/stockfish/stockfish-19-lite-single.js'));
    this.#stockfish.debug = true;
  }

  get board() {
    return this.#board;
  }

  flip() {
    this.#board.flip();
  }

  orientation(arg) {
    this.#board.orientation(arg);
  }

  hasBegun() {
    return this.#game.history().length > 0;
  }

  isGameOver() {
    return this.#game.isGameOver();
  }

  turn() {
    return this.#game.turn();
  }

  async reset() {
    this.#resetSquares(CHECK_CLASS);
    clearTimeout(this.#delayId);
    if (this.hasBegun()) this.#game.reset();
    this.#board.start();
    resetState();
  }

  async start() {
    await this.reset();

    let color;
    if (state.color === "random") {
      color = Math.random() > 0.5 ? "black" : "white";
    } else color = state.color;

    if (state.nbPlayers === 1) this.orientation(color);
    if (state.nbPlayers === 0 || (color === "black" && state.nbPlayers === 1)) await this.engineMove();
    void playSound("start");
  }

  undo() {
    if (state.moveIndex < 0) return;
    state.moveIndex--;
    this.#game.undo();
    this.#board.position(this.#game.fen(), true);
    this.#stockfish.setPosition(state.movesUci.slice(0, state.moveIndex + 1));
  }

  redo() {
    if (state.moveIndex === state.movesUci.length - 1) return;
    state.moveIndex++;
    this.#game.move(state.movesUci[state.moveIndex]);
    this.#board.position(this.#game.fen(), true);
    this.#stockfish.setPosition(state.movesUci.slice(0, state.moveIndex + 1));
  }

  async showTip() {
    if (state.tip === null) {
      const bestMoves = await this.#stockfish.getBestMoves();
      state.tip = {
        currentIndex : 0,
        bestMoves
      }
    } else {
      state.tip = {
        currentIndex : (state.tip.currentIndex + 1) % state.tip.bestMoves.length,
        bestMoves : state.tip.bestMoves
      }
    }

    const { move } = state.tip.bestMoves[state.tip.currentIndex];

    const from = move.slice(0, 2);
    const to = move.slice(2);
    this.#resetSquares();
    this.#highlightSquare(from);
    this.#highlightSquare(to);
    void playSound("tip");
  }

  #checkMove(uci) {
    this.#game.move(uci);
    this.#game.undo();
  }

  move(uci, useAnimation = true) {
    const move = this.#game.move(uci);
    this.#resetSquares(CHECK_CLASS);
    this.#board.position(this.#game.fen(), useAnimation);
    state.movesUci = state.movesUci.slice(0, state.moveIndex + 1).concat(move.lan);
    state.moveIndex = state.movesUci.length - 1;
    this.#stockfish.setPosition(state.movesUci);
    void playSound("move");

    state.tip = null; // on réinitialise le conseil

    if (this.#game.inCheck()) {
      const square = this.#game.findPiece({
        type: KING,
        color: this.turn()
      });
      this.#highlightSquare(square, CHECK_CLASS);
      void playSound("check");
    }
  }

  #setScore({ type, value }) {
    if (this.turn() === BLACK) value *= -1;
    if (type === "cp") {
      state.lastMoveScore = (value - state.score).toFixed(2);
      state.score = value;
    } else {
      state.score = "mat en " + value;
    }
  }

  #setMoveLabel(score, bestScore) {
    if (bestScore.type === "mate") {
      if (score.type === "mate") {
        return "meilleur coup";
      } else {
        return "gaffe (mat manqué)"
      }
    } else {
      const delta = bestScore.value - score.value;
      if (delta <= 0.1) return "meilleur coup";
      else if (delta <= 0.3) return "bon";
      else if (delta <= 0.5) return "imprécision";
      else if (delta <= 1) return "erreur";
      else return "gaffe";
    }
  }

  async humanMove({ from, to, promotion = "q" }, useAnimation = false) {
    let score = await this.#stockfish.evalMove(from + to);
    let { score : bestScore } = await this.#stockfish.getBestMove();
    state.lastMoveLabel = this.#setMoveLabel(score, bestScore);
    this.#setScore(score);

    this.move({ from, to, promotion }, useAnimation);
    
    if (this.isGameOver()) {
      setTimeout(() => {
        throwConfetti();
        void playSound("victory");
      },750);
    } else if (state.nbPlayers === 1) {
      this.#delayId = setTimeout(this.engineMove, state.engineDelay);
    }
  }

  engineMove = async() => {
    let { move, score } = await this.#stockfish.getBestMove();
    state.lastMoveLabel = "";
    this.#setScore(score);

    try {
      this.move(move);
      if (this.isGameOver()) void playSound("defeat");
      else if (state.nbPlayers === 0) {
        this.#delayId = setTimeout(this.engineMove, state.engineDelay);
      }
    } catch(e) {
      console.log("coup illégal de stockfish");
    }
  }

  #resetSquares(className=HIGHLIGHT_CLASS) {
    const squares = this.querySelectorAll(`.square-55d63.${className}`)
    squares.forEach(elmt => elmt.classList.remove(className));
  }

  #highlightSquare(square, className=HIGHLIGHT_CLASS) {
    this.querySelector('.square-' + square).classList.add(className);
  }

  #handleBeforeUnload = e => {
    if (this.hasBegun()) e.preventDefault();
  }

  #isOpposite(piece) {
    return (this.turn() === WHITE && piece.startsWith(BLACK)) ||
        (this.turn() === BLACK && piece.startsWith(WHITE));
  }

  #handleDragStart = (source, piece) => {
    if (this.isGameOver() || (piece && this.#isOpposite(piece))) return false;
  }

  #handleDrop = (from, to) => {
    try {
      this.#checkMove({ from, to });
      void this.humanMove({ from, to });
      this.#resetSquares();
    } catch(e) {
      console.log("erreur", e);
      return "snapback";
    }
  }

  #handlePointerDown = async(square, piece) => {
    this.#resetSquares();

    // on a déjà cliqué sur une pièce et on clique sur une case libre ou une pièce adverse
    if (this.#from && (!piece || this.#isOpposite(piece))) {
      try {
        const move = { from : this.#from, to : square };
        this.#checkMove(move);
        void this.humanMove(move, true);
        this.#from = null;
      } catch(e) {
        console.log(e);
      }
      return;
    }
    
    const moves = this.#game.moves({
      square: square,
      verbose: true
    });
  
    if (moves.length === 0) return;

    this.#from = square;
    this.#highlightSquare(square);
    for (const move of moves) this.#highlightSquare(move.to);
  }

  #handleChangeElo = value => {
    return this.#stockfish.setOptions({ UCI_elo : value });
  }

  async connectedCallback() {
    const boardConfig = {
      draggable: true,
      position: 'start',
      onDrop: this.#handleDrop,
      onDragStart: this.#handleDragStart,
      onMouseDown : this.#handlePointerDown
    }
    
    this.#board = Chessboard("board", boardConfig);
    window.addEventListener("beforeunload",this.#handleBeforeUnload);
    onStateChange("elo", this.#handleChangeElo);
    await this.#handleChangeElo(state.elo);
    await this.#stockfish.init();
  }

  disconnectedCallback() {
    window.removeEventListener("beforeunload",this.#handleBeforeUnload);
    offStateChange("elo", this.#handleChangeElo);
  }

}

customElements.define("chess-board", Board);