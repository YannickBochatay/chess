import { Chess } from "chess.js";
import Chessboard from "chessboard";
import { Stockfish } from "../stockfish.js";
import { state } from "../state.js"
import { throwConfetti } from "../utils/throwConfetti.js";
import { playSound } from "../utils/playSound.js";

const template = document.createElement("template");

const highlightClass = "highlighted"

template.innerHTML = `
  <style>
    .${highlightClass} {
      background-color:#a9a9a9;
      &.black-3c85d {
        background-color:#696969;
      }
    }
  </style>
  <div id="board"></div>
`;

class Board extends HTMLElement {

  #board;
  #game;
  #stockfish;
  #elo = 1500;
  #nbPlayers = 1;
  #color = "white";
  #engineDelay = 1000;
  #delayId;
  #from = null;

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
    this.#game = new Chess();
    this.#stockfish = new Stockfish(new Worker('lib/stockfish/stockfish-19-lite-single.js'));
  }

  set elo(value) {
    if (typeof value !== "number") throw new TypeError("ELO value must be a number");
    if (value < 1320) throw new RangeError("ELO value must be greater or equal than 1320");
    if (value > 3190) throw new RangeError("ELO value must be lower or equal than 3190");

    this.#elo = value;
  }

  set nbPlayers(value) {
    if (typeof value !== "number") throw new TypeError("nbPlayers value must be a number");
    if (value < 0) throw new RangeError("nbPlayers value must be greater or equal than 0");
    if (value > 2) throw new RangeError("nbPlayers value must be lower or equal than 2");

    this.#nbPlayers = value;
  }

  set color(value) {
    const values = ["white", "black", "random"];
    if (!values.includes(value)) {
      throw new Error(`${value} is not a correct value for color ("${values.join('", "')}" expected`);
    }

    if (value === "random") this.#color = Math.random() > 0.5 ? "black" : "white";
    else this.#color = value;
  }

  set engineDelay(value) {
    if (typeof value !== "number") throw new TypeError("engineDelay value must be a number");
    if (value < 0) throw new RangeError("engineDelay value must be greater or equal than 0");

    this.#engineDelay = value;
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
    clearTimeout(this.#delayId);
    if (this.hasBegun()) this.#game.reset();
    this.#stockfish.elo = this.#elo;
    await this.#stockfish.init();
    this.#board.start();
    state.movesUci = [];
  }

  async start() {
    await this.reset();
    if (this.#nbPlayers === 1) this.orientation(this.#color);
    if (this.#nbPlayers === 0 || (this.#color === "black" && this.#nbPlayers === 1)) await this.engineMove();
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

  move(uci, useAnimation = true) {
    const move = this.#game.move(uci);
    this.#board.position(this.#game.fen(), useAnimation);
    state.movesUci = state.movesUci.slice(0, state.moveIndex + 1).concat(move.lan);
    state.moveIndex = state.movesUci.length - 1;
    this.#stockfish.setPosition(state.movesUci);
    void playSound("move");

    if (this.isGameOver()) {
      setTimeout(() => {
        throwConfetti();
        void playSound("victory");
      },1000);
    }
  }

  humanMove({ from, to, promotion = "q" }, useAnimation = false) {
    this.move({ from, to, promotion }, useAnimation);
    if (state.nbPlayers === 1 && !this.isGameOver()) {
      this.#delayId = setTimeout(this.engineMove, this.#engineDelay);
    }
  }

  engineMove = async() => {
    const bestUci = await this.#stockfish.go({ depth : 12 });
    try {
      this.move(bestUci);
      if (state.nbPlayers === 0 && !this.isGameOver()) {
      this.#delayId = setTimeout(this.engineMove, this.#engineDelay);
    }
    } catch(e) {
      console.log("coup illégal de stockfish");
    }
  }

  #resetSquares() {
    const squares = this.querySelectorAll('.square-55d63.highlighted')
    squares.forEach(elmt => elmt.classList.remove(highlightClass));
  }

  #highlightSquare(square) {
    this.querySelector('.square-' + square).classList.add(highlightClass);
  }

  #handleBeforeUnload = e => {
    if (this.hasBegun()) e.preventDefault();
  }

  #isOpposite(piece) {
    return (this.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (this.turn() === 'b' && piece.search(/^w/) !== -1);
  }

  #handleDragStart = (source, piece) => {
    if (this.isGameOver() || this.#isOpposite(piece)) return false;
  }

  #handleDrop = (from, to) => {
    try {
      this.humanMove({ from, to });
      this.#resetSquares();
    } catch(e) {
      console.log(e);
      return "snapback";
    }
  }

  #handlePointerDown = (square, piece) => {
    this.#resetSquares();

    // on a déjà cliqué sur une pièce et on clique sur une case libre ou une pièce adverse
    if (this.#from && (!piece || this.#isOpposite(piece))) {
      this.humanMove({ from : this.#from, to : square }, true);
      this.#from = null;
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

  connectedCallback() {
    const boardConfig = {
      draggable: true,
      position: 'start',
      onDrop: this.#handleDrop,
      onDragStart: this.#handleDragStart,
      onMouseDown : this.#handlePointerDown
    }
    
    this.#board = Chessboard("board", boardConfig);

    window.addEventListener("beforeunload",this.#handleBeforeUnload);
  }

  disconnectedCallback() {
    window.removeEventListener("beforeunload",this.#handleBeforeUnload);
  }

}

customElements.define("chess-board", Board);