import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
<div>
  
</div>
<input type="range" min="-5" max="5" step="0.01" disabled/>
`

class Score extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    this.querySelector("div").textContent = state.score;
    this.querySelector("input").value = state.score;
  }

  connectedCallback() {
    onStateChange("score", this.#update);
  }

  disconnectedCallback() {
    offStateChange("score", this.#update);
  }
}

customElements.define("chess-score", Score);