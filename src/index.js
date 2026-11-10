import "./board.js";
import "./game.js";
import "./controls.js";
import { stockfish } from "./stockfish.js";

stockfish.onEval = evalStr => {
  document.getElementById('stockfish-eval').textContent = `♚ ${evalStr}`;
};
