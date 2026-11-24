import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
<style>
input[type=range]#score {
  background:none;
  cursor:default;
  opacity:1;
  writing-mode: vertical-lr;
  &::-webkit-slider-thumb, &::-moz-range-thumb {
    width:0;
    height:0;
    padding:0;
  }
  &::-moz-range-progress {
    width:10px;
    background: black;
    border-radius: 0;
  }
}
</style>
<input id="score" type="range" min="-10" max="10" step="0.01" disabled/>
`

class Score extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    let move = state.movesUci[state.moveIndex];
    let score;

    if (!move) score = 0.3;
    else if (move.score.type === "cp") score = -move.score.value;
    else score = 10; // TODO -10 si c'est les noirs

    this.querySelector("input").value = score;
  }

  connectedCallback() {
    onStateChange("moveIndex", this.#update);
  }

  disconnectedCallback() {
    offStateChange("moveIndex", this.#update);
  }
}

customElements.define("chess-score", Score);