const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CONFIG_FILE = global.client?.dirConfig || path.join(__dirname, "config.json");

const DEFAULT_EMOJIS = {
  "🥱": ["https://files.catbox.moe/9pou40.mp3", "https://files.catbox.moe/60cwcg.mp3"],
  "😁": ["https://files.catbox.moe/60cwcg.mp3"],
  "😌": ["https://files.catbox.moe/epqwbx.mp3"],
  "🥺": ["https://files.catbox.moe/wc17iq.mp3", "https://files.catbox.moe/dv9why.mp3"],
  "🤭": ["https://files.catbox.moe/cu0mpy.mp3"],
  "😅": ["https://files.catbox.moe/jl3pzb.mp3"],
  "😏": ["https://files.catbox.moe/z9e52r.mp3"],
  "😞": ["https://files.catbox.moe/tdimtx.mp3"],
  "🤫": ["https://files.catbox.moe/0uii99.mp3"],
  "🍼": ["https://files.catbox.moe/p6ht91.mp3"],
  "🤔": ["https://files.catbox.moe/hy6m6w.mp3"],
  "🥰": ["https://files.catbox.moe/dv9why.mp3"],
  "🤦": ["https://files.catbox.moe/ivlvoq.mp3"],
  "😘": ["https://files.catbox.moe/sbws0w.mp3", "https://files.catbox.moe/37dqpx.mp3"],
  "😑": ["https://files.catbox.moe/p78xfw.mp3"],
  "😢": ["https://files.catbox.moe/shxwj1.mp3"],
  "🙊": ["https://files.catbox.moe/3bejxv.mp3"],
  "🤨": ["https://files.catbox.moe/4aci0r.mp3"],
  "😡": ["https://files.catbox.moe/shxwj1.mp3", "https://files.catbox.moe/h9ekli.mp3"],
  "🤬": ["https://files.catbox.moe/shxwj1.mp3", "https://files.catbox.moe/h9ekli.mp3"],
  "🙈": ["https://files.catbox.moe/3qc90y.mp3"],
  "😍": ["https://files.catbox.moe/qjfk1b.mp3"],
  "😭": ["https://files.catbox.moe/itm4g0.mp3"],
  "😱": ["https://files.catbox.moe/mu0kka.mp3"],
  "😻": ["https://files.catbox.moe/y8ul2j.mp3"],
  "😿": ["https://files.catbox.moe/tqxemm.mp3"],
  "💔": ["https://files.catbox.moe/6yanv3.mp3"],
  "🤣": ["https://files.catbox.moe/2sweut.mp3", "https://files.catbox.moe/jl3pzb.mp3"],
  "🥹": ["https://files.catbox.moe/jf85xe.mp3"],
  "😩": ["https://files.catbox.moe/b4m5aj.mp3"],
  "🫣": ["https://files.catbox.moe/ttb6hi.mp3"],
  "🐸": ["https://files.catbox.moe/utl83s.mp3", "https://files.catbox.moe/sg6ugl.mp3"],
  "💋": ["https://files.catbox.moe/37dqpx.mp3"],
  "🫦": ["https://files.catbox.moe/61w3i0.mp3"],
  "😴": ["https://files.catbox.moe/rm5ozj.mp3"],
  "🙏": ["https://files.catbox.moe/7avi7u.mp3"],
  "😼": ["https://files.catbox.moe/4oz916.mp3"],
  "🖕": ["https://files.catbox.moe/593u3j.mp3", "https://files.catbox.moe/dtua60.mp3"],
  "🥵": ["https://files.catbox.moe/l90704.mp3"],
  "🙂": ["https://files.catbox.moe/4oks08.mp3"],
  "😒": ["https://files.catbox.moe/mt5il0.mp3"],
  "😓": ["https://files.catbox.moe/zh3mdg.mp3"],
  "🤧": ["https://files.catbox.moe/zh3mdg.mp3"],
  "🙄": ["https://files.catbox.moe/vgzkeu.mp3"],
  "🤪": ["https://files.catbox.moe/ihmbr7.mp3"],
  "👍": ["https://files.catbox.moe/74bho5.mp3"],
  "☠️": ["https://files.catbox.moe/wv0rwc.mp3"]
};

/* =========================================================
   STORAGE
========================================================= */

function getStore() {
  if (!global.GoatBot.emojiVoiceStore) {
    global.GoatBot.emojiVoiceStore = {
      emojis: { ...DEFAULT_EMOJIS },
      groups: {}
    };
  }

  return global.GoatBot.emojiVoiceStore;
}

function saveStore() {
  try {
    const config = global.GoatBot.config;

    if (!config.emojiVoiceStore) {
      config.emojiVoiceStore = getStore();
    } else {
      config.emojiVoiceStore = getStore();
    }

    fs.writeFileSync(
      CONFIG_FILE,
      JSON.stringify(config, null, 2)
    );
  } catch (err) {
    console.error("[EMOJI_VOICE] Save error:", err.message);
  }
}

function loadStore() {
  try {
    const saved = global.GoatBot.config?.emojiVoiceStore;

    if (saved) {
      global.GoatBot.emojiVoiceStore = {
        emojis: {
          ...DEFAULT_EMOJIS,
          ...(saved.emojis || {})
        },
        groups: saved.groups || {}
      };
    } else {
      getStore();
    }
  } catch {
    getStore();
  }
}

loadStore();

/* =========================================================
   BOT ADMIN CHECK
========================================================= */

function isBotAdmin(event) {
  const senderID = String(event.senderID);

  // GoatBot role system
  if (
    Array.isArray(global.GoatBot.config?.adminBot) &&
    global.GoatBot.config.adminBot
      .map(String)
      .includes(senderID)
  ) {
    return true;
  }

  // Alternative admin list
  if (
    Array.isArray(global.GoatBot.config?.adminBotIds) &&
    global.GoatBot.config.adminBotIds
      .map(String)
      .includes(senderID)
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   GROUP STATUS
========================================================= */

function isGroupEnabled(threadID) {
  const store = getStore();

  if (store.groups[threadID] === undefined) {
    return true;
  }

  return store.groups[threadID] === true;
}

function setGroupStatus(threadID, status) {
  const store = getStore();

  store.groups[threadID] = status;

  saveStore();
}

/* =========================================================
   DOWNLOAD + SEND VOICE
========================================================= */

async function sendVoice(message, emoji, audioUrl) {

  const cacheDir = path.join(__dirname, "cache");

  await fs.ensureDir(cacheDir);

  const filePath = path.join(
    cacheDir,
    `ev_${Date.now()}_${Math.floor(Math.random() * 999999)}.mp3`
  );

  try {

    const response = await axios.get(
      audioUrl,
      {
        responseType: "arraybuffer",
        timeout: 15000
      }
    );

    await fs.writeFile(
      filePath,
      Buffer.from(response.data)
    );

    await message.reply({
      attachment: fs.createReadStream(filePath)
    });

  } catch (error) {

    console.error(
      "[EMOJI_VOICE] Voice error:",
      error.message
    );

    // আগের funny error message
    return message.reply(
      "ইমোজি দিয়ে লাভ নাই 🤣\n" +
      "যাও ভালো মুন্সী দেখো গা জান 💋"
    );

  } finally {

    setTimeout(() => {

      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {}

    }, 10000);
  }
}

/* =========================================================
   COMMAND
========================================================= */

module.exports = {

  config: {
    name: "emoji_voice",
    aliases: ["ev"],
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 3,
    role: 2,

    shortDescription: "Emoji Voice",
    longDescription:
      "Emoji Voice system with group control and voice management.",

    category: "system",

    guide: {
      en:
        "ev\n" +
        "ev setting\n" +
        "ev manage\n" +
        "ev on\n" +
        "ev off\n" +
        "add ev"
    }
  },

  /* =======================================================
     ON START
  ======================================================= */

  onStart: async function ({
    api,
    event,
    message,
    args,
    threadsData,
    role
  }) {

    /*
     * IMPORTANT:
     * এই command-এর config role = 2।
     * তাই সাধারণ member / group admin command system
     * দিয়ে এখানে ঢুকতে পারবে না।
     *
     * তারপরও extra security হিসেবে Bot Admin check করা হচ্ছে।
     */

    if (!isBotAdmin(event) && role < 2) {
      return;
    }

    const threadID = event.threadID;
    const cmd = args[0]?.toLowerCase();

    /* =====================================================
       EV ON
    ===================================================== */

    if (cmd === "on") {

      setGroupStatus(threadID, true);

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🎙️ 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲\n" +
        "┃\n" +
        "┃ 🟢 𝗦𝘁𝗮𝘁𝘂𝘀 : 𝗢𝗡\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
      );
    }

    /* =====================================================
       EV OFF
    ===================================================== */

    if (cmd === "off") {

      setGroupStatus(threadID, false);

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🎙️ 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲\n" +
        "┃\n" +
        "┃ 🔴 𝗦𝘁𝗮𝘁𝘂𝘀 : 𝗢𝗙𝗙\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
      );
    }

    /* =====================================================
       ADD EV
    ===================================================== */

    if (
      (cmd === "add" && args[1]?.toLowerCase() === "ev") ||
      cmd === "add"
    ) {

      const trigger = await new Promise(resolve => {

        message.reply(
          "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
          "┃ 🎙️ 𝗔𝗗𝗗 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘\n" +
          "┃\n" +
          "┃ প্রথমে Emoji পাঠাও।\n" +
          "┃ উদাহরণ: 😍\n" +
          "╰━━━━━━━━━━━━━━━━━━━━╯",
          (err, info) => {

            if (err || !info) {
              resolve(null);
              return;
            }

            global.GoatBot.onReply.set(
              info.messageID,
              {
                commandName: "emoji_voice",
                type: "addEmoji"
              }
            );

            resolve(info);
          }
        );

      });

      return trigger;
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
        "┃ 💡 Type:\n" +
        "┃ ev list\n" +
        "┃ ev manage\n" +
        "┃ add ev\n" +
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

      const emojis = Object.keys(getStore().emojis);

      let text =
        "╭━━━━━━〔 🎙️ 𝗘𝗩 𝗟𝗜𝗦𝗧 〕━━━━━━╮\n";

      emojis.forEach((emoji, index) => {

        text +=
          `┃ ${String(index + 1).padStart(2, "0")} ┃ ${emoji}\n`;

      });

      text +=
        "╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n" +
        `📦 𝗧𝗼𝘁𝗮𝗹 : ${emojis.length}`;

      return message.reply(text);
    }

    /* =====================================================
       MANAGE GROUPS
    ===================================================== */

    if (
      cmd === "manage" ||
      cmd === "groups"
    ) {

      try {

        const allThreads =
          await threadsData.getAll();

        const onGroups = [];
        const offGroups = [];

        for (const thread of allThreads || []) {

          const id =
            String(
              thread.threadID ||
              thread.id ||
              ""
            );

          if (!id) continue;

          let name =
            thread.threadName ||
            thread.name ||
            "Unnamed Group";

          const enabled =
            isGroupEnabled(id);

          if (enabled) {
            onGroups.push({
              id,
              name
            });
          } else {
            offGroups.push({
              id,
              name
            });
          }
        }

        let result =
          "╭━━━━━━〔 👥 𝗘𝗩 𝗠𝗔𝗡𝗔𝗚𝗘 〕━━━━━━╮\n\n";

        result +=
          "🟢 𝗢𝗡 𝗚𝗥𝗢𝗨𝗣𝗦\n" +
          "━━━━━━━━━━━━━━━━━━\n";

        if (!onGroups.length) {
          result += "┃ No ON groups\n";
        } else {

          onGroups.forEach((g, i) => {

            result +=
              `┃ ${i + 1}. ${g.name}\n`;

          });
        }

        result +=
          "\n🔴 𝗢𝗙𝗙 𝗚𝗥𝗢𝗨𝗣𝗦\n" +
          "━━━━━━━━━━━━━━━━━━\n";

        if (!offGroups.length) {
          result += "┃ No OFF groups\n";
        } else {

          offGroups.forEach((g, i) => {

            result +=
              `┃ ${i + 1}. ${g.name}\n`;

          });
        }

        result +=
          "\n━━━━━━━━━━━━━━━━━━\n" +
          `🟢 ON : ${onGroups.length}\n` +
          `🔴 OFF : ${offGroups.length}\n` +
          `📦 TOTAL : ${onGroups.length + offGroups.length}`;

        return message.reply(result);

      } catch (err) {

        console.error(
          "[EV MANAGE]",
          err.message
        );

        return message.reply(
          "❌ Group list load করা সম্ভব হয়নি।"
        );
      }
    }

    return;
  },

  /* =======================================================
     REPLY SYSTEM — ADD EV
  ======================================================= */

  onReply: async function ({
    event,
    message,
    Reply
  }) {

    if (!isBotAdmin(event)) return;

    if (!Reply || Reply.commandName !== "emoji_voice") {
      return;
    }

    /* =====================================================
       STEP 1 — EMOJI
    ===================================================== */

    if (Reply.type === "addEmoji") {

      const emoji =
        event.body?.trim();

      if (!emoji) return;

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ 🔗 𝗩𝗢𝗜𝗖𝗘 𝗟𝗜𝗡𝗞\n" +
        "┃\n" +
        "┃ এখন voice/audio link পাঠাও।\n" +
        "┃ উদাহরণ:\n" +
        "┃ https://files.catbox.moe/example.mp3\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯",
        (err, info) => {

          if (err || !info) return;

          global.GoatBot.onReply.set(
            info.messageID,
            {
              commandName: "emoji_voice",
              type: "addVoice",
              emoji
            }
          );

        }
      );
    }

    /* =====================================================
       STEP 2 — VOICE URL
    ===================================================== */

    if (Reply.type === "addVoice") {

      const url =
        event.body?.trim();

      if (
        !url ||
        !/^https?:\/\/.+/i.test(url)
      ) {

        return message.reply(
          "❌ সঠিক voice URL পাঠাও।"
        );
      }

      const emoji =
        Reply.emoji;

      const store =
        getStore();

      if (!store.emojis[emoji]) {
        store.emojis[emoji] = [];
      }

      store.emojis[emoji].push(url);

      saveStore();

      return message.reply(
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "┃ ✅ 𝗘𝗩 𝗔𝗗𝗗𝗘𝗗\n" +
        "┃\n" +
        `┃ 🎭 Emoji : ${emoji}\n` +
        "┃ 🎙️ Voice : Added\n" +
        `┃ 📦 Total Voice : ${store.emojis[emoji].length}\n` +
        "╰━━━━━━━━━━━━━━━━━━━━╯"
      );
    }
  },

  /* =======================================================
     NORMAL CHAT — EMOJI VOICE
  ======================================================= */

  onChat: async function ({
    event,
    message
  }) {

    const body =
      event.body?.trim();

    if (!body) return;

    /*
     * IMPORTANT:
     * Setting commands এখানে process করা হবে না।
     *
     * ফলে সাধারণ member / group admin
     * onChat দিয়ে EV settings bypass করতে পারবে না।
     *
     * শুধু emoji হলে voice system কাজ করবে।
     */

    const store =
      getStore();

    const audioList =
      store.emojis[body];

    if (!audioList?.length) {
      return;
    }

    // Group OFF হলে কোনো voice যাবে না
    if (!isGroupEnabled(event.threadID)) {
      return;
    }

    const audioUrl =
      audioList[
        Math.floor(
          Math.random() * audioList.length
        )
      ];

    await sendVoice(
      message,
      body,
      audioUrl
    );
  }
};