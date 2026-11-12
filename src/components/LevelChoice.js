import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template")

template.innerHTML = `
  <style>
    label[for="elo"] {
      font-weight:bold;
    }
    #range {
      display:flex;
      span {
        margin:0 5px;
      }
    }
    #value {
      text-align: center;
    }
  </style>
  <fieldset>
    <label for="elo">
      Niveau de l'ordinateur
    </label>
    <div id="range">
      <span>1320</span>
      <input type="range" name="elo" min="1320" max="3190" step="10" id="elo" value="1500"/>
      <span>3190</span>
    </div>
    <div id="value">
      1500 ELO
    </div>
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
    this.querySelector("#value").textContent = state.elo + " ELO";
  }

  connectedCallback() {
    this.#update();
    this.#input.addEventListener("input", e => { state.elo = Number(e.target.value) });
    onStateChange("elo", this.#update);
  }

  disconnectedCallback() {
    offStateChange("elo", this.#update);
  }
}

customElements.define("chess-level-choice", LevelChoice)