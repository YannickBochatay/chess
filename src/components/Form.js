import { state, onStateChange, offStateChange } from "../state.js";
import { game } from "../game.js";
import { board, playEngineMove } from "../board.js";
import { stockfish } from "../stockfish.js";
import { throwConfetti } from "../confetti.js";

const template = document.createElement("template")

template.innerHTML = `
  <form>
    <article>
      <header>
        <h3>Nouvelle partie</h3>
      </header>
      <main>
        <chess-nb-players-choice></chess-nb-players-choice>
        <chess-color-choice></chess-color-choice>
        <chess-level-choice></chess-level-choice>
      </main>
      <footer>
        <input type="reset" value="Annuler" class="outline" hidden/>
        <input type="submit" value="Commencer"/>
      </footer>
    </article>
  </form>
`

class FormChoice extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  async #handleSubmit(e) {
    e.preventDefault();
  
    if (game.history().length) {
      game.reset();
      board.start();
      state.movesUci = [];
    }
  
    stockfish.elo = state.elo;
    await stockfish.init();

    if (state.nbPlayers === 1) {
        
      let color = state.color;
    
      if (color === "random") color = Math.random() > 0.5 ? "black" : "white";
    
      board.orientation(color);
      if (color === "black") await playEngineMove();

    } else if (state.nbPlayers === 0) {
      await (async function autoPlay() {
        if (game.isGameOver()) throwConfetti()
        else {
          await playEngineMove();
          setTimeout(autoPlay, 1000);
        }
      })()
    }
  }

  #handleReset = e => {
    e.preventDefault();
  }

  #handlePlayerChange = () => {
    this.querySelector("chess-color-choice").hidden = state.nbPlayers !== 1
    this.querySelector("chess-level-choice").hidden = state.nbPlayers === 2
  }

  connectedCallback() {
    const form = this.querySelector("form");
    form.addEventListener("submit", this.#handleSubmit);
    form.addEventListener("reset", this.#handleReset);

    onStateChange("nbPlayers", this.#handlePlayerChange);
  }

  disconnectedCallback() {
    offStateChange("nbPlayers", this.#handlePlayerChange);
  }

}

customElements.define("chess-form-choice", FormChoice)