import { board } from "./board.js";
import { game } from "./game.js";
import { stockfish } from "./stockfish.js";

stockfish.onEval = evalStr => {
  document.getElementById('stockfish-eval').textContent = `♚ ${evalStr}`;
};

document.querySelector("#flip").addEventListener("click", board.flip);

const modalNode = document.querySelector("#newgame-config");
const form = modalNode.querySelector("form");
const modal = {
  open() {
    modalNode.showModal();
    form.querySelector("input[type=reset]").hidden = !game.history().length;
  },
  close() { modalNode.close() }
}

document.querySelector("#newgame").addEventListener("click", modal.open);

modal.open();


form.addEventListener("reset", modal.close);
form.addEventListener("submit", modal.close);

window.addEventListener("beforeunload", e => {
  if (game.history().length) e.preventDefault();
});