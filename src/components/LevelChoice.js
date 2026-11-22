import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template")

template.innerHTML = `
  <style>
    label[for="elo"] {
      font-weight:bold;
    }
    input[type=range]#elo {
      margin-bottom:0;
    }
    datalist {
      display:flex;
      justify-content:space-between;
    }
  </style>
  <fieldset>
    <label for="elo">
      Niveau de l'ordinateur
    </label>
    <input
      type="range"
      name="elo"
      min="1320"
      max="3190"
      step="10"
      id="elo"
      value="1500"
      list="elo_values"
    />
    <datalist id="elo_values">
      <option value="1320" label="1320"></option>
      <option value="2255" label="2255"></option>
      <option value="3190" label="3190"></option>
    </datalist>
  </fieldset>
`;

class LevelChoice extends HTMLElement {

  #input

  constructor() {
    super()
    this.append(template.content.cloneNode(true))
    this.#input = this.querySelector("input")
  }

  #update = () => {
    this.#input.value = state.elo;
  }

  connectedCallback() {
    this.#update();
    this.#input.addEventListener("change", e => state.elo = Number(e.target.value));
    onStateChange("elo", this.#update);
  }

  disconnectedCallback() {
    offStateChange("elo", this.#update);
  }
}

customElements.define("chess-level-choice", LevelChoice)