/*
=========================================================
OUR LITTLE WORLD ♡
File: js/theme.js

This file stores the birthday room's personalized details.

You can customize:
- Birthday person's name
- Birthday age
- Room title
- Pet type
- Balloon messages
- Theme colors

Other JavaScript files can access this information.
=========================================================
*/


/* DEFAULT BIRTHDAY THEME */

const DEFAULT_THEME = {
  roomId: null,

  name: "Alex",
  age: 18,

  title: "Happy Birthday Alex",

  pet: "cat",

  colors: {
    background: "#0B0B0B",
    secondaryBackground: "#151515",
    primaryRed: "#B11226",
    brightRed: "#E63946",
    darkCrimson: "#6D071A",
    text: "#F5F5F5",
    mutedText: "#AAAAAA"
  },

  balloonMessages: [
    "Thank you for being part of my world ♡",
    "You are loved more than you know.",
    "Make a wish ✨",
    "Happy Birthday!",
    "You make life a little more magical.",
    "Here's to more beautiful memories together ♡"
  ],

  petMessages: [
    "meow ♡",
    "I'm happy you're here!",
    "Let's make a wish!",
    "You are doing amazing.",
    "Sending you tiny hugs!"
  ]
};


/* READ INFORMATION FROM THE URL */

function getThemeParameter(key) {
  const parameters = new URLSearchParams(window.location.search);

  return (parameters.get(key) || "").trim();
}


/* CHECK WHETHER A VALUE IS A VALID AGE */

function getValidAge(value, fallback) {
  if (!/^\d{1,3}$/.test(value)) {
    return fallback;
  }

  const age = Number(value);

  if (age < 1 || age > 120) {
    return fallback;
  }

  return age;
}


/* CLEAN PERSONALIZED TEXT */

function cleanThemeText(value, fallback, maxLength = 80) {
  if (!value) {
    return fallback;
  }

  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength) || fallback;
}


/* CREATE THE PERSONALIZED THEME */

function createBirthdayTheme() {
  // Start with a copy of the default theme.
  const theme = {
    ...DEFAULT_THEME,

    colors: {
      ...DEFAULT_THEME.colors
    },

    balloonMessages: [
      ...DEFAULT_THEME.balloonMessages
    ],

    petMessages: [
      ...DEFAULT_THEME.petMessages
    ]
  };

  // Read custom details from the URL.
  const roomId = getThemeParameter("id");
  const name = getThemeParameter("name");
  const age = getThemeParameter("age");
  const title = getThemeParameter("title");
  const pet = getThemeParameter("pet");

  // Apply the room ID if one was supplied.
  if (/^[a-zA-Z0-9_-]{1,80}$/.test(roomId)) {
    theme.roomId = roomId;
  }

  // Use the visitor-provided name.
  theme.name = cleanThemeText(
    name,
    DEFAULT_THEME.name,
    40
  );

  // Use the provided age only if it is valid.
  theme.age = getValidAge(
    age,
    DEFAULT_THEME.age
  );

  // Use a custom title when supplied.
  theme.title = cleanThemeText(
    title,
    `Happy Birthday ${theme.name}`,
    80
  );

  // Allow cat or dog mode.
  if (pet === "cat" || pet === "dog") {
    theme.pet = pet;
  }

  return theme;
}


/* STORE THE ACTIVE THEME */

const birthdayTheme = createBirthdayTheme();


/* APPLY THE THEME TO THE WEBSITE */

function applyThemeSettings(theme) {
  if (!theme) {
    return;
  }

  // Update the browser tab title.
  document.title = `${theme.title} ♡ | OUR LITTLE WORLD`;

  // Apply the personalized room title.
  const roomTitle = document.getElementById("room-title");

  if (roomTitle) {
    roomTitle.textContent = theme.title;
  }

  // Display a birthday greeting.
  const roomGreeting = document.getElementById("room-greeting");

  if (roomGreeting) {
    roomGreeting.textContent =
      `Happy Birthday, ${theme.name}! ` +
      `Your little world is made just for you. ♡`;
  }

  // Set the room's CSS colors.
  const root = document.documentElement;

  root.style.setProperty(
    "--bg-main",
    theme.colors.background
  );

  root.style.setProperty(
    "--bg-secondary",
    theme.colors.secondaryBackground
  );

  root.style.setProperty(
    "--red-primary",
    theme.colors.primaryRed
  );

  root.style.setProperty(
    "--red-bright",
    theme.colors.brightRed
  );

  root.style.setProperty(
    "--red-dark",
    theme.colors.darkCrimson
  );

  root.style.setProperty(
    "--text-main",
    theme.colors.text
  );

  root.style.setProperty(
    "--text-muted",
    theme.colors.mutedText
  );

  // Make the selected pet type available to the pet module.
  document.documentElement.dataset.pet = theme.pet;
}


/* HELPER: GET A RANDOM BALLOON MESSAGE */

function getRandomBalloonMessage() {
  const messages = birthdayTheme.balloonMessages;

  const randomIndex = Math.floor(
    Math.random() * messages.length
  );

  return messages[randomIndex];
}


/* HELPER: GET A RANDOM PET MESSAGE */

function getRandomPetMessage() {
  const messages = birthdayTheme.petMessages;

  const randomIndex = Math.floor(
    Math.random() * messages.length
  );

  return messages[randomIndex];
}


/* PUBLIC THEME API */

window.LittleWorldTheme = {
  getTheme: function () {
    // Return the active theme for other modules.
    return birthdayTheme;
  },

  getRandomBalloonMessage: getRandomBalloonMessage,

  getRandomPetMessage: getRandomPetMessage,

  applyThemeSettings: applyThemeSettings
};


/* APPLY THE THEME WHEN THE HTML IS READY */

applyThemeSettings(birthdayTheme);
