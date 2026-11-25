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
    this.#stockfish.debug = false;
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

  goToIndex = (newIndex, currentIndex, useAnimation=true) => {

    this.#resetSquares(CHECK_CLASS);
    this.#resetSquares(HIGHLIGHT_CLASS);
    state.tip = null; // on réinitialise le conseil

    if (newIndex === currentIndex) return;

    if (newIndex > currentIndex) {
      const { length } = state.movesUci;
      if (newIndex > length - 1) throw new RangeError(`index can't be greater than ${length - 1}`);
      while (currentIndex < newIndex) {
        const { move } = state.movesUci[++currentIndex];
        this.#game.move(move);
      }
    } else {
      if (newIndex < - 1) throw new RangeError(`index can't be lower than -1`);
      while (currentIndex > newIndex) {
        currentIndex--;
        this.#game.undo();
      }
    }
    
    this.#board.position(this.#game.fen(), useAnimation);

    const moves = state.movesUci
      .slice(0, newIndex + 1)
      .map(item => item.move);

    this.#stockfish.setPosition(moves);

    if (this.#game.inCheck()) {
      const square = this.#game.findPiece({
        type: KING,
        color: this.turn()
      });
      this.#highlightSquare(square, CHECK_CLASS);
      void playSound("check");
    }
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

  move({ move, score, bestMove, bestScore }) {
    const isWhite = this.turn() === WHITE;
    state.movesUci = state.movesUci
      .slice(0, state.moveIndex + 1)
      .concat({
        move,
        score : { ...score, value : isWhite ? score.value : -score.value },
        bestMove,
        bestScore : bestScore && { ...bestScore, value : isWhite ? bestScore.value : -bestScore.value }
      });

    state.moveIndex = state.movesUci.length - 1;    
  }

  async humanMove(move, useAnimation = false) {
    let score = await this.#stockfish.evalMove(move);
    let { move : bestMove, score : bestScore } = await this.#stockfish.getBestMove();

    this.move({ move, score, bestMove, bestScore }, useAnimation);
    
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
    let move = await this.#stockfish.getMove();
    let score = await this.#stockfish.evalMove(move);
    let { move : bestMove, score : bestScore } = await this.#stockfish.getBestMove();

    try {
      this.move({ move, score, bestMove, bestScore });
      if (this.isGameOver()) void playSound("defeat");
      else if (state.nbPlayers === 0) {
        this.#delayId = setTimeout(this.engineMove, state.engineDelay);
      }
    } catch(e) {
      console.log(e);
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
      this.#checkMove(from+to);
      void this.humanMove(from+to);
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
        this.#checkMove(this.#from+square);
        void this.humanMove(this.#from+square, true);
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

  #handleChangeLevel = () => {
    if (state.levelType === "elo") {
      return this.#stockfish.setOptions({
        UCI_elo : state.elo,
        UCI_LimitStrength : "true"
      });
    } else {
      return this.#stockfish.setOptions({
        "skill level" : state.skillLevel,
        UCI_LimitStrength : "false"
      });
    } 
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
    // window.addEventListener("beforeunload",this.#handleBeforeUnload);
    onStateChange(["elo", "skillLevel", "levelType"], this.#handleChangeLevel);
    onStateChange("moveIndex", this.goToIndex);
    await this.#handleChangeLevel();
    await this.#stockfish.init();
  }

  disconnectedCallback() {
    window.removeEventListener("beforeunload",this.#handleBeforeUnload);
    offStateChange(["elo", "skillLevel", "levelType"], this.#handleChangeLevel);
    offStateChange("moveIndex", this.goToIndex);
  }

}

customElements.define("chess-board", Board);