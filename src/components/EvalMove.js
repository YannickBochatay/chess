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
    this.querySelector("div").textContent = state.evalMove;
  }

  connectedCallback() {
    onStateChange("evalMove", this.#update);
  }

  disconnectedCallback() {
    offStateChange("evalMove", this.#update);
  }
}

customElements.define("chess-eval", EvalMove);