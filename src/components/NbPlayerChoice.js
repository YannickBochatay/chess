import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template")

template.innerHTML = `
  <fieldset>
    <legend>Nombre de joueurs</legend>
    <label>
      <input type="radio" name="nbPlayers" checked value="0">
      0 joueur
    </label>
    <label>
      <input type="radio" name="nbPlayers" checked value="1">
      1 joueur
    </label>
    <label>
      <input type="radio" name="nbPlayers" value="2">
      2 joueurs
    </label>
  </fieldset>
`

class NbPlayerChoice extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    const input = this.querySelector(`input[value="${state.nbPlayers}"]`);
    if (!input.checked) input.checked = true;
  }

  #handleChange(e) {
    if (e.target.checked) state.nbPlayers = Number(e.target.value)
  }

  connectedCallback() {
    this.#update();
    this.querySelectorAll("input[name=nbPlayers]").forEach(elmt => {
      elmt.addEventListener("change", this.#handleChange);
    });
    onStateChange("nbPlayers", this.#update)
  }

  disconnectedCallback() {
    offStateChange("nbPlayers", this.#update)
  }
}

customElements.define("chess-nb-players-choice", NbPlayerChoice)