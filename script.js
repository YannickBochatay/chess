import Chessboard from "chessboard"

const board = Chessboard("board", {
  draggable:true,
  dropOffBoard:"trash"
})

board.start();