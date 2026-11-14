import { createState } from "./utils/createState.js"

export const { state, onStateChange, offStateChange } = createState({
  nbPlayers : 1,
  color : "white",
  elo : 1500,
  movesUci : []
})