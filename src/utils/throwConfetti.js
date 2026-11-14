import confetti from "confetti";

function randomPos() {
  return {
    x : Math.round(innerWidth * Math.random()),
    y : Math.round(innerHeight * Math.random())
  }
}

export function throwConfetti(count=4) {
  
  const confettiConfig = {
    count: 100,
    size: 2,
    velocity: 200,
    fade: false
  };

  let cpt = 1;

  const id = setInterval(() => {
    confetti({
      position : randomPos(),
      ...confettiConfig
    });
    cpt++;
    if (cpt >= count) clearInterval(id);
  }, 1000);

  confetti(confettiConfig);
}
