const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DATA_FILE = path.join(__dirname, "mmc_data.json");

/* =========================================================
   GITHUB CONFIG
========================================================= */

const GITHUB_USERNAME = "maruf-1718";
const GITHUB_REPO = "Prime";
const GITHUB_BRANCH = "main";
const GITHUB_FILE_PATH = "scripts/cmds/mmc_data.json";

const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN || "";

/* =========================================================
   CAPTIONS
========================================================= */

const CAPTIONS = [
  "— কিছু মুহূর্ত শুধু অনুভব করার জন্যই আসে। 🪽✨",
  "— গানটা চলুক, আর মুহূর্তগুলো কথা বলুক। 🎧🖤",
  "— কিছু vibe কথায় প্রকাশ করা যায় না। 🌙✨",
  "— শুনতে থাকো, হয়তো গল্পটা তোমারই। 🪽🎶",
  "— এই মুহূর্তটা একটু নিজের মতো করে রাখো। 🤍",
  "— শব্দ কম, অনুভূতি বেশি। 🖤🎧",
  "— কিছু গান হৃদয়ের খুব কাছে থেকে যায়। 🌸🎶",
  "— Mood ভালো করার জন্য একটা সুন্দর মুহূর্ত। ✨🦋",
  "— Just feel the vibe. 🎧🪽",
  "— কখনো কখনো একটা গানই যথেষ্ট। 🌙🎶",
  "— হারিয়ে যাও নিজের পছন্দের সুরের মাঝে। 🖤✨",
  "— এই vibe-এর কোনো explanation নেই। 😌🪽",
  "— Play চাপো, বাকিটা অনুভূতির উপর ছেড়ে দাও। 🎶✨",
  "— রাত যত গভীর, কিছু গান তত সুন্দর। 🌙🖤",
  "— মন ভালো করার ছোট্ট একটা কারণ। 🦋🤍",
  "— Some moments deserve a replay. 🎧✨",
  "— Feel it, don't explain it. 🪽🖤",
  "— সুরের মাঝে কিছু গল্প লুকিয়ে থাকে। 🎶🌸",
  "— আজকের মুহূর্তটা একটু সুন্দর হোক। ✨🤍",
  "— Vibe on, worries gone. 🎧🪽",
  "— কিছু সুর মনকে অদ্ভুতভাবে শান্ত করে। 🌙🤍",
  "— এই গানটার vibe-টা একটু আলাদা। 🎶🖤",
  "— শুনো, অনুভব করো, তারপর আবার replay দাও। 🪽🎧",
  "— Music speaks where words fail. 🎶✨"
];

/* =========================================================
   LOAD DATA
========================================================= */

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          { videos: [] },
          null,
          2
        )
      );

      return [];
    }

    const raw = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    if (!raw.trim()) {
      return [];
    }

    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      return data;
    }

    if (
      data &&
      Array.isArray(data.videos)
    ) {
      return data.videos;
    }

    return [];

  } catch (error) {
    console.error(
      "[MMC] DATA LOAD ERROR:",
      error.message
    );

    return [];
  }
}

let VIDEOS = loadData();

/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        videos: VIDEOS
      },
      null,
      2
    )
  );
}

/* =========================================================
   REACTION
========================================================= */

async function react(
  api,
  messageID,
  emoji
) {
  try {
    await api.setMessageReaction(
      emoji,
      messageID,
      () => {},
      true
    );
  } catch {}
}

/* =========================================================
   BOT ADMIN CHECK
========================================================= */

function isBotAdmin(event) {
  const userID =
    String(event.senderID);

  const adminList =
    global.GoatBot?.config?.adminBot || [];

  return adminList
    .map(String)
    .includes(userID);
}

/* =========================================================
   RANDOM CAPTION
========================================================= */

function getRandomCaption() {
  return CAPTIONS[
    Math.floor(
      Math.random() * CAPTIONS.length
    )
  ];
}

/* =========================================================
   NORMALIZE URL
========================================================= */

