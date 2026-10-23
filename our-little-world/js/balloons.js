
/*
=========================================================
OUR LITTLE WORLD ♡
File: js/balloons.js

Features:
- Six floating pixel-art balloons
- Four balloon images from the asset/ folder
- Click or keyboard to pop
- Birthday message popup
- Confetti burst
- Optional sound effects
=========================================================
*/

(function () {
  /* BALLOON SETTINGS */

  const BALLOON_CONFIG = {
    count: 6,

    images: [
      "asset/px-balloon-blue.png",
      "asset/px-balloon-pink.png",
      "asset/px-balloon-purple.png",
      "asset/px-balloon-yellow.png"
    ],

    messages: [
      "Thank you for being part of my world ♡",
      "You are loved more than you know.",
      "Make a wish ✨",
      "Happy Birthday!",
      "You make life a little more magical.",
      "Here's to more beautiful memories together ♡"
    ]
  };

  let balloonsInitialized = false;

  /* FIND THE BALLOON CONTAINER */

  function getBalloonContainer() {
    return (
      document.getElementById("balloons-container") ||
      document.getElementById("balloons")
    );
  }

  /* GET A RANDOM MESSAGE */

  function getBalloonMessage() {
    if (
      window.LittleWorldTheme &&
      typeof window.LittleWorldTheme.getRandomBalloonMessage === "function"
    ) {
      return window.LittleWorldTheme.getRandomBalloonMessage();
    }

    const index = Math.floor(
      Math.random() * BALLOON_CONFIG.messages.length
    );

    return BALLOON_CONFIG.messages[index];
  }

  /* PLAY SOUND IF AVAILABLE */

  function playBalloonPopSound() {
    if (
      window.LittleWorldSFX &&
      typeof window.LittleWorldSFX.play === "function" &&
      (!window.LittleWorld || window.LittleWorld.soundEnabled)
    ) {
      window.LittleWorldSFX.play("pop");
    }
  }

  /* CREATE CONFETTI */

  function createBalloonConfetti(balloon) {
    const rectangle = balloon.getBoundingClientRect();

    const centerX = rectangle.left + rectangle.width / 2;
    const centerY = rectangle.top + rectangle.height / 2;

    const confettiLayer = document.createElement("div");

    confettiLayer.className = "balloon-confetti-layer";
    Object.assign(confettiLayer.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: "999"
    });

    document.body.appendChild(confettiLayer);

    const colors = ["#E63946", "#B11226", "#F5F5F5", "#8B0000"];

    for (let index = 0; index < 18; index++) {
      const piece = document.createElement("span");

      piece.className = "balloon-confetti";

      Object.assign(piece.style, {
        position: "absolute",
        left: `${centerX}px`,
        top: `${centerY}px`,
        width: "6px",
        height: "6px",
        backgroundColor:
          colors[Math.floor(Math.random() * colors.length)],
        imageRendering: "pixelated",
        animation: "balloon-confetti-burst 700ms ease-out forwards"
      });

      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 90;

      piece.style.setProperty(
        "--confetti-x",
        `${Math.cos(angle) * distance}px`
      );

      piece.style.setProperty(
        "--confetti-y",
        `${Math.sin(angle) * distance - 25}px`
      );

      confettiLayer.appendChild(piece);
    }

    window.setTimeout(() => confettiLayer.remove(), 900);
  }

  /* POP A BALLOON */

  function popBalloon(balloon) {
    if (!balloon || balloon.dataset.popped === "true") return;

    balloon.dataset.popped = "true";

    const message = balloon.dataset.message || getBalloonMessage();

    playBalloonPopSound();
    createBalloonConfetti(balloon);

    balloon.classList.add("balloon-popped");

    window.setTimeout(() => balloon.remove(), 250);

    if (
      window.LittleWorld &&
      typeof window.LittleWorld.showMessage === "function"
    ) {
      window.LittleWorld.showMessage(
        message,
        "A little wish for you ♡"
      );
    } else {
      window.alert(message);
    }

    window.dispatchEvent(
      new CustomEvent("littleworld:balloonpopped", {
        detail: { message }
      })
    );
  }

  /* CREATE ONE BALLOON */

  function createBalloon(index) {
    const balloon = document.createElement("button");

    balloon.type = "button";
    balloon.className = "birthday-balloon";

    balloon.dataset.popped = "false";
    balloon.dataset.message = getBalloonMessage();

    balloon.setAttribute(
      "aria-label",
      `Pop birthday balloon ${index + 1}`
    );

    // Cycle through the four image files for six balloons.
    const imagePath =
      BALLOON_CONFIG.images[index % BALLOON_CONFIG.images.length];

    const image = document.createElement("img");

    image.className = "balloon-image";
    image.src = imagePath;
    image.alt = "";
    image.draggable = false;
    image.setAttribute("aria-hidden", "true");

    image.addEventListener("error", () => {
      console.error(`Could not load balloon image: ${imagePath}`);
    });

    balloon.style.setProperty("--balloon-left", `${8 + index * 16}%`);
    balloon.style.animationDelay = `${index * -0.6}s`;
    balloon.style.animationDuration = `${3 + Math.random() * 2}s`;

    const string = document.createElement("span");

    string.className = "balloon-string";
    string.setAttribute("aria-hidden", "true");

    balloon.appendChild(image);
    balloon.appendChild(string);

    balloon.addEventListener("click", () => popBalloon(balloon));

    return balloon;
  }

  /* CREATE ALL BALLOONS */

  function createBalloons() {
    const container = getBalloonContainer();

    if (!container) {
      console.warn(
        "Balloons need #balloons-container or #balloons."
      );
      return;
    }

    container.replaceChildren();

    for (let index = 0; index < BALLOON_CONFIG.count; index++) {
      container.appendChild(createBalloon(index));
    }

    balloonsInitialized = true;
  }

  /* RESET BALLOONS */

  function resetBalloons() {
    createBalloons();
  }

  /* INITIALIZE */

  function initializeBalloons() {
    if (balloonsInitialized) return;
    createBalloons();
  }

  /* PUBLIC API */

  window.LittleWorldBalloons = {
    initialize: initializeBalloons,
    create: createBalloons,
    reset: resetBalloons,
    pop: popBalloon
  };

  /* START WHEN THE ROOM OPENS */

  window.addEventListener("littleworld:entered", initializeBalloons);
})();
