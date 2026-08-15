const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DATA_FILE = path.join(__dirname, "mmc_data.json");

/* =========================================================
   GITHUB CONFIG
========================================================= */

const GITHUB_USERNAME = "maruf-1718";
const GITHUB_REPO = "Prime";
const GITHUB_BRANCH = "Main";

// এখানে token hard-code না করে environment variable ব্যবহার করো.
// Example:
// GITHUB_TOKEN=github_pat_xxxxxxxxx
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// mmc_data.json যে folder-এ আছে,
// repository-তেও সেই path দিতে হবে।
const GITHUB_FILE_PATH = "scripts/cmds/mmc_data.json";

/* =========================================================
   DEFAULT DATA
========================================================= */

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data.videos)) {
        return data.videos;
      }
    }
  } catch (error) {
    console.error(
      "[MMC] DATA LOAD ERROR:",
      error.message
    );
  }

  return [];
}

let VIDEOS = loadData();

/* =========================================================
   SAVE LOCAL DATA
========================================================= */

function saveLocalData() {
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

async function react(api, messageID, emoji) {
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
   BOT ADMIN
========================================================= */

function isBotAdmin(event) {
  const uid = String(event.senderID);

  const admins =
    global.GoatBot?.config?.adminBot || [];

  return admins
    .map(String)
    .includes(uid);
}

/* =========================================================
   GITHUB COMMIT
========================================================= */

async function commitToGitHub() {

  if (!GITHUB_TOKEN) {
    throw new Error(
      "GitHub token not configured"
    );
  }

  const apiURL =
    `https://api.github.com/repos/` +
    `${GITHUB_USERNAME}/` +
    `${GITHUB_REPO}/contents/` +
    `${GITHUB_FILE_PATH}`;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept:
      "application/vnd.github+json",
    "X-GitHub-Api-Version":
      "2022-11-28"
  };

  /*
   * GitHub-এ existing file আছে কিনা
   */
  let sha = null;

  try {

    const existing =
      await axios.get(
        apiURL,
        {
          headers,
          params: {
            ref: GITHUB_BRANCH
          }
        }
      );

    sha = existing.data.sha;

  } catch (error) {

    /*
     * 404 হলে file নতুন,
     * তাই SHA লাগবে না।
     */
    if (
      error.response?.status !== 404
    ) {
      throw error;
    }
  }

  const content =
    JSON.stringify(
      {
        videos: VIDEOS
      },
      null,
      2
    );

  const encodedContent =
    Buffer.from(
      content,
      "utf8"
    ).toString("base64");

  const body = {
    message:
      `mmc: add video (${VIDEOS.length} total)`,
    content:
      encodedContent,
    branch:
      GITHUB_BRANCH
  };

  if (sha) {
    body.sha = sha;
  }

  await axios.put(
    apiURL,
    body,
    {
      headers
    }
  );
}

/* =========================================================
   GET VIDEO
========================================================= */

function getRandomVideo() {

  if (!VIDEOS.length) {
    return null;
  }

  const index =
    Math.floor(
      Math.random() *
      VIDEOS.length
    );

  return VIDEOS[index];
}

/* =========================================================
   SEND VIDEO
========================================================= */

async function sendVideo(
  message,
  url
) {

  try {

    await message.reply({
      attachment:
        await axios.get(
          url,
          {
            responseType:
              "stream",
            timeout:
              30000
          }
        ).then(
          res => res.data
        )
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
   MODULE
========================================================= */

module.exports = {

  config: {

    name: "mmc",

    aliases: [],

    version: "1.0.0",

    author: "Mohammad Maruf",

    countDown: 3,

    role: 0,

    shortDescription: {
      en: "Random video system"
    },

    longDescription: {
      en:
        "Send random or serial-wise videos."
    },

    category: "media",

    guide: {
      en:
        "{pn}\n" +
        "{pn}1\n" +
        "{pn}2\n" +
        "{pn}info\n" +
        "{pn}add"
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

    /* =====================================================
       NO VIDEO
    ===================================================== */

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

    /* =====================================================
       INFO
    ===================================================== */

    if (
      input.toLowerCase() ===
      "info"
    ) {

      await react(
        api,
        event.messageID,
        "🎀"
      );

      let text =
        "╭━━━〔 🎬 𝗠𝗠𝗖 𝗜𝗡𝗙𝗢 〕━━━╮\n" +
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
        "╰━━━━━━━━━━━━━━━━━━╯\n" +
        `🪽 𝗧𝗼𝘁𝗮𝗹 𝗩𝗶𝗱𝗲𝗼 : ${VIDEOS.length}`;

      await react(
        api,
        event.messageID,
        "🪽"
      );

      return message.reply(text);
    }

    /* =====================================================
       ADD
    ===================================================== */

    if (
      input.toLowerCase() ===
      "add"
    ) {

      if (!isBotAdmin(event)) {
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
          "┃ এখন Catbox/video link পাঠাও।\n" +
          "┃\n" +
          "┃ Example:\n" +
          "┃ https://files.catbox.moe/example.mp4\n" +
          "╰━━━━━━━━━━━━━━━━━━╯"
        );

      if (!info) return;

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
       SERIAL VIDEO
       mmc1 / mmc2 / mmc3
    ===================================================== */

    if (
      /^mmc\d+$/i.test(input)
    ) {

      const number =
        parseInt(
          input
            .replace(
              /^mmc/i,
              ""
            ),
          10
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
          `😩 MMC ${number} পাওয়া যায়নি!\n\n` +
          `📦 মোট ভিডিও : ${VIDEOS.length}`
        );
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

      return;
    }

    /* =====================================================
       RANDOM VIDEO
    ===================================================== */

    if (
      input === "" ||
      input.toLowerCase() ===
      "random"
    ) {

      await react(
        api,
        event.messageID,
        "🎀"
      );

      const video =
        getRandomVideo();

      if (!video) {

        await react(
          api,
          event.messageID,
          "😩"
        );

        return;
      }

      const success =
        await sendVideo(
          message,
          video
        );

      await react(
        api,
        event.messageID,
        success
          ? "🪽"
          : "😩"
      );

      return;
    }
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

    if (!Reply) return;

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

    /* =====================================================
       ADMIN CHECK
    ===================================================== */

    if (!isBotAdmin(event)) {
      return;
    }

    const url =
      event.body?.trim();

    /* =====================================================
       URL CHECK
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

    /* =====================================================
       ADD VIDEO
    ===================================================== */

    await react(
      api,
      event.messageID,
      "🎀"
    );

    try {

      /*
       * Duplicate check
       */
      if (
        VIDEOS.includes(url)
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

      VIDEOS.push(url);

      /*
       * Local save
       */
      saveLocalData();

      /*
       * GitHub commit
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
        `┃ 🔢 Serial : ${serial}\n` +
        `┃ 📦 Total : ${VIDEOS.length}\n` +
        "┃ ☁️ GitHub : Committed\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
      );

    } catch (error) {

      console.error(
        "[MMC] ADD/GITHUB ERROR:",
        error.message
      );

      /*
       * Local data already saved,
       * তাই GitHub fail হলেও video হারাবে না।
       */

      await react(
        api,
        event.messageID,
        "😩"
      );

      return message.reply(
        "😩 Video add হয়েছে, কিন্তু GitHub-এ commit করা যায়নি।"
      );
    }
  }
};