function normalizeUrl(url) {
  return String(url)
    .trim()
    .replace(/\s+/g, "");
}

/* =========================================================
   DUPLICATE CHECK
========================================================= */

function isDuplicateVideo(url) {
  const normalized =
    normalizeUrl(url);

  return VIDEOS.some(
    existing =>
      normalizeUrl(existing) ===
      normalized
  );
}

/* =========================================================
   GITHUB UPDATE
========================================================= */

async function commitToGitHub() {

  if (!GITHUB_TOKEN) {
    throw new Error(
      "GITHUB_TOKEN is missing."
    );
  }

  const apiURL =
    `https://api.github.com/repos/` +
    `${GITHUB_USERNAME}/` +
    `${GITHUB_REPO}/contents/` +
    `${GITHUB_FILE_PATH}`;

  const headers = {
    Authorization:
      `Bearer ${GITHUB_TOKEN}`,

    Accept:
      "application/vnd.github+json",

    "X-GitHub-Api-Version":
      "2022-11-28",

    "User-Agent":
      "MMC-Bot"
  };

  let sha = null;

  /* =======================================================
     GET EXISTING FILE
  ======================================================= */

  try {

    const response =
      await axios.get(
        apiURL,
        {
          headers,
          params: {
            ref: GITHUB_BRANCH
          },
          timeout: 10000
        }
      );

    sha =
      response.data?.sha || null;

  } catch (error) {

    const status =
      error.response?.status;

    if (status !== 404) {

      const detail =
        error.response?.data?.message ||
        error.message;

      throw new Error(
        `GitHub GET ${status || ""}: ${detail}`
      );
    }
  }

  /* =======================================================
     FILE CONTENT
  ======================================================= */

  const content =
    JSON.stringify(
      {
        videos: VIDEOS
      },
      null,
      2
    );

  const encoded =
    Buffer.from(
      content,
      "utf8"
    ).toString("base64");

  /* =======================================================
     UPDATE
  ======================================================= */

  const body = {
    message:
      `mmc: update videos (${VIDEOS.length})`,

    content:
      encoded,

    branch:
      GITHUB_BRANCH
  };

  if (sha) {
    body.sha = sha;
  }

  try {

    await axios.put(
      apiURL,
      body,
      {
        headers,
        timeout: 15000
      }
    );

  } catch (error) {

    const status =
      error.response?.status;

    const detail =
      error.response?.data?.message ||
      error.message;

    throw new Error(
      `GitHub PUT ${status || ""}: ${detail}`
    );
  }
}

/* =========================================================
   SEND VIDEO
========================================================= */

async function sendVideo(
  message,
  url
) {

  try {

    const response =
      await axios.get(
        url,
        {
          responseType:
            "stream",

          timeout:
            10000,

          maxRedirects:
            3,

          headers: {
            "User-Agent":
              "Mozilla/5.0"
          }
        }
      );

    await message.reply({
      body:
        getRandomCaption(),

      attachment:
        response.data
    });

    return true;

  } catch (error) {

    console.error(
      "[MMC] VIDEO ERROR:",
      error.message
    );

    return false;
  }
}

/* =========================================================
   RANDOM VIDEO
========================================================= */

async function sendRandomVideo(
  api,
  event,
  message
) {

  if (!VIDEOS.length) {

    await react(
      api,
      event.messageID,
      "😩"
    );

    return;
  }

  /*
   * Loading reaction
   */
  await react(
    api,
    event.messageID,
    "🎀"
  );

  const randomIndex =
    Math.floor(
      Math.random() *
      VIDEOS.length
    );

  const success =
    await sendVideo(
      message,
      VIDEOS[randomIndex]
    );

  /*
   * Success / Error
   */
  await react(
    api,
    event.messageID,
    success
      ? "🪽"
      : "😩"
  );
}

/* =========================================================
   SERIAL VIDEO
========================================================= */

