const template = document.createElement("template");

template.innerHTML = `
  <button class="outline">💡</button>
`

class Tip extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #handleClick = () => {
    document.querySelector("chess-board").showTip();
  }

  connectedCallback() {
    this.querySelector("button").addEventListener("click", this.#handleClick);
  }
}

customElements.define("chess-tip", Tip);