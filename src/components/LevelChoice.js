import { state, onStateChange, offStateChange } from "../state.js"

const template = document.createElement("template")

template.innerHTML = `
  <style>
    label[for="elo"] {
      font-weight:bold;
    }
    input[type=range] {
      margin-bottom:0;
    }
    datalist {
      display:flex;
      justify-content:space-between;
    }
  </style>
  <fieldset>
    <legend>Niveau de l'ordinateur</legend>
      <label>
        <input type="radio" name="type_level" checked="checked" value="elo"/>
        Elo
      </label>
      <label>
        <input type="radio" name="type_level" value="skill"/>
        Niveau 1 à 20
      </label>
    <div id="elo">
      <label for="elo_field">
        Niveau
      </label>
      <input
        type="range"
        name="elo"
        min="1320"
        max="3190"
        step="10"
        id="elo_field"
        value="1500"
        list="elo_values"
      />
      <datalist id="elo_values">
        <option value="1320" label="1320"></option>
        <option value="2255" label="2255"></option>
        <option value="3190" label="3190"></option>
      </datalist>
    </div>
    <div id="skill" hidden>
      <label for="skill_field">
        Niveau
      </label>
      <input
        type="range"
        name="skill"
        min="1"
        max="20"
        step="1"
        id="skill_field"
        value="10"
        list="skill_values"
      />
      <datalist id="skill_values">
        <option value="1" label="1"></option>
        <option value="10" label="10"></option>
        <option value="20" label="20"></option>
      </datalist>
    </div>
  </fieldset>
`;

class LevelChoice extends HTMLElement {

  constructor() {
    super();
    this.append(template.content.cloneNode(true));
  }

  #update = () => {
    this.querySelector("input[name=elo]").value = state.elo;
    this.querySelector("input[name=skill]").value = state.skillLevel;
    
    this.querySelector("input[name=type_level][value=elo]").checked = state.levelType === "elo";
    this.querySelector("input[name=type_level][value=skill]").checked = state.levelType === "skill";
    this.querySelector(`#elo`).hidden = state.levelType === "skill";
    this.querySelector(`#skill`).hidden = state.levelType === "elo";
  }

  connectedCallback() {
    this.#update();
    this.querySelector("input[name=elo]").addEventListener("change", e => state.elo = Number(e.target.value));
    this.querySelector("input[name=skill]").addEventListener("change", e => state.skillLevel = Number(e.target.value));

    this.querySelectorAll("input[name=type_level]").forEach(input => {
      input.addEventListener("change", () => {
        if (input.checked) state.levelType = input.value;
      });
    })

    onStateChange(["elo", "skillLevel", "levelType"], this.#update);
  }

  disconnectedCallback() {
    offStateChange(["elo", "skillLevel", "levelType"], this.#update);
  }
}

customElements.define("chess-level-choice", LevelChoice)