async function sendSerialVideo(
  api,
  event,
  message,
  number
) {

  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > VIDEOS.length
  ) {

    await react(
      api,
      event.messageID,
      "😩"
    );

    return;
  }

  await react(
    api,
    event.messageID,
    "🎀"
  );

  const success =
    await sendVideo(
      message,
      VIDEOS[number - 1]
    );

  await react(
    api,
    event.messageID,
    success
      ? "🪽"
      : "😩"
  );
}

/* =========================================================
   MODULE
========================================================= */

module.exports = {

  config: {

    name:
      "mmc",

    aliases: [],

    version:
      "1.0.0",

    author:
      "Mohammad Maruf",

    countDown:
      1,

    role:
      0,

    shortDescription: {
      en:
        "Random video system"
    },

    longDescription: {
      en:
        "Random and serial video system"
    },

    category:
      "media",

    guide: {
      en:
        "{pn}\n" +
        "{pn} info\n" +
        "{pn} add\n" +
        "{pn} delete <number>\n" +
        "{pn}1"
    }
  },

  /* =======================================================
     ON START
  ======================================================= */

  onStart: async function ({
    api,
    event,
    args,
    message
  }) {

    const input =
      args.join(" ").trim();

    const lower =
      input.toLowerCase();

    const admin =
      isBotAdmin(event);

    /* =====================================================
       NORMAL MMC

       /mmc
       সবাই ব্যবহার করতে পারবে
    ===================================================== */

    if (lower === "") {

      return sendRandomVideo(
        api,
        event,
        message
      );
    }

    /* =====================================================
       MMC INFO
       ADMIN ONLY
    ===================================================== */

    if (lower === "info") {

      if (!admin) {
        return;
      }

      await react(
        api,
        event.messageID,
        "🎀"
      );

      if (!VIDEOS.length) {

        await react(
          api,
          event.messageID,
          "😩"
        );

        return message.reply(
          "😩 কোনো ভিডিও এখনো add করা হয়নি!"
        );
      }

      let text =
        "╭━━━━〔 🎬 𝗠𝗠𝗖 𝗜𝗡𝗙𝗢 〕━━━━╮\n" +
        "┃\n";

      VIDEOS.forEach(
        (url, index) => {

          text +=
            `┃ ${String(
              index + 1
            ).padStart(2, "0")} ┃ ${url}\n`;
        }
      );

      text +=
        "┃\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯\n" +
        `🪽 Total Video : ${VIDEOS.length}`;

      await react(
        api,
        event.messageID,
        "🪽"
      );

      return message.reply(
        text
      );
    }

    /* =====================================================
       MMC ADD
       ADMIN ONLY
    ===================================================== */

    if (lower === "add") {

      if (!admin) {
        return;
      }

      await react(
        api,
        event.messageID,
        "🎀"
      );

      const info =
        await message.reply(
          "╭━━━━━━━━━━━━━━━━━━╮\n" +
          "┃ 🎬 𝗔𝗗𝗗 𝗠𝗠𝗖 𝗩𝗜𝗗𝗘𝗢\n" +
          "┃\n" +
          "┃ এখন video / Catbox link পাঠাও।\n" +
          "┃\n" +
          "┃ Example:\n" +
          "┃ https://files.catbox.moe/example.mp4\n" +
          "╰━━━━━━━━━━━━━━━━━━╯"
        );

      if (!info) {
        return;
      }

      global.GoatBot.onReply.set(
        info.messageID,
        {
          commandName:
            "mmc",

          type:
            "addVideo"
        }
      );

      return;
    }

    /* =====================================================
       MMC DELETE
       ADMIN ONLY
    ===================================================== */

    if (
      /^delete\s+\d+$/i.test(input)
    ) {

      if (!admin) {
        return;
      }

      const number =
        parseInt(
          input.split(/\s+/)[1],
          10
        );

      await react(
        api,
        event.messageID,
        "🎀"
      );

      if (
        number < 1 ||
        number > VIDEOS.length
      ) {

        await react(
          api,
          event.messageID,
          "😩"
        );

        return message.reply(
          "😩 Invalid video serial!"
        );
      }

      /*
       * Delete
       */
      VIDEOS.splice(
        number - 1,
        1
      );

      /*
       * Local save
       */
      saveData();

      /*
       * GitHub
       */
      try {

        await commitToGitHub();

      } catch (error) {

        console.error(
          "[MMC] DELETE GITHUB ERROR:",
          error.message
        );

        await react(
          api,
          event.messageID,
          "😩"
        );

        return message.reply(
          "😩 Video delete হয়েছে, কিন্তু GitHub update হয়নি।"
        );
      }

      await react(
        api,
        event.messageID,
        "🪽"
      );

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🪽 𝗠𝗠𝗖 𝗗𝗘𝗟𝗘𝗧𝗘𝗗\n" +
        "┃\n" +
        `┃ 🗑️ Deleted : #${number}\n` +
        `┃ 📦 Remaining : ${VIDEOS.length}\n` +
        "┃ ☁️ GitHub : Updated\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
      );
    }

    /* =====================================================
       MMC1 / MMC2 / MMC3...
       ADMIN ONLY
    ===================================================== */

    if (
      /^mmc\d+$/i.test(input)
    ) {

      if (!admin) {
        return;
      }

      const number =
        parseInt(
          input.replace(
            /^mmc/i,
            ""
          ),
          10
        );

      return sendSerialVideo(
        api,
        event,
        message,
        number
      );
    }

    /*
     * Unknown command = silent
     */
    return;
  },

  /* =======================================================
     ON REPLY
======================================================= */

  onReply: async function ({
    api,
    event,
    message,
    Reply
  }) {

    if (!Reply) {
      return;
    }

    if (
      Reply.commandName !==
      "mmc"
    ) {
      return;
    }

    if (
      Reply.type !==
      "addVideo"
    ) {
      return;
    }

    /*
     * শুধু Bot Admin
     */
    if (!isBotAdmin(event)) {
      return;
    }

    const url =
      normalizeUrl(
        event.body || ""
      );

    /* =====================================================
       INVALID LINK
    ===================================================== */

    if (
      !url ||
      !/^https?:\/\/.+/i.test(url)
    ) {

      await react(
        api,
        event.messageID,
        "😩"
      );

      return message.reply(
        "😩 Invalid video link!"
      );
    }

    await react(
      api,
      event.messageID,
      "🎀"
    );

    /* =====================================================
       DUPLICATE
    ===================================================== */

    if (
      isDuplicateVideo(url)
    ) {

      await react(
        api,
        event.messageID,
        "😩"
      );

      return message.reply(
        "😩 এই video link আগেই add করা আছে!"
      );
    }

    /* =====================================================
       ADD
    ===================================================== */

    try {

      VIDEOS.push(url);

      /*
       * Local
       */
      saveData();

      /*
       * GitHub
       */
      await commitToGitHub();

      const serial =
        VIDEOS.length;

      await react(
        api,
        event.messageID,
        "🪽"
      );

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🪽 𝗠𝗠𝗖 𝗔𝗗𝗗𝗘𝗗\n" +
        "┃\n" +
        `┃ 🔢 Serial : #${serial}\n` +
        `┃ 📦 Total : ${VIDEOS.length}\n` +
        "┃ ☁️ GitHub : Updated\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
      );

    } catch (error) {

      console.error(
        "[MMC] ADD ERROR:",
        error.message
      );

      await react(
        api,
        event.messageID,
        "😩"
      );

      return message.reply(
        "😩 Video add হয়েছে, কিন্তু GitHub update করা যায়নি।"
      );
    }
  },

  /* =======================================================
     ON CHAT

     IMPORTANT:
     এখানে MMC HANDLE করা হচ্ছে না।

     কারণ onStart-এ MMC already handle হচ্ছে।
     এখানে আবার handle করলে duplicate video আসবে।
======================================================= */

  onChat: async function () {
    return;
  }
};