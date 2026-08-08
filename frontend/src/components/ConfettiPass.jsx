import confetti from "canvas-confetti";

export function celebratePass() {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;

  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
  };

  const randomInRange = (min, max) => {
    return Math.random() * (max - min) + min;
  };

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: {
        x: randomInRange(0.1, 0.3),
        y: Math.random() - 0.2,
      },
    });

    confetti({
      ...defaults,
      particleCount,
      origin: {
        x: randomInRange(0.7, 0.9),
        y: Math.random() - 0.2,
      },
    });
  }, 250);

  // Extra star burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      startVelocity: 45,
      scalar: 1.2,
      origin: {
        x: 0.5,
        y: 0.6,
      },
      colors: [
        "#FFE400",
        "#FFBD00",
        "#E89400",
        "#FFCA6C",
        "#FDFFB8",
      ],
      zIndex: 9999,
    });
  }, 200);
}