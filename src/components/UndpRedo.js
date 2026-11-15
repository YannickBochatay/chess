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
    console.log("will redo");
  }

  connectedCallback() {
    this.querySelector("#undo").addEventListener("click", this.#handleClickUndo);
    this.querySelector("#redo").addEventListener("click", this.#handleClickRedo);
  }
}

customElements.define("chess-undo-redo", UndoRedo);