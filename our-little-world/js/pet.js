
(function () {
  "use strict";

  function initPet() {
    const stage = document.querySelector(".pixel-stage");
    if (!stage) return;

    // Prevent duplicate cats and animation loops.
    if (stage.dataset.twoCatsReady === "1") return;
    stage.dataset.twoCatsReady = "1";

    const cats = [
      {
        id: "walking-cat-one",
        src: "asset/px-cat.png",
        x: 10,
        direction: 1,
        speed: 0.012
      },
      {
        id: "walking-cat-two",
        src: "asset/px-cat%201.png",
        x: 65,
        direction: -1,
        speed: 0.009
      }
    ];

    const catElements = cats.map((cat, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.id = cat.id;
      button.className = "walking-cat";
      button.setAttribute("aria-label", `Pet walking cat ${index + 1}`);

      Object.assign(button.style, {
        position: "absolute",
        left: `${cat.x}%`,
        top: "calc(86% - 24px)",
        border: "none",
        padding: "0",
        margin: "0",
        background: "transparent",
        cursor: "pointer",
        zIndex: "10"
      });

      const image = document.createElement("img");
      image.src = cat.src;
      image.alt = "";
      image.draggable = false;
      image.className = "walking-cat-art";

      Object.assign(image.style, {
        display: "block",
        width: "64px",
        height: "auto",
        imageRendering: "pixelated",
        pointerEvents: "none"
      });

      image.addEventListener("error", () => {
        console.error(`Could not load cat image: ${cat.src}`);
      });

      button.appendChild(image);
      stage.appendChild(button);

      button.addEventListener("click", () => {
        button.classList.remove("cat-meowing");
        void button.offsetWidth;
        button.classList.add("cat-meowing");

        window.PartySfx?.meow?.();

        window.setTimeout(() => {
          button.classList.remove("cat-meowing");
        }, 350);
      });

      return button;
    });

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let lastTime = 0;
    let animationFrame = null;

    function placeCat(cat, element) {
      element.style.left = `${cat.x}%`;
      element.style.top = "calc(86% - 24px)";

      const image = element.querySelector("img");

      if (image) {
        image.style.transform =
          cat.direction < 0 ? "scaleX(-1)" : "scaleX(1)";
      }
    }

    function animate(time) {
      if (!lastTime) lastTime = time;

      const delta = Math.min(time - lastTime, 32);
      lastTime = time;

      if (!document.hidden && !reduceMotion) {
        cats.forEach((cat, index) => {
          cat.x += cat.direction * cat.speed * delta;

          if (cat.x >= 82) {
            cat.x = 82;
            cat.direction = -1;
          } else if (cat.x <= 3) {
            cat.x = 3;
            cat.direction = 1;
          }

          placeCat(cat, catElements[index]);
        });
      }

      animationFrame = requestAnimationFrame(animate);
    }

    cats.forEach((cat, index) => {
      placeCat(cat, catElements[index]);
    });

    if (!reduceMotion) {
      animationFrame = requestAnimationFrame(animate);
    }

    document.addEventListener("visibilitychange", () => {
      lastTime = 0;
    });
  }

  window.PartyPet = { init: initPet };
  window.PartyCat = { init: initPet };
})();
