import Chessboard from "chessboard";
import { game } from "./game.js";
import $ from "jquery";
import { throwConfetti } from "./confetti.js";

const whiteSquareGrey = '#a9a9a9'
const blackSquareGrey = '#696969'

function removeGreySquares() {
  $('#board .square-55d63').css('background', '')
}

function greySquare(square) {
  const $square = $('#board .square-' + square)
  const background = $square.hasClass('black-3c85d') ? blackSquareGrey : whiteSquareGrey

  $square.css('background', background)
}

function onDragStart(source, piece) {
  // do not pick up pieces if the game is over
  if (game.isGameOver()) return false

  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop(source, target) {
  removeGreySquares()

  try {
    game.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
    if (game.isGameOver()) throwConfetti()
  } catch(e) {
    return "snapback"
  }
}

function onMouseoverSquare(square, piece) {
  // get list of possible moves for this square
  const moves = game.moves({
    square: square,
    verbose: true
  })

  if (moves.length === 0) return

  greySquare(square)

  // highlight the possible squares for this piece
  for (const move of moves) greySquare(move.to);
}

function onMouseoutSquare(square, piece) {
  removeGreySquares()
}

function onSnapEnd() {
  board.position(game.fen())
}

const config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd
}

export const board = Chessboard("board", config);
