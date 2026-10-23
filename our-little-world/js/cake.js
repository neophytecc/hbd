
(function () {
  function initCake() {
    const cake = document.getElementById("cake");
    const art = document.getElementById("cake-art");
    const hint = document.getElementById("cake-hint");

    if (!cake || !art || cake.dataset.ready === "1") return;
    cake.dataset.ready = "1";

    const litSrc = art.dataset.lit || "/assets/px-cake.png";
    const blownSrc = art.dataset.blown || "/assets/px-cake-blown.png";

    const preload = new Image();
    preload.src = blownSrc;

    let audioContext = null;
    let micStream = null;
    let analyser = null;
    let micData = null;
    let micFrame = null;
    let micActive = false;
    let blowStarted = 0;
    let cooldownUntil = 0;

    function setBlown(blown) {
      const isBlown = cake.classList.contains("blown");

      if (blown === isBlown) return;

      if (blown) {
        cake.classList.add("blown", "just-blew");
        art.src = blownSrc;
        cake.setAttribute("aria-pressed", "true");
        if (hint) hint.textContent = "click to relight";
        window.PartySfx?.blow();
        window.PartyUI?.toast("*whoosh* candles out");

        window.setTimeout(() => {
          cake.classList.remove("just-blew");
        }, 700);
      } else {
        cake.classList.remove("blown", "just-blew");
        art.src = litSrc;
        cake.setAttribute("aria-pressed", "false");
        if (hint) hint.textContent = "blow into your mic or click to blow";
        window.PartySfx?.light();
        window.PartyUI?.toast("candles relit");
      }
    }

    cake.addEventListener("click", () => {
      setBlown(!cake.classList.contains("blown"));
    });

    async function startMic() {
      if (micActive) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        if (hint) hint.textContent =
          "Microphone unavailable. Use HTTPS or localhost.";
        return;
      }

      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        });

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) throw new Error("AudioContext unavailable");

        audioContext = new AudioCtx();
        await audioContext.resume();

        const source = audioContext.createMediaStreamSource(micStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.15;
        source.connect(analyser);

        micData = new Uint8Array(analyser.fftSize);
        micActive = true;
        if (hint) hint.textContent = "blow into your mic to extinguish the candles";

        detectBlow();
      } catch (error) {
        console.error("Microphone setup failed:", error);
        if (hint) hint.textContent =
          "Mic permission needed. Allow microphone access and try again.";
        stopMic();
      }
    }

    function detectBlow() {
      if (!micActive || !analyser) return;

      analyser.getByteTimeDomainData(micData);

      let sum = 0;
      for (let i = 0; i < micData.length; i++) {
        const sample = (micData[i] - 128) / 128;
        sum += sample * sample;
      }

      const rms = Math.sqrt(sum / micData.length);
      const now = performance.now();

      // Tune this threshold if your microphone is especially quiet or sensitive.
      const threshold = 0.12;

      if (rms > threshold) {
        if (!blowStarted) blowStarted = now;

        // Require a sustained burst to reduce accidental triggers.
        if (
          now - blowStarted > 180 &&
          now > cooldownUntil &&
          !cake.classList.contains("blown")
        ) {
          setBlown(true);
          cooldownUntil = now + 1500;
          blowStarted = 0;
        }
      } else {
        blowStarted = 0;
      }

      micFrame = requestAnimationFrame(detectBlow);
    }

    function stopMic() {
      micActive = false;

      if (micFrame !== null) {
        cancelAnimationFrame(micFrame);
        micFrame = null;
      }

      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
      }

      if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
      }

      analyser = null;
      micData = null;
    }

    // Start microphone detection only after an explicit user action.
    if (hint) {
      hint.textContent = "click here to enable mic, then blow!";

      hint.style.cursor = "pointer";
      hint.setAttribute("role", "button");
      hint.setAttribute("tabindex", "0");

      hint.addEventListener("click", startMic);
      hint.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startMic();
        }
      });
    }

    window.addEventListener("pagehide", stopMic);
  }

  window.PartyCake = { init: initCake };
})();

