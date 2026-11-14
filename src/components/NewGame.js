const template = document.createElement("template");

template.innerHTML = `
  <button>Nouvelle partie</button>
  <dialog id="newgame-config">
    <chess-form-choice></chess-form-choice>
  </dialog>
`

class NewGame extends HTMLElement {

  #dialog

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
    this.#dialog = this.querySelector("dialog");
  }

  openModal = () => {
    this.#dialog.showModal();
  }

  closeModal = () => {
    this.#dialog.close();
  }

  connectedCallback() {
    this.querySelector("button").addEventListener("click", this.openModal);
    
    const form = this.querySelector("chess-form-choice form");
    form.addEventListener("reset", this.closeModal);
    form.addEventListener("submit", this.closeModal);

    this.openModal();
  }

}

customElements.define("chess-new-game", NewGame);