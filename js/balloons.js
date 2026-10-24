
/*
  OUR LITTLE WORLD ♡
  Balloon interaction — room version
*/

(function () {
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

  function getBalloonContainer() {
    // Put the balloons inside the illustrated room.
    return (
      document.getElementById("balloon-area") ||
      document.getElementById("balloons-container") ||
      document.getElementById("balloons")
    );
  }

  function getBalloonMessage() {
    if (
      window.LittleWorldTheme &&
      typeof window.LittleWorldTheme.getRandomBalloonMessage === "function"
    ) {
      return window.LittleWorldTheme.getRandomBalloonMessage();
    }

    return BALLOON_CONFIG.messages[
      Math.floor(Math.random() * BALLOON_CONFIG.messages.length)
    ];
  }

  function playBalloonPopSound() {
    if (
      window.LittleWorldSFX &&
      typeof window.LittleWorldSFX.play === "function" &&
      (!window.LittleWorld || window.LittleWorld.soundEnabled)
    ) {
      window.LittleWorldSFX.play("pop");
    }
  }

  function createBalloonConfetti(balloon) {
    const rect = balloon.getBoundingClientRect();
    const layer = document.createElement("div");

    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      overflow: "hidden",
      zIndex: "999"
    });

    document.body.appendChild(layer);

    const colors = ["#E63946", "#B11226", "#F5F5F5", "#8B0000"];

    for (let i = 0; i < 18; i++) {
      const piece = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 90;

      Object.assign(piece.style, {
        position: "absolute",
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top + rect.height / 2}px`,
        width: "6px",
        height: "6px",
        backgroundColor: colors[i % colors.length],
        imageRendering: "pixelated",
        animation: "balloon-confetti-burst 700ms ease-out forwards"
      });

      piece.style.setProperty("--confetti-x", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--confetti-y", `${Math.sin(angle) * distance - 25}px`);

      layer.appendChild(piece);
    }

    window.setTimeout(() => layer.remove(), 900);
  }

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
      window.LittleWorld.showMessage(message, "A little wish for you ♡");
    } else {
      window.alert(message);
    }

    window.dispatchEvent(
      new CustomEvent("littleworld:balloonpopped", {
        detail: { message }
      })
    );
  }

  function createBalloon(index) {
    const balloon = document.createElement("button");
    balloon.type = "button";
    balloon.className = "birthday-balloon";
    balloon.dataset.popped = "false";
    balloon.dataset.message = getBalloonMessage();
    balloon.setAttribute("aria-label", `Pop birthday balloon ${index + 1}`);

    const imagePath = BALLOON_CONFIG.images[index % BALLOON_CONFIG.images.length];
    const image = document.createElement("img");

    image.className = "balloon-image";
    image.src = imagePath;
    image.alt = "";
    image.draggable = false;
    image.setAttribute("aria-hidden", "true");

    image.addEventListener("error", () => {
      console.error(`Could not load balloon image: ${imagePath}`);
    });

    const string = document.createElement("span");
    string.className = "balloon-string";
    string.setAttribute("aria-hidden", "true");

    balloon.append(image, string);
    balloon.addEventListener("click", () => popBalloon(balloon));

    return balloon;
  }

  function createBalloons() {
    const container = getBalloonContainer();

    if (!container) {
      console.warn("Could not find a balloon container.");
      return;
    }

    container.replaceChildren();

    for (let i = 0; i < BALLOON_CONFIG.count; i++) {
      container.appendChild(createBalloon(i));
    }

    balloonsInitialized = true;
  }

  function initializeBalloons() {
    if (balloonsInitialized) return;
    createBalloons();
  }

  window.LittleWorldBalloons = {
    initialize: initializeBalloons,
    create: createBalloons,
    reset: createBalloons,
    pop: popBalloon
  };

  window.addEventListener("littleworld:entered", initializeBalloons);

  // Also initialize if the room-entry event already happened.
  document.addEventListener("DOMContentLoaded", () => {
    const enterButton = document.getElementById("enter-button");

    if (enterButton) {
      enterButton.addEventListener("click", () => {
        window.setTimeout(initializeBalloons, 100);
      });
    }
  });
})();
