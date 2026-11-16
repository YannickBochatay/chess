export function playSound(file) {
  const audio = new Audio(`../../assets/audio/${file}.mp3`)
  return audio.play();
}