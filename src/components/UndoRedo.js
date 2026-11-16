import { state, onStateChange, offStateChange } from "../state.js"

const template  = document.createElement("template");

template.innerHTML = `
  <div data-style="group">
    <button id="undo" class="secondary outline">⟲</button>
    <button id="redo" class="secondary outline">⟳</button>
  </div>
`;

class UndoRedo extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #handleClickUndo = () => {
    const board = document.querySelector("chess-board");
    board.undo();
  }

  #handleClickRedo = () => {
    const board = document.querySelector("chess-board");
    board.redo();
  }

  #update = () => {
    this.querySelector("#undo").disabled = (state.moveIndex < 0);
    this.querySelector("#redo").disabled = (state.moveIndex === state.movesUci.length - 1);
  }

  connectedCallback() {
    this.querySelector("#undo").addEventListener("click", this.#handleClickUndo);
    this.querySelector("#redo").addEventListener("click", this.#handleClickRedo);

    onStateChange("movesUci", this.#update);
    onStateChange("moveIndex", this.#update);
  }

  disconnectedCallback() {
    offStateChange("movesUci", this.#update);
    offStateChange("moveIndex", this.#update);
  }
}

customElements.define("chess-undo-redo", UndoRedo);