import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
  <style>
    #moves-history {
      margin-bottom:0;
      ul {
        max-width:23ch;
        height:9rem;
        text-align:left;
        border:1px solid var(--s-border);
        padding:5px 10px;
        overflow:auto;
        list-style-type:none;

        li {
          display:inline-block;
          margin:0 3px;

          a {
            text-decoration:none;
            color:inherit;
            &.selected {
              font-weight:bold;
            }
          }
        }
      }
    } 
  </style>
  <section id="moves-history">
    <h5>Historique des coups</h5>
    <ul></ul>
  </section>
`

class Moves extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    const ul = this.querySelector("ul");
    const children = state.movesUci.map((move, index) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#";
      a.addEventListener("click", () => state.moveIndex = index);
      a.textContent = move.move;
      if (index === state.moveIndex) a.classList.add("selected");
      li.append(a);

      return li;
    });
    ul.replaceChildren(...children);
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