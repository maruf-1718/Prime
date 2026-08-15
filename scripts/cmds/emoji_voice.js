const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DATA_FILE = path.join(__dirname, "emoji_voice_data.json");

/* =========================================================
   DEFAULT EMOJI VOICES
========================================================= */

const DEFAULT_EMOJIS = {
  "🥱": [
    "https://files.catbox.moe/9pou40.mp3",
    "https://files.catbox.moe/60cwcg.mp3"
  ],
  "😁": [
    "https://files.catbox.moe/60cwcg.mp3"
  ],
  "😌": [
    "https://files.catbox.moe/epqwbx.mp3"
  ],
  "🥺": [
    "https://files.catbox.moe/wc17iq.mp3",
    "https://files.catbox.moe/dv9why.mp3"
  ],
  "🤭": [
    "https://files.catbox.moe/cu0mpy.mp3"
  ],
  "😅": [
    "https://files.catbox.moe/jl3pzb.mp3"
  ],
  "😏": [
    "https://files.catbox.moe/z9e52r.mp3"
  ],
  "😞": [
    "https://files.catbox.moe/tdimtx.mp3"
  ],
  "🤫": [
    "https://files.catbox.moe/0uii99.mp3"
  ],
  "🍼": [
    "https://files.catbox.moe/p6ht91.mp3"
  ],
  "🤔": [
    "https://files.catbox.moe/hy6m6w.mp3"
  ],
  "🥰": [
    "https://files.catbox.moe/dv9why.mp3"
  ],
  "🤦": [
    "https://files.catbox.moe/ivlvoq.mp3"
  ],
  "😘": [
    "https://files.catbox.moe/sbws0w.mp3",
    "https://files.catbox.moe/37dqpx.mp3"
  ],
  "😑": [
    "https://files.catbox.moe/p78xfw.mp3"
  ],
  "😢": [
    "https://files.catbox.moe/shxwj1.mp3"
  ],
  "🙊": [
    "https://files.catbox.moe/3bejxv.mp3"
  ],
  "🤨": [
    "https://files.catbox.moe/4aci0r.mp3"
  ],
  "😡": [
    "https://files.catbox.moe/shxwj1.mp3",
    "https://files.catbox.moe/h9ekli.mp3"
  ],
  "🤬": [
    "https://files.catbox.moe/shxwj1.mp3",
    "https://files.catbox.moe/h9ekli.mp3"
  ],
  "🙈": [
    "https://files.catbox.moe/3qc90y.mp3"
  ],
  "😍": [
    "https://files.catbox.moe/qjfk1b.mp3"
  ],
  "😭": [
    "https://files.catbox.moe/itm4g0.mp3"
  ],
  "😱": [
    "https://files.catbox.moe/mu0kka.mp3"
  ],
  "😻": [
    "https://files.catbox.moe/y8ul2j.mp3"
  ],
  "😿": [
    "https://files.catbox.moe/tqxemm.mp3"
  ],
  "💔": [
    "https://files.catbox.moe/6yanv3.mp3"
  ],
  "🤣": [
    "https://files.catbox.moe/2sweut.mp3",
    "https://files.catbox.moe/jl3pzb.mp3"
  ],
  "🥹": [
    "https://files.catbox.moe/jf85xe.mp3"
  ],
  "😩": [
    "https://files.catbox.moe/b4m5aj.mp3"
  ],
  "🫣": [
    "https://files.catbox.moe/ttb6hi.mp3"
  ],
  "🐸": [
    "https://files.catbox.moe/utl83s.mp3",
    "https://files.catbox.moe/sg6ugl.mp3"
  ],
  "💋": [
    "https://files.catbox.moe/37dqpx.mp3"
  ],
  "🫦": [
    "https://files.catbox.moe/61w3i0.mp3"
  ],
  "😴": [
    "https://files.catbox.moe/rm5ozj.mp3"
  ],
  "🙏": [
    "https://files.catbox.moe/7avi7u.mp3"
  ],
  "😼": [
    "https://files.catbox.moe/4oz916.mp3"
  ],
  "🖕": [
    "https://files.catbox.moe/593u3j.mp3",
    "https://files.catbox.moe/dtua60.mp3"
  ],
  "🥵": [
    "https://files.catbox.moe/l90704.mp3"
  ],
  "🙂": [
    "https://files.catbox.moe/4oks08.mp3"
  ],
  "😒": [
    "https://files.catbox.moe/mt5il0.mp3"
  ],
  "😓": [
    "https://files.catbox.moe/zh3mdg.mp3"
  ],
  "🤧": [
    "https://files.catbox.moe/zh3mdg.mp3"
  ],
  "🙄": [
    "https://files.catbox.moe/vgzkeu.mp3"
  ],
  "🤪": [
    "https://files.catbox.moe/ihmbr7.mp3"
  ],
  "👍": [
    "https://files.catbox.moe/74bho5.mp3"
  ],
  "☠️": [
    "https://files.catbox.moe/wv0rwc.mp3"
  ]
};

/* =========================================================
   DATA LOAD / SAVE
========================================================= */

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(
        fs.readFileSync(DATA_FILE, "utf8")
      );

      return {
        emojis: {
          ...DEFAULT_EMOJIS,
          ...(data.emojis || {})
        },

        groups: data.groups || {}
      };
    }
  } catch (err) {
    console.error(
      "[EMOJI_VOICE] DATA LOAD ERROR:",
      err?.message || err
    );
  }

  return {
    emojis: {
      ...DEFAULT_EMOJIS
    },

    groups: {}
  };
}

let DATA = loadData();

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(DATA, null, 2)
    );
  } catch (err) {
    console.error(
      "[EMOJI_VOICE] DATA SAVE ERROR:",
      err?.message || err
    );
  }
}

/* =========================================================
   BOT ADMIN CHECK
========================================================= */

function isBotAdmin(event) {
  const senderID = String(
    event?.senderID || ""
  );

  const adminList =
    global.GoatBot?.config?.adminBot || [];

  return adminList
    .map(String)
    .includes(senderID);
}

/* =========================================================
   GROUP STATUS
========================================================= */

function isGroupEnabled(threadID) {
  threadID = String(threadID);

  /*
   * Default = ON
   */
  if (
    DATA.groups[threadID] === undefined
  ) {
    return true;
  }

  return DATA.groups[threadID] === true;
}

function setGroupStatus(
  threadID,
  status
) {
  DATA.groups[String(threadID)] = status;
  saveData();
}

/* =========================================================
   GET CURRENT BOT GROUPS
========================================================= */

async function getCurrentBotGroups(api) {
  const result = [];

  try {
    const botID = String(
      api.getCurrentUserID()
    );

    /*
     * Bot-এর বর্তমান thread list
     */
    const threads =
      await api.getThreadList(
        1000,
        null,
        ["INBOX"]
      );

    if (!Array.isArray(threads)) {
      return result;
    }

    for (const thread of threads) {

      if (!thread) continue;

      const threadID = String(
        thread.threadID || ""
      );

      if (!threadID) continue;

      const participantIDs =
        Array.isArray(
          thread.participantIDs
        )
          ? thread.participantIDs.map(String)
          : [];

      /*
       * Group check
       */
      const isGroup =
        thread.isGroup === true ||
        participantIDs.length > 2;

      if (!isGroup) continue;

      /*
       * Bot এই group-এ আছে কিনা
       */
      if (
        participantIDs.length &&
        !participantIDs.includes(botID)
      ) {
        continue;
      }

      const name =
        thread.name ||
        thread.threadName ||
        "Unnamed Group";

      result.push({
        threadID,
        name
      });
    }

  } catch (err) {

    console.error(
      "[EMOJI_VOICE] GROUP LIST ERROR:",
      err?.message || err
    );
  }

  /*
   * Duplicate remove
   */
  const unique = [];
  const seen = new Set();

  for (const group of result) {

    if (
      seen.has(group.threadID)
    ) {
      continue;
    }

    seen.add(group.threadID);
    unique.push(group);
  }

  return unique;
}

/* =========================================================
   SEND VOICE
========================================================= */

async function sendVoice(
  message,
  audioUrl
) {

  const cacheDir =
    path.join(
      __dirname,
      "cache"
    );

  const filePath =
    path.join(
      cacheDir,
      `ev_${Date.now()}_${Math.floor(
        Math.random() * 999999
      )}.mp3`
    );

  try {

    await fs.ensureDir(
      cacheDir
    );

    const response =
      await axios.get(
        audioUrl,
        {
          responseType:
            "arraybuffer",

          timeout: 15000
        }
      );

    await fs.writeFile(
      filePath,
      Buffer.from(
        response.data
      )
    );

    await message.reply({
      attachment:
        fs.createReadStream(
          filePath
        )
    });

  } catch (error) {

    console.error(
      "[EMOJI_VOICE] VOICE ERROR:",
      error?.message || error
    );

    /*
     * আগের funny error message
     */
    try {

      await message.reply(
        "ইমোজি দিয়ে লাভ নাই 🤣\n" +
        "যাও ভালো মুন্সী দেখো গা জান 💋"
      );

    } catch (_) {}

  } finally {

    /*
     * Temporary file delete
     */
    setTimeout(() => {

      try {

        if (
          fs.existsSync(
            filePath
          )
        ) {
          fs.unlinkSync(
            filePath
          );
        }

      } catch (_) {}

    }, 10000);
  }
}

/* =========================================================
   MODULE
========================================================= */

module.exports = {

  config: {

    name: "emoji_voice",

    aliases: [
      "ev"
    ],

    /*
     * তোমার requirement অনুযায়ী
     */
    version: "1.0.0",

    author: "Mohammad Maruf",

    countDown: 3,

    /*
     * IMPORTANT:
     *
     * role 0 রাখতে হবে।
     *
     * কারণ onChat সাধারণ member-এর
     * emoji message-এর জন্যও কাজ করতে হবে।
     *
     * Admin-only protection নিচে
     * isBotAdmin() দিয়ে করা হয়েছে।
     */
    role: 0,

    shortDescription:
      "Emoji Voice System",

    longDescription:
      "Emoji voice with Bot Admin group management.",

    category: "system",

    guide: {
      en:
        "ev\n" +
        "ev setting\n" +
        "ev list\n" +
        "ev manage\n" +
        "ev on\n" +
        "ev off\n" +
        "ev add"
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

    /*
     * IMPORTANT:
     *
     * ev-এর সব command শুধু Bot Admin-এর জন্য।
     *
     * Group Admin হলেও permission নেই।
     */
    if (
      !isBotAdmin(event)
    ) {
      return;
    }

    const cmd =
      String(
        args[0] || ""
      ).toLowerCase();

    const threadID =
      String(
        event.threadID
      );

    /* =====================================================
       ON
    ===================================================== */

    if (
      cmd === "on"
    ) {

      setGroupStatus(
        threadID,
        true
      );

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🎙️ 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲\n" +
        "┃\n" +
        "┃ 🟢 𝗦𝘁𝗮𝘁𝘂𝘀 : 𝗢𝗡\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
      );
    }

    /* =====================================================
       OFF
    ===================================================== */

    if (
      cmd === "off"
    ) {

      setGroupStatus(
        threadID,
        false
      );

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🎙️ 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲\n" +
        "┃\n" +
        "┃ 🔴 𝗦𝘁𝗮𝘁𝘂𝘀 : 𝗢𝗙𝗙\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
      );
    }

    /* =====================================================
       SETTING
    ===================================================== */

    if (
      !cmd ||
      cmd === "setting" ||
      cmd === "settings"
    ) {

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🎙️ 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘\n" +
        "┃\n" +
        "┃ ① 📋 𝗘𝗺𝗼𝗷𝗶 𝗟𝗶𝘀𝘁\n" +
        "┃ ② 👥 𝗠𝗮𝗻𝗮𝗴𝗲 𝗚𝗿𝗼𝘂𝗽'𝘀\n" +
        "┃ ③ ➕ 𝗔𝗱𝗱 𝗘𝗩\n" +
        "┃ ④ 🔴 𝗢𝗙𝗙\n" +
        "┃ ⑤ 🟢 𝗢𝗡\n" +
        "┃\n" +
        "┃ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱:\n" +
        "┃ ev list\n" +
        "┃ ev manage\n" +
        "┃ ev add\n" +
        "┃ ev on / ev off\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯"
      );
    }

    /* =====================================================
       EMOJI LIST
    ===================================================== */

    if (
      cmd === "list" ||
      cmd === "emoji" ||
      cmd === "emojilist"
    ) {

      const emojis =
        Object.keys(
          DATA.emojis
        );

      let text =
        "╭━━━━━━〔 🎙️ 𝗘𝗩 𝗟𝗜𝗦𝗧 〕━━━━━━╮\n";

      emojis.forEach(
        (emoji, index) => {

          text +=
            `┃ ${String(
              index + 1
            ).padStart(
              2,
              "0"
            )} ┃ ${emoji}\n`;
        }
      );

      text +=
        "╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n" +
        `📦 𝗧𝗼𝘁𝗮𝗹 : ${emojis.length}`;

      return message.reply(
        text
      );
    }

    /* =====================================================
       MANAGE GROUPS
    ===================================================== */

    if (
      cmd === "manage" ||
      cmd === "groups"
    ) {

      const groups =
        await getCurrentBotGroups(
          api
        );

      const onGroups = [];
      const offGroups = [];

      for (
        const group of groups
      ) {

        if (
          isGroupEnabled(
            group.threadID
          )
        ) {

          onGroups.push(
            group
          );

        } else {

          offGroups.push(
            group
          );
        }
      }

      let result =
        "╭━━━━━━〔 👥 𝗘𝗩 𝗠𝗔𝗡𝗔𝗚𝗘 〕━━━━━━╮\n\n";

      /* ON GROUPS */

      result +=
        "🟢 𝗢𝗡 𝗚𝗥𝗢𝗨𝗣𝗦\n" +
        "━━━━━━━━━━━━━━━━━━\n";

      if (
        !onGroups.length
      ) {

        result +=
          "┃ 𝗡𝗼 𝗢𝗡 𝗚𝗿𝗼𝘂𝗽\n";

      } else {

        onGroups.forEach(
          (group, index) => {

            result +=
              `┃ ${String(
                index + 1
              ).padStart(
                2,
                "0"
              )} ┃ ${group.name}\n`;
          }
        );
      }

      /* OFF GROUPS */

      result +=
        "\n🔴 𝗢𝗙𝗙 𝗚𝗥𝗢𝗨𝗣𝗦\n" +
        "━━━━━━━━━━━━━━━━━━\n";

      if (
        !offGroups.length
      ) {

        result +=
          "┃ 𝗡𝗼 𝗢𝗙𝗙 𝗚𝗿𝗼𝘂𝗽\n";

      } else {

        offGroups.forEach(
          (group, index) => {

            result +=
              `┃ ${String(
                index + 1
              ).padStart(
                2,
                "0"
              )} ┃ ${group.name}\n`;
          }
        );
      }

      result +=
        "\n━━━━━━━━━━━━━━━━━━\n" +
        `🟢 𝗢𝗡 : ${onGroups.length}\n` +
        `🔴 𝗢𝗙𝗙 : ${offGroups.length}\n` +
        `📦 𝗧𝗢𝗧𝗔𝗟 : ${groups.length}`;

      return message.reply(
        result
      );
    }

    /* =====================================================
       ADD EV
       Command: ev add
    ===================================================== */

    if (
      cmd === "add"
    ) {

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🎙️ 𝗔𝗗𝗗 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘\n" +
        "┃\n" +
        "┃ প্রথমে Emoji পাঠাও।\n" +
        "┃\n" +
        "┃ উদাহরণ: 😍\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯",

        (
          err,
          info
        ) => {

          if (
            err ||
            !info
          ) {
            return;
          }

          global.GoatBot.onReply.set(
            info.messageID,
            {
              commandName:
                "emoji_voice",

              type:
                "addEmoji"
            }
          );
        }
      );
    }

    return;
  },

  /* =======================================================
     ON REPLY
  ======================================================= */

  onReply: async function ({
    event,
    message,
    Reply
  }) {

    /*
     * Add EV-এর reply step-ও
     * শুধু Bot Admin-এর জন্য।
     */
    if (
      !isBotAdmin(event)
    ) {
      return;
    }

    if (
      !Reply ||
      Reply.commandName !==
        "emoji_voice"
    ) {
      return;
    }

    /* =====================================================
       EMOJI STEP
    ===================================================== */

    if (
      Reply.type ===
      "addEmoji"
    ) {

      const emoji =
        event.body?.trim();

      if (!emoji) {
        return;
      }

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🔗 𝗩𝗢𝗜𝗖𝗘 𝗟𝗜𝗡𝗞\n" +
        "┃\n" +
        "┃ এখন voice/audio link পাঠাও।\n" +
        "┃\n" +
        "┃ উদাহরণ:\n" +
        "┃ https://files.catbox.moe/example.mp3\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯",

        (
          err,
          info
        ) => {

          if (
            err ||
            !info
          ) {
            return;
          }

          global.GoatBot.onReply.set(
            info.messageID,
            {
              commandName:
                "emoji_voice",

              type:
                "addVoice",

              emoji
            }
          );
        }
      );
    }

    /* =====================================================
       VOICE URL STEP
    ===================================================== */

    if (
      Reply.type ===
      "addVoice"
    ) {

      const url =
        event.body?.trim();

      if (
        !url ||
        !/^https?:\/\/.+/i.test(
          url
        )
      ) {

        return message.reply(
          "❌ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗩𝗼𝗶𝗰𝗲 𝗟𝗶𝗻𝗸!"
        );
      }

      const emoji =
        Reply.emoji;

      if (
        !DATA.emojis[emoji]
      ) {

        DATA.emojis[emoji] = [];
      }

      DATA.emojis[emoji].push(
        url
      );

      saveData();

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ ✅ 𝗘𝗩 𝗔𝗗𝗗𝗘𝗗\n" +
        "┃\n" +
        `┃ 🎭 𝗘𝗺𝗼𝗷𝗶 : ${emoji}\n` +
        "┃ 🎙️ 𝗩𝗼𝗶𝗰𝗲 : 𝗔𝗱𝗱𝗲𝗱\n" +
        `┃ 📦 𝗩𝗼𝗶𝗰𝗲𝘀 : ${DATA.emojis[emoji].length}\n` +
        "╰━━━━━━━━━━━━━━━━━━━━╯"
      );
    }
  },

  /* =======================================================
     EMOJI VOICE CHAT
  ======================================================= */

  onChat: async function ({
    event,
    message
  }) {

    /*
     * IMPORTANT:
     *
     * এখানে কোনো Bot Admin check নেই।
     *
     * তাই সাধারণ member-ও emoji দিলে
     * এই function execute করতে পারবে।
     */

    const body =
      event.body?.trim();

    if (!body) {
      return;
    }

    /* =====================================================
       FIND EMOJI
    ===================================================== */

    const audioList =
      DATA.emojis[body];

    if (
      !audioList ||
      !audioList.length
    ) {
      return;
    }

    /* =====================================================
       GROUP STATUS
    ===================================================== */

    const threadID =
      String(
        event.threadID
      );

    /*
     * Group OFF হলে voice যাবে না।
     */
    if (
      !isGroupEnabled(
        threadID
      )
    ) {
      return;
    }

    /* =====================================================
       RANDOM VOICE
    ===================================================== */

    const audioUrl =
      audioList[
        Math.floor(
          Math.random() *
          audioList.length
        )
      ];

    /* =====================================================
       SEND
    ===================================================== */

    await sendVoice(
      message,
      audioUrl
    );
  }
};