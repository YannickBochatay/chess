import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
  <style>
    #moves-history {
      margin-bottom:0;
      p {
        max-width:23ch;
        height:9rem;
        text-align:left;
        border:1px solid var(--s-border);
        padding:5px 10px;
        overflow:auto;
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
    this.querySelector("p").innerHTML = state.movesUci.map((move, index) => (
      state.moveIndex === index ? `<strong>${move}</strong>` : move
    )).join(", ");
  }

  connectedCallback() {
    onStateChange("movesUci", this.#update);
    onStateChange("moveIndex", this.#update);
  }

  disconnectedCallback() {
    offStateChange("movesUci", this.#update);
    offStateChange("moveIndex", this.#update);
  }
}

customElements.define("chess-moves", Moves);