import Chessboard from "chessboard"

const board = Chessboard("board", {
  draggable:true,
  dropOffBoard:"trash",
  sparePieces:true
})

setTimeout(board.start, 2000);