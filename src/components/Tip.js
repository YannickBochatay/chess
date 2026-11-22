import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
<div>
  <button class="outline">💡</button>
  <span id="eval"></span>
</div>
`

class Tip extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    let content = "";

    if (state.tip) {
      const { score } = state.tip.bestMoves[state.tip.currentIndex];
      content = score.type === "cp" ? score.value : `mat en ${score.value}`;
    }

    this.querySelector("#eval").textContent = content;
  }

  #handleClick = () => {
    document.querySelector("chess-board").showTip();
  }

  connectedCallback() {
    this.querySelector("button").addEventListener("click", this.#handleClick);

    onStateChange("tip", this.#update);
  }

  disconnectedCallback() {
    offStateChange("tip", this.#update);
  }
}

customElements.define("chess-tip", Tip);