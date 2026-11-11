import { board, movesUci, playEngineMove } from "./board.js"
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

const onePlayerChoices = form.querySelector("#onePlayerChoices");

const radioInput = form.querySelector(`input[name=nbPlayers][value="${config.nbPlayers}"]`);
radioInput.checked = true;

const colorInput = form.querySelector(`input[name=color][value="${config.color}"]`);
colorInput.checked = true;

form.addEventListener("change", e => {
  const data = new FormData(form);
  onePlayerChoices.hidden = (data.get("nbPlayers") === "2");
  config.nbPlayers = Number(data.get("nbPlayers"));
  config.elo = Number(data.get("elo"));
  config.color = data.get("color");
});

form.dispatchEvent(new Event("change"));

form.addEventListener("submit", async e => {
  e.preventDefault();

  if (game.history().length) {
    game.reset();
    board.start();
    while (movesUci.length) movesUci.pop();
  }

  const data = new FormData(form);

  stockfish.elo = Number(data.get("elo"));
  
  newGameModal.close();

  await stockfish.init();

  board.orientation(data.get("color"));
  if (data.get("color") === "black") {
    await playEngineMove();
  }
});

form.addEventListener("reset", e => {
  e.preventDefault();
  newGameModal.close();
});

showModal();