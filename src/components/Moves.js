import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
  <style>
    #moves-history {
      p {
        max-width:20ch;
        text-align:left;
      }
    } 
  </style>
  <section id="moves-history">
    <h5>Historique des coups</h5>
    <p></p>
  </section>
`

class Moves extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    this.querySelector("p").innerText = state.movesUci.join(", ");
  }

  connectedCallback() {
    onStateChange("movesUci", this.#update);
  }

  disconnectedCallback() {
    offStateChange("movesUci", this.#update);
  }
}

customElements.define("chess-moves", Moves);