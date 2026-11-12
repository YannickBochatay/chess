import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template")

template.innerHTML = `
  <fieldset>
    <legend>Couleur</legend>
    <label>
    <input type="radio" name="color" checked value="white">
      blancs
    </label>
    <label>
      <input type="radio" name="color" value="black">
      noirs
    </label>
    <label>
      <input type="radio" name="color" value="random">
      aléatoire
    </label>
  </fieldset>
`

class ColorChoice extends HTMLElement {

  constructor() {
    super()
    this.append(template.content.cloneNode(true))
  }

  #update = () => {
    const input = this.querySelector(`input[value="${state.color}"]`);
    if (!input.checked) input.checked = true;
  }

  #handleChange(e) {
    if (e.target.checked) state.color = e.target.value
  }

  connectedCallback() {
    this.#update();
    this.querySelectorAll("input[name=color]").forEach(
      elmt => elmt.addEventListener("change", this.#handleChange)
    );
    onStateChange("color", this.#update)
  }

  disconnectedCallback() {
    offStateChange("color", this.#update)
  }
}

customElements.define("chess-color-choice", ColorChoice)