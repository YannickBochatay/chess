import { Chess } from "chess.js";
import Chessboard from "chessboard";
import { Stockfish } from "../stockfish.js";
import { state } from "../state.js"
import { throwConfetti } from "../utils/throwConfetti.js";

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

  #autoPlay = async() => {
    await this.engineMove();
    if (!this.isGameOver()) {
      this.#delayId = setTimeout(this.#autoPlay, this.#engineDelay);
    }
  }

  async start() {
    await this.reset();

    if (this.#nbPlayers === 1) {
      this.orientation(this.#color);
      if (this.#color === "black") await this.engineMove();

    } else if (state.nbPlayers === 0) void this.#autoPlay();
  }

  position(pos, useAnimation) {
    return this.#board.position(pos, useAnimation);
  }

  move(uci, useAnimation = true) {
    const move = this.#game.move(uci);
    this.position(this.#game.fen(), useAnimation);
    state.movesUci = state.movesUci.concat(move.lan);

    if (this.isGameOver()) throwConfetti();
  }

  humanMove({ from, to, promotion = "q" }, useAnimation = false) {
    this.move({ from, to, promotion }, useAnimation);
    if (state.nbPlayers === 1) {
      this.#delayId = setTimeout(this.engineMove, this.#engineDelay);
    }
  }

  engineMove = async() => {
    this.#stockfish.setPosition(state.movesUci);
    const bestUci = await this.#stockfish.go({ depth : 12 });
    try {
      this.move(bestUci);
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

  #handleDragStart = (source, piece) => {
    if (this.isGameOver()) return false;
  
    if ((this.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (this.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
  }

  #handleDrop = (from, to) => {
    this.#resetSquares();
    try {
      this.humanMove({ from, to });
    } catch(e) {
      console.log(e);
      return "snapback";
    }
  }

  #handlePointerOver = (square, piece) => {
    const moves = this.#game.moves({
      square: square,
      verbose: true
    });
  
    if (moves.length === 0) return;
  
    this.#highlightSquare(square);
  
    for (const move of moves) this.#highlightSquare(move.to);
  }

  #handlePointerOut = (square, piece) => {
    this.#resetSquares();
  }

  connectedCallback() {
    const boardConfig = {
      draggable: true,
      position: 'start',
      onDrop: this.#handleDrop,
      onMouseoverSquare: this.#handlePointerOver,
      onMouseoutSquare: this.#handlePointerOut,
      onDragStart: this.#handleDragStart
    }
    
    this.#board = Chessboard("board", boardConfig);

    window.addEventListener("beforeunload",this.#handleBeforeUnload);
  }

  disconnectedCallback() {
    window.removeEventListener("beforeunload",this.#handleBeforeUnload);
  }

}

customElements.define("chess-board", Board);