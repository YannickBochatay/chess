import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
<div>
  
</div>
`

class EvalMove extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    this.querySelector("div").textContent = `${state.lastMoveLabel} (${state.lastMoveScore})`;
  }

  connectedCallback() {
    onStateChange("lastMoveScore", this.#update);
  }

  disconnectedCallback() {
    offStateChange("lastMoveScore", this.#update);
  }
}

customElements.define("chess-eval", EvalMove);