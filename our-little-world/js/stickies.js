
(function () {
  "use strict";

  const STICKY_COLORS = [
    "var(--sticky-1)",
    "var(--sticky-2)",
    "var(--sticky-3)",
    "var(--sticky-4)",
    "var(--sticky-5)"
  ];

  const COLOR_KEYS = [
    "sticky-1",
    "sticky-2",
    "sticky-3",
    "sticky-4",
    "sticky-5"
  ];

  const TABLE = "birthday_stickies";

  let client = null;
  let usingDemo = true;
  let localNotes = [];
  let pendingNote = null;
  let placing = false;
  let ghostEl = null;
  let dragActive = false;
  let initialized = false;

  function roomKey() {
    const theme = window.BIRTHDAY_THEME || {};
    if (theme.preview) return null;
    return theme.id ? String(theme.id) : "default";
  }

  function configReady() {
    const cfg = window.PARTY_CONFIG || {};

    return Boolean(
      cfg.supabaseUrl &&
      cfg.supabaseAnonKey &&
      cfg.supabaseUrl.startsWith("http") &&
      !cfg.supabaseUrl.includes("YOUR_PROJECT") &&
      cfg.supabaseAnonKey !== "YOUR_ANON_KEY"
    );
  }

  function getClient() {
    if (client) return client;
    if (!configReady() || !window.supabase) return null;

    const { supabaseUrl, supabaseAnonKey } = window.PARTY_CONFIG;
    client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

    return client;
  }

  function stageEl() {
    return document.querySelector(".pixel-stage");
  }

  function boardEl() {
    return document.getElementById("stickies-board");
  }

  function setError(message) {
    const el = document.getElementById("sticky-error");
    if (!el) return;

    el.hidden = !message;
    el.textContent = message || "";
  }

  function escapeText(value) {
    const el = document.createElement("div");
    el.textContent = String(value ?? "");
    return el.innerHTML;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pickColor() {
    const index = Math.floor(Math.random() * STICKY_COLORS.length);

    return {
      color: STICKY_COLORS[index],
      colorKey: COLOR_KEYS[index]
    };
  }

  function hashStyle(id, index) {
    const value = String(id || index);
    let hash = 0;

    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }

    return {
      left: 8 + hash % 70,
      top: 8 + ((hash >>> 8) % 42),
      rot: ((hash >>> 16) % 17) - 8,
      color: STICKY_COLORS[hash % STICKY_COLORS.length],
      colorKey: COLOR_KEYS[hash % COLOR_KEYS.length]
    };
  }

  function resolveColor(note, fallback) {
    if (note.color && String(note.color).startsWith("var(")) {
      return note.color;
    }

    if (COLOR_KEYS.includes(note.color_key)) {
      return `var(--${note.color_key})`;
    }

    if (COLOR_KEYS.includes(note.color)) {
      return `var(--${note.color})`;
    }

    return fallback;
  }

  function noteStyle(note, index) {
    const fallback = hashStyle(note.id || index, index);

    return {
      left: clamp(Number(note.x ?? fallback.left), 2, 92),
      top: clamp(Number(note.y ?? fallback.top), 2, 82),
      rot: Number.isFinite(Number(note.rot))
        ? Number(note.rot)
        : fallback.rot,
      color: resolveColor(note, fallback.color),
      colorKey: note.color_key || fallback.colorKey
    };
  }

  /* HEART MOSAIC */

  function buildHeartNotes() {
    const heart = [
      "0110110",
      "1111111",
      "1111111",
      "0111110",
      "0011100",
      "0001000"
    ];

    const notes = [];
    let index = 0;

    heart.forEach((row, r) => {
      [...row].forEach((cell, c) => {
        if (cell !== "1") return;

        notes.push({
          id: `heart-${index}`,
          author: "guest",
          body: "♡",
          x: 30 + c * 5.5,
          y: 5 + r * 5.6,
          rot: ((index % 5) - 2) * 1.2,
          color_key: COLOR_KEYS[index % COLOR_KEYS.length],
          mosaic: true,
          created_at: "2020-01-01T00:00:00.000Z"
        });

        index++;
      });
    });

    return notes;
  }

  function buildAgeNotes(age) {
    const digits = String(age || "").replace(/\D/g, "").slice(0, 3);
    const digitGrids = window.BirthdayDigits?.DIGITS || {};

    if (!digits || ![...digits].every(digit => digitGrids[digit])) {
      return buildHeartNotes();
    }

    const cellW = digits.length >= 3 ? 4.2 : 5.2;
    const cellH = digits.length >= 3 ? 5.2 : 5.8;
    const digitW = 5;
    const gap = 0.85;
    const totalCols = digits.length * digitW + (digits.length - 1) * gap;
    const originX = Math.max(8, 50 - (totalCols * cellW) / 2);

    const notes = [];
    let index = 0;
    let offset = 0;

    [...digits].forEach(digit => {
      digitGrids[digit].forEach((row, r) => {
        [...row].forEach((cell, c) => {
          if (cell !== "1") return;

          notes.push({
            id: `age-${digits}-${index}`,
            author: "guest",
            body: "♡",
            x: originX + (c + offset) * cellW,
            y: 5 + r * cellH,
            rot: ((index % 5) - 2) * 1.2,
            color_key: COLOR_KEYS[index % COLOR_KEYS.length],
            mosaic: true,
            created_at: "2020-01-01T00:00:00.000Z"
          });

          index++;
        });
      });

      offset += digitW + gap;
    });

    return notes;
  }

  function mosaicNotes() {
    const age = window.BIRTHDAY_THEME?.age;

    if (age && window.BirthdayDigits?.isValidAge?.(age)) {
      return buildAgeNotes(age);
    }

    return buildHeartNotes();
  }

  function notesForWall() {
    return mosaicNotes().concat(localNotes);
  }

  function openReadModal(body, color) {
    const modal = document.getElementById("sticky-read-modal");
    const text = document.getElementById("sticky-read-body");
    const card = document.getElementById("sticky-read-card");

    if (text) text.textContent = body || "";
    if (card) card.style.background = color || "var(--sticky-1)";

    if (modal?.showModal) modal.showModal();
    else if (body) window.alert(body);
  }

  /* RENDER NOTES */

  function renderWall() {
    const board = boardEl();
    if (!board) return;

    const keepGhost = ghostEl && board.contains(ghostEl) ? ghostEl : null;

    board.replaceChildren();

    const notes = notesForWall().slice().sort((a, b) => {
      const first = Date.parse(a.created_at || "") || 0;
      const second = Date.parse(b.created_at || "") || 0;
      return first - second;
    });

    notes.forEach((note, index) => {
      const position = noteStyle(note, index);
      const el = document.createElement("button");

      el.type = "button";
      el.className = note.mosaic ? "sticky is-mosaic" : "sticky";
      el.style.left = `${position.left}%`;
      el.style.top = `${position.top}%`;
      el.style.transform = `rotate(${position.rot}deg)`;
      el.style.background = position.color;
      el.style.zIndex = String(note.mosaic ? index + 1 : index + 100);

      el.dataset.body = note.body || "";
      el.dataset.color = position.color;
      el.dataset.colorKey = position.colorKey || "";

      el.setAttribute(
        "aria-label",
        note.mosaic ? "Heart mosaic note" : "Read sticky note"
      );

      const paragraph = document.createElement("p");
      paragraph.textContent = note.body || "";
      el.appendChild(paragraph);

      board.appendChild(el);
    });

    if (keepGhost) board.appendChild(keepGhost);
  }

  function bindNoteClicks() {
    const board = boardEl();
    if (!board || board.dataset.clickBound === "1") return;

    board.dataset.clickBound = "1";

    board.addEventListener("click", event => {
      if (placing) return;

      const sticky = event.target.closest(".sticky");

      if (!sticky || sticky.classList.contains("is-ghost")) return;

      event.preventDefault();
      event.stopPropagation();

      openReadModal(
        sticky.dataset.body || sticky.textContent || "",
        sticky.dataset.color || sticky.style.background
      );
    });
  }

  /* LOAD NOTES */

  async function loadNotes() {
    const sb = getClient();
    const key = roomKey();

    if (!sb || key === null || window.BIRTHDAY_THEME?.preview) {
      usingDemo = true;
      localNotes = [];
      renderWall();
      return;
    }

    usingDemo = false;

    let query = sb
      .from(TABLE)
      .select("id, author, body, x, y, color_key, created_at, room_id")
      .order("created_at", { ascending: true })
      .limit(120);

    query = key === "default"
      ? query.or("room_id.is.null,room_id.eq.default")
      : query.eq("room_id", key);

    let { data, error } = await query;

    if (error && key === "default") {
      const fallback = await sb
        .from(TABLE)
        .select("id, author, body, x, y, color_key, created_at")
        .order("created_at", { ascending: true })
        .limit(120);

      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      console.warn("Could not load sticky notes:", error);
      localNotes = [];
      usingDemo = true;
      renderWall();
      window.PartyUI?.toast("showing wall notes locally");
      return;
    }

    localNotes = data || [];
    renderWall();
  }

  /* VALIDATE NOTES */

  function validate(body) {
    const text = body.trim();
    const profanity = window.PartyProfanity || {};

    if (!text) return "note is required";
    if (text.length > 120) return "note is too long (120 max)";

    if (profanity.looksLikeLinkSpam?.(text)) {
      return "links aren't allowed on the wall";
    }

    if (profanity.hasProfanity?.(text)) {
      return "keep it kind — that language isn't allowed";
    }

    return null;
  }

  /* PLACE NOTES */

  function percentFromEvent(event, stage) {
    const rect = stage.getBoundingClientRect();

    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100 - 3, 2, 92),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100 - 3, 2, 82)
    };
  }

  function moveGhost(x, y) {
    if (!ghostEl) return;

    ghostEl.style.left = `${x}%`;
    ghostEl.style.top = `${y}%`;
  }

  function startPlacing(body) {
    const stage = stageEl();
    const board = boardEl();
    const hint = document.getElementById("wall-place-hint");

    if (!stage || !board) return;

    const picked = pickColor();
    const style = hashStyle(`pending-${Date.now()}`, localNotes.length);

    pendingNote = {
      author: "guest",
      body,
      color: picked.color,
      color_key: picked.colorKey,
      rot: style.rot
    };

    placing = true;
    dragActive = false;

    stage.classList.add("is-placing");
    if (hint) hint.hidden = false;

    ghostEl = document.createElement("div");
    ghostEl.className = "sticky is-ghost";
    ghostEl.style.left = "42%";
    ghostEl.style.top = "28%";
    ghostEl.style.transform = `rotate(${style.rot}deg)`;
    ghostEl.style.background = picked.color;

    const paragraph = document.createElement("p");
    paragraph.textContent = body;
    ghostEl.appendChild(paragraph);

    board.appendChild(ghostEl);

    window.PartyUI?.toast("drag or click to place your note");
  }

  function cancelPlacing() {
    stageEl()?.classList.remove("is-placing");

    const hint = document.getElementById("wall-place-hint");
    if (hint) hint.hidden = true;

    placing = false;
    dragActive = false;
    pendingNote = null;

    ghostEl?.remove();
    ghostEl = null;
  }

  async function commitPlacement(x, y) {
    if (!pendingNote) return;

    const note = pendingNote;
    const key = roomKey();

    const payload = {
      author: note.author,
      body: note.body.trim(),
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      color_key: note.color_key,
      room_id: key === null ? "preview" : key
    };

    cancelPlacing();

    if (usingDemo || !getClient() || key === null ||
        window.BIRTHDAY_THEME?.preview) {
      localNotes.push({
        id: `local-${Date.now()}`,
        ...payload,
        color: note.color,
        created_at: new Date().toISOString()
      });

      renderWall();
      window.PartyUI?.toast("sticky stuck!");
      return;
    }

    const sb = getClient();

    let result = await sb
      .from(TABLE)
      .insert(payload)
      .select("id, author, body, x, y, color_key, created_at")
      .single();

    if (result.error) {
      console.warn("Could not save sticky note:", result.error);
      window.PartyUI?.toast("couldn't save — check database settings");
      return;
    }

    localNotes.push({
      ...result.data,
      color: note.color
    });

    renderWall();
    window.PartyUI?.toast("sticky stuck!");
  }

  function bindPlacement() {
    const stage = stageEl();
    if (!stage || stage.dataset.placeBound === "1") return;

    stage.dataset.placeBound = "1";

    stage.addEventListener("pointerdown", event => {
      if (!placing) return;

      // Don't begin placing a note by pressing an existing sticky.
      if (event.target.closest(".sticky:not(.is-ghost)")) return;

      dragActive = true;

      try {
        stage.setPointerCapture(event.pointerId);
      } catch (_) {}

      if (event.cancelable) event.preventDefault();

      const position = percentFromEvent(event, stage);
      moveGhost(position.x, position.y);
    });

    stage.addEventListener("pointermove", event => {
      if (!placing || !ghostEl || !dragActive) return;

      if (event.cancelable) event.preventDefault();

      const position = percentFromEvent(event, stage);
      moveGhost(position.x, position.y);
    });

    stage.addEventListener("pointerup", event => {
      if (!placing || !dragActive) return;

      dragActive = false;

      const position = percentFromEvent(event, stage);
      commitPlacement(position.x, position.y);
    });

    stage.addEventListener("pointercancel", () => {
      dragActive = false;
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && placing) {
        cancelPlacing();
        window.PartyUI?.toast("placement cancelled");
      }
    });
  }

  /* MODAL */

  function openStickyModal() {
    const modal = document.getElementById("sticky-modal");
    const body = document.getElementById("sticky-body");
    const form = document.getElementById("sticky-form");

    setError("");

    if (placing) cancelPlacing();

    form?.style.removeProperty("--draft-sticky");
    if (body) body.style.background = "";

    if (modal?.showModal) modal.showModal();
    body?.focus();
  }

  /* INITIALIZE */

  function initStickies() {
    const openButton = document.getElementById("open-sticky-form");
    const createOwnButton = document.getElementById("sticky-create-own");
    const modal = document.getElementById("sticky-modal");
    const form = document.getElementById("sticky-form");

    if (initialized) {
      renderWall();
      return;
    }

    initialized = true;

    openButton?.addEventListener("click", openStickyModal);

    createOwnButton?.addEventListener("click", () => {
      const readModal = document.getElementById("sticky-read-modal");
      if (readModal?.open) readModal.close();
      openStickyModal();
    });

    bindPlacement();
    bindNoteClicks();

    form?.addEventListener("submit", event => {
      event.preventDefault();

      const body = document.getElementById("sticky-body")?.value || "";
      const error = validate(body);

      if (error) {
        setError(error);
        return;
      }

      setError("");
      form.reset();
      modal?.close();

      startPlacing(body.trim());
    });

    loadNotes();
  }

  window.PartyStickies = {
    init: initStickies,
    refreshMosaic: renderWall
  };
})();
