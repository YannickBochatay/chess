import { createState } from "./utils/createState.js"

const initialState = {
  nbPlayers : 1,
  color : "white",
  elo : 1500,
  engineDelay : 1000,
  movesUci : [],
  moveIndex : -1,
  score : 0,
  tip : null,
  evalMove : null
}

export const { state, onStateChange, offStateChange } = createState({ ...initialState });

onStateChange("engineDelay", value => {
  if (typeof value !== "number") throw new TypeError("engineDelay value must be a number");
  if (value < 0) throw new RangeError("engineDelay value must be greater or equal than 0");
});

onStateChange("elo", value => {
  if (typeof value !== "number") throw new TypeError("ELO value must be a number");
  if (value < 1320) throw new RangeError("ELO value must be greater or equal than 1320");
  if (value > 3190) throw new RangeError("ELO value must be lower or equal than 3190");
});

onStateChange("nbPlayers", value => {
  if (typeof value !== "number") throw new TypeError("nbPlayers value must be a number");
  if (value < 0) throw new RangeError("nbPlayers value must be greater or equal than 0");
  if (value > 2) throw new RangeError("nbPlayers value must be lower or equal than 2");
});

onStateChange("color", value => {
  const values = ["white", "black", "random"];
  if (!values.includes(value)) {
    throw new Error(`${value} is not a correct value for color ("${values.join('", "')}" expected`);
  }
});

export function resetState() {
  state.movesUci = [];
  state.moveIndex = -1;
  state.score = 0;
  state.tip = null;
  state.evalMove = null;
}