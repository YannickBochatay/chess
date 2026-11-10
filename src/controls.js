import { board, movesUci } from "./board.js"
import { game } from "./game.js"

document.querySelector("#flip").addEventListener("click", board.flip);

document.querySelector("#newgame").addEventListener("click", () => {
  if (game.history().length && confirm("Etes-vous sûr de vouloir abandonner la partie en cours ?")) {
    game.reset();
    board.start();
    while (movesUci.length) movesUci.pop();
  }
});