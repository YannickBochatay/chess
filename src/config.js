import { createState } from "./utils.js"

export const { state : config, onStateChange, offStateChange } = createState({
  nbPlayers : 1,
  color : "white",
  elo : 1500
})