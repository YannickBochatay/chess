import { config, onStateChange, offStateChange } from "../config.js";
import { game } from "../game.js";
import { board, playEngineMove, movesUci } from "../board.js";
import { stockfish } from "../stockfish.js";

const template = document.createElement("template")

template.innerHTML = `
  <style>
    #onePlayerChoices {
      margin:20px 0;
    }
  </style>
  <form>
    <article>
      <header>
        <h3>Nouvelle partie</h3>
      </header>
      <main>
        <chess-nb-players-choice></chess-nb-players-choice>
        <div id="onePlayerChoices">
          <chess-color-choice></chess-color-choice>
          <chess-level-choice></chess-level-choice>
        </div>
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
      while (movesUci.length) movesUci.pop();
    }
  
    stockfish.elo = config.elo;
    await stockfish.init();

    if (config.nbPlayers === 1) {
        
      let color = config.color;
    
      if (color === "random") color = Math.random() > 0.5 ? "black" : "white";
    
      board.orientation(color);
      if (color === "black") await playEngineMove();

    } else if (config.nbPlayers === 0) {

    }
  }

  #handleReset = e => {
    e.preventDefault();
  }

  #handlePlayerChange = () => {
    this.querySelector("#onePlayerChoices").hidden = config.nbPlayers !== 1
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