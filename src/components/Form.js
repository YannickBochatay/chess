import { state, onStateChange, offStateChange } from "../state.js";

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

  #handleSubmit(e) {
    e.preventDefault();

    const board = document.querySelector("chess-board");
    
    board.elo = state.elo;
    board.nbPlayers = state.nbPlayers;
    board.color = state.color;

    board.start();
  }

  #handleReset = e => {
    e.preventDefault();
  }

  #handlePlayerChange = () => {
    this.querySelector("chess-color-choice").hidden = state.nbPlayers !== 1
    this.querySelector("chess-level-choice").hidden = state.nbPlayers === 2
  }

  #handleMovePiece = () => {
    const board = document.querySelector("chess-board");
    this.querySelector("input[type=reset]").hidden = !board.hasBegun();
  }

  connectedCallback() {
    const form = this.querySelector("form");
    form.addEventListener("submit", this.#handleSubmit);
    form.addEventListener("reset", this.#handleReset);

    onStateChange("nbPlayers", this.#handlePlayerChange);
    onStateChange("movesUci", this.#handleMovePiece);
  }

  disconnectedCallback() {
    offStateChange("nbPlayers", this.#handlePlayerChange);
    offStateChange("movesUci", this.#handleMovePiece);
  }

}

customElements.define("chess-form-choice", FormChoice)