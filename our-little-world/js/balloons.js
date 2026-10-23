
/*
=========================================================
OUR LITTLE WORLD ♡
File: js/balloons.js

Creates interactive birthday balloons.

Features:
- Six floating balloons
- Red, crimson, and black colors
- Click or keyboard to pop
- Birthday message popup
- Confetti burst
- Optional sound effects
=========================================================
*/


/* BALLOON SETTINGS */

const BALLOON_CONFIG = {
  count: 6,

  colors: [
    "#B11226",
    "#E63946",
    "#151515",
    "#6D071A",
    "#8B0000",
    "#2A0A0A"
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


/* KEEP TRACK OF BALLOONS */

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
  // Prefer messages from the personalized theme.
  if (
    window.LittleWorldTheme &&
    typeof window.LittleWorldTheme.getRandomBalloonMessage === "function"
  ) {
    return window.LittleWorldTheme.getRandomBalloonMessage();
  }

  // Use default messages if the theme module is unavailable.
  const index = Math.floor(
    Math.random() * BALLOON_CONFIG.messages.length
  );

  return BALLOON_CONFIG.messages[index];
}


/* PLAY A SOUND IF THE SOUND MODULE EXISTS */

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

  // Confetti is positioned in a fixed overlay.
  const confettiLayer = document.createElement("div");

  confettiLayer.className = "balloon-confetti-layer";

  confettiLayer.style.position = "fixed";
  confettiLayer.style.inset = "0";
  confettiLayer.style.pointerEvents = "none";
  confettiLayer.style.overflow = "hidden";
  confettiLayer.style.zIndex = "999";

  document.body.appendChild(confettiLayer);

  const colors = [
    "#E63946",
    "#B11226",
    "#F5F5F5",
    "#8B0000"
  ];

  for (let index = 0; index < 18; index++) {
    const piece = document.createElement("span");

    piece.className = "balloon-confetti";

    piece.style.position = "absolute";
    piece.style.left = `${centerX}px`;
    piece.style.top = `${centerY}px`;

    piece.style.width = "6px";
    piece.style.height = "6px";

    piece.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    piece.style.imageRendering = "pixelated";

    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 90;

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance - 25;

    piece.style.setProperty("--confetti-x", `${x}px`);
    piece.style.setProperty("--confetti-y", `${y}px`);

    piece.style.animation =
      "balloon-confetti-burst 700ms ease-out forwards";

    confettiLayer.appendChild(piece);
  }

  // Remove the temporary elements after the animation.
  window.setTimeout(function () {
    confettiLayer.remove();
  }, 900);
}


/* POP A BALLOON */

function popBalloon(balloon) {
  // Do not allow the same balloon to pop twice.
  if (balloon.dataset.popped === "true") {
    return;
  }

  balloon.dataset.popped = "true";

  // Remember the balloon's message.
  const message = balloon.dataset.message || getBalloonMessage();

  // Play the optional pop sound.
  playBalloonPopSound();

  // Create the confetti burst before removing the balloon.
  createBalloonConfetti(balloon);

  // Play the CSS pop animation.
  balloon.classList.add("balloon-popped");

  // Remove the balloon from the page after the animation.
  window.setTimeout(function () {
    balloon.remove();
  }, 250);

  // Show the birthday message.
  if (window.LittleWorld) {
    window.LittleWorld.showMessage(
      message,
      "A little wish for you ♡"
    );
  } else {
    window.alert(message);
  }

  // Tell other modules a balloon was popped.
  window.dispatchEvent(
    new CustomEvent("littleworld:balloonpopped", {
      detail: {
        message: message
      }
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

  // Assign a color.
  const color =
    BALLOON_CONFIG.colors[index % BALLOON_CONFIG.colors.length];

  balloon.style.setProperty("--balloon-color", color);

  // Give each balloon a slightly different position.
  balloon.style.setProperty(
    "--balloon-left",
    `${8 + index * 16}%`
  );

  // Vary the floating animation.
  balloon.style.animationDelay = `${index * -0.6}s`;

  balloon.style.animationDuration =
    `${3 + Math.random() * 2}s`;

  // Create the balloon's decorative string.
  const string = document.createElement("span");

  string.className = "balloon-string";
  string.setAttribute("aria-hidden", "true");

  // Add both pointer and keyboard support.
  balloon.addEventListener("click", function () {
    popBalloon(balloon);
  });

  balloon.appendChild(string);

  return balloon;
}


/* CREATE ALL SIX BALLOONS */

function createBalloons() {
  const container = getBalloonContainer();

  if (!container) {
    console.warn(
      "Balloons need an element with id='balloons-container' or id='balloons'."
    );

    return;
  }

  // Prevent duplicate balloons.
  container.replaceChildren();

  for (let index = 0; index < BALLOON_CONFIG.count; index++) {
    const balloon = createBalloon(index);

    container.appendChild(balloon);
  }

  balloonsInitialized = true;
}


/* RESET BALLOONS */

function resetBalloons() {
  createBalloons();
}


/* INITIALIZE THE BALLOON MODULE */

function initializeBalloons() {
  if (balloonsInitialized) {
    return;
  }

  createBalloons();
}


/* PUBLIC API FOR OTHER FILES */

window.LittleWorldBalloons = {
  initialize: initializeBalloons,
  create: createBalloons,
  reset: resetBalloons,
  pop: popBalloon
};


/* START WHEN THE ROOM OPENS */

window.addEventListener("littleworld:entered", function () {
  initializeBalloons();
});
