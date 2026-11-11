import { board, movesUci } from "./board.js"
import { game } from "./game.js"
import { stockfish } from "./stockfish.js";
import { config } from "./config.js"

document.querySelector("#flip").addEventListener("click", board.flip);

const newGameModal = document.querySelector("#newgame-config");

function showModal() {
  newGameModal.querySelector("input[type=reset]").hidden = !game.history().length;
  newGameModal.showModal();
}

document.querySelector("#newgame").addEventListener("click", showModal);

const form = newGameModal.querySelector("form");

const eloValue = form.querySelector("#elo-value");
const eloInput = form.querySelector("#elo");

eloInput.addEventListener("input", e => eloValue.textContent = e.target.value + " ELO");
eloInput.value = config.elo;
eloInput.dispatchEvent(new Event("input"));

const eloChoice = form.querySelector("#elo-choice");

form.addEventListener("change", e => {
  const data = new FormData(form);
  eloChoice.hidden = (data.get("nbPlayers") === "2");
  config.nbPlayers = Number(data.get("nbPlayers"));
  config.elo = Number(data.get("elo"));
});

const radioInput = form.querySelector(`input[name=nbPlayers][value="${config.nbPlayers}"]`);
radioInput.checked = true;
form.dispatchEvent(new Event("change"));

form.addEventListener("submit", e => {
  e.preventDefault();

  if (game.history().length) {
    game.reset();
    board.start();
    while (movesUci.length) movesUci.pop();
  }

  const data = new FormData(form);

  stockfish.elo = Number(data.get("elo"));

  stockfish.init();

  newGameModal.close();
});

form.addEventListener("reset", e => {
  e.preventDefault();
  newGameModal.close();
});

showModal();