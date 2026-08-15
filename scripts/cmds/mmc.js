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

// GitHub token environment variable থেকে নেবে
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// Repository-তে mmc_data.json যে path-এ আছে
const GITHUB_FILE_PATH = "scripts/cmds/mmc_data.json";

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
  "— Vibe on, worries gone. 🎧🪽"
];

/* =========================================================
   DATA LOAD
========================================================= */

function loadData() {

  try {

    if (!fs.existsSync(DATA_FILE)) {

      const initialData = {
        videos: []
      };

      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
          initialData,
          null,
          2
        )
      );

      return [];
    }

    const data = JSON.parse(
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      )
    );

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data.videos)) {
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
      Math.random() *
      CAPTIONS.length
    )
  ];
}

/* =========================================================
   GITHUB COMMIT
========================================================= */

async function commitToGitHub() {

  if (!GITHUB_TOKEN) {

    throw new Error(
      "GitHub token is not configured."
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
      "2022-11-28"
  };

  let sha = null;

  /* -------------------------------------------------------
     Existing file SHA
  ------------------------------------------------------- */

  try {

    const response =
      await axios.get(
        apiURL,
        {
          headers,
          params: {
            ref: GITHUB_BRANCH
          }
        }
      );

    sha =
      response.data.sha;

  } catch (error) {

    if (
      error.response?.status !== 404
    ) {
      throw error;
    }
  }

  /* -------------------------------------------------------
     File content
  ------------------------------------------------------- */

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

  const body = {

    message:
      `mmc: update videos (${VIDEOS.length} total)`,

    content:
      encoded,

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
            30000
        }
      );

    const caption =
      getRandomCaption();

    await message.reply({

      body:
        caption,

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
      3,

    /*
     * সবাই mmc ব্যবহার করতে পারবে।
     * ভিতরের admin check আলাদাভাবে করা হয়েছে।
     */
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
       ADMIN ONLY COMMANDS
    ===================================================== */

    /*
     * mmc info
     *
     * সাধারণ user হলে একদম silent.
     */

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
        `🪽 𝗧𝗼𝘁𝗮𝗹 : ${VIDEOS.length}`;

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
    ===================================================== */

    if (lower === "add") {

      /*
       * শুধু Bot Admin
       */
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
       Example: mmc delete 1
    ===================================================== */

    if (
      lower.startsWith("delete ")
    ) {

      /*
       * শুধু Bot Admin
       */

      if (!admin) {
        return;
      }

      const parts =
        input.split(/\s+/);

      const number =
        parseInt(
          parts[1],
          10
        );

      await react(
        api,
        event.messageID,
        "🎀"
      );

      /*
       * Invalid serial
       */

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

        return message.reply(
          "😩 Invalid video serial!"
        );
      }

      /*
       * Delete selected item
       */

      const deleted =
        VIDEOS.splice(
          number - 1,
          1
        )[0];

      /*
       * Serial automatic shift হবে
       */

      saveData();

      try {

        await commitToGitHub();

      } catch (error) {

        console.error(
          "[MMC] DELETE GITHUB ERROR:",
          error.message
        );

        /*
         * Local deletion already done.
         */

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
       SERIAL VIDEO
       mmc1 / mmc2 / mmc3
       BOT ADMIN ONLY
    ===================================================== */

    if (
      /^mmc\d+$/i.test(input)
    ) {

      /*
       * সাধারণ user হলে absolutely silent
       */

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

        return;
      }

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
       NORMAL MMC
       সবাই ব্যবহার করতে পারবে
    ===================================================== */

    if (
      lower === ""
    ) {

      /*
       * কোনো video নেই
       */

      if (!VIDEOS.length) {

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

      await react(
        api,
        event.messageID,
        success
          ? "🪽"
          : "😩"
      );

      return;
    }

    /*
     * অন্য কোনো input হলে কিছু করবে না।
     */
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
     * Reply করার সময়ও Bot Admin check
     */

    if (!isBotAdmin(event)) {
      return;
    }

    const url =
      event.body?.trim();

    /* =====================================================
       INVALID URL
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

    try {

      /*
       * Add new video
       */

      VIDEOS.push(url);

      /*
       * Local JSON update
       */

      saveData();

      /*
       * GitHub update
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

      /*
       * Local data-তে video থেকে যাবে।
       */

      await react(
        api,
        event.messageID,
        "😩"
      );

      return message.reply(
        "😩 Video add হয়েছে, কিন্তু GitHub update করা যায়নি।"
      );
    }
  }
};
