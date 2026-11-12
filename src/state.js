import { createState } from "./utils.js"

export const { state, onStateChange, offStateChange } = createState({
  nbPlayers : 1,
  color : "white",
  elo : 1500,
  movesUci : []
})