import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template");

template.innerHTML = `
  <style>
    #moves-history {
      margin-bottom:0;
      a {
        text-decoration:none;
        color:inherit;
        &.selected {
          font-weight:bold;
      }
      tbody {
        overflow:auto;
      }
    } 
  </style>
  <section id="moves-history">
    <table>
      <thead>
        <tr>
          <th>Blancs</th>
          <th>Pertinence</th>
          <th>Noirs</th>
          <th>Pertinence</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
  </section>
`

class Moves extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #setMoveLabel({ move, score, bestMove, bestScore }) {
    if (!bestScore) return "";

    if (bestScore.type === "mate") {
      if (score.type === "mate") {
        return "meilleur coup";
      } else {
        return "gaffe (mat manqué)"
      }
    } else if (move === bestMove) {
      return "meilleur coup";
    } else {
      const delta = bestScore.value - score.value;
      if (delta <= 0.1) return "très bon";
      else if (delta <= 0.3) return "bon";
      else if (delta <= 0.5) return "imprécision";
      else if (delta <= 1) return "erreur";
      else return "gaffe";
    }
  }

  #update = () => {
    const tbody = this.querySelector("tbody");

    while (tbody.children.length) tbody.children[0].remove();

    let tr;
    state.movesUci.forEach((move, index) => {
      if (index % 2 === 0) {
        tr = document.createElement("tr");
        tbody.append(tr);
      }

      let td = document.createElement("td");
      const a = document.createElement("a");
      a.href = "#";
      a.addEventListener("click", () => state.moveIndex = index);
      a.textContent = move.move;
      if (index === state.moveIndex) a.classList.add("selected");
      td.append(a);
      tr.append(td);

      td = document.createElement("td");
      td.textContent = this.#setMoveLabel(move);
      tr.append(td);
    });
  }

  connectedCallback() {
    onStateChange("moveIndex", this.#update);
  }

  disconnectedCallback() {
    offStateChange("moveIndex", this.#update);
  }
}

customElements.define("chess-moves", Moves);