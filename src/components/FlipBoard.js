const template = document.createElement("template");

template.innerHTML = `
  <button class="outline">Retourner l'échiquier</button>
`

class FlipBoard extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.querySelector("button").addEventListener("click", () => {
      document.querySelector("chess-board").flip();
    });
  }
}

customElements.define("chess-flip-board", FlipBoard);