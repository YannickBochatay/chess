import { board } from "./board.js";
import { game } from "./game.js";
import { stockfish } from "./stockfish.js";

stockfish.onEval = evalStr => {
  document.getElementById('stockfish-eval').textContent = `♚ ${evalStr}`;
};

document.querySelector("#flip").addEventListener("click", board.flip);

window.addEventListener("beforeunload", e => {
  if (game.history().length) e.preventDefault();
});