const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "emoji_voice.json");

const DEFAULT_EMOJI_AUDIO = {
  "🥱": [
    "https://files.catbox.moe/9pou40.mp3",
    "https://files.catbox.moe/60cwcg.mp3"
  ],
  "😁": ["https://files.catbox.moe/60cwcg.mp3"],
  "😌": ["https://files.catbox.moe/epqwbx.mp3"],
  "🥺": [
    "https://files.catbox.moe/wc17iq.mp3",
    "https://files.catbox.moe/dv9why.mp3"
  ],
  "🤭": ["https://files.catbox.moe/cu0mpy.mp3"],
  "😅": ["https://files.catbox.moe/jl3pzb.mp3"],
  "😏": ["https://files.catbox.moe/z9e52r.mp3"],
  "😞": ["https://files.catbox.moe/tdimtx.mp3"],
  "🤫": ["https://files.catbox.moe/0uii99.mp3"],
  "🍼": ["https://files.catbox.moe/p6ht91.mp3"],
  "🤔": ["https://files.catbox.moe/hy6m6w.mp3"],
  "🥰": ["https://files.catbox.moe/dv9why.mp3"],
  "🤦": ["https://files.catbox.moe/ivlvoq.mp3"],
  "😘": [
    "https://files.catbox.moe/sbws0w.mp3",
    "https://files.catbox.moe/37dqpx.mp3"
  ],
  "😑": ["https://files.catbox.moe/p78xfw.mp3"],
  "😢": ["https://files.catbox.moe/shxwj1.mp3"],
  "🙊": ["https://files.catbox.moe/3bejxv.mp3"],
  "🤨": ["https://files.catbox.moe/4aci0r.mp3"],
  "😡": [
    "https://files.catbox.moe/shxwj1.mp3",
    "https://files.catbox.moe/h9ekli.mp3"
  ],
  "🤬": [
    "https://files.catbox.moe/shxwj1.mp3",
    "https://files.catbox.moe/h9ekli.mp3"
  ],
  "🙈": ["https://files.catbox.moe/3qc90y.mp3"],
  "😍": ["https://files.catbox.moe/qjfk1b.mp3"],
  "😭": ["https://files.catbox.moe/itm4g0.mp3"],
  "😱": ["https://files.catbox.moe/mu0kka.mp3"],
  "😻": ["https://files.catbox.moe/y8ul2j.mp3"],
  "😿": ["https://files.catbox.moe/tqxemm.mp3"],
  "💔": ["https://files.catbox.moe/6yanv3.mp3"],
  "🤣": [
    "https://files.catbox.moe/2sweut.mp3",
    "https://files.catbox.moe/jl3pzb.mp3"
  ],
  "🥹": ["https://files.catbox.moe/jf85xe.mp3"],
  "😩": ["https://files.catbox.moe/b4m5aj.mp3"],
  "🫣": ["https://files.catbox.moe/ttb6hi.mp3"],
  "🐸": [
    "https://files.catbox.moe/utl83s.mp3",
    "https://files.catbox.moe/sg6ugl.mp3"
  ],
  "💋": ["https://files.catbox.moe/37dqpx.mp3"],
  "🫦": ["https://files.catbox.moe/61w3i0.mp3"],
  "😴": ["https://files.catbox.moe/rm5ozj.mp3"],
  "🙏": ["https://files.catbox.moe/7avi7u.mp3"],
  "😼": ["https://files.catbox.moe/4oz916.mp3"],
  "🖕": [
    "https://files.catbox.moe/593u3j.mp3",
    "https://files.catbox.moe/dtua60.mp3"
  ],
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
   FILE SYSTEM
========================================================= */

async function loadData() {
  try {
    await fs.ensureDir(DATA_DIR);

    if (!(await fs.pathExists(DATA_FILE))) {
      const data = {
        enabledGroups: {},
        customVoices: {}
      };

      await fs.writeJson(DATA_FILE, data, { spaces: 2 });
      return data;
    }

    const data = await fs.readJson(DATA_FILE);

    return {
      enabledGroups: data.enabledGroups || {},
      customVoices: data.customVoices || {}
    };

  } catch (error) {
    console.error("[EMOJI VOICE] DATA LOAD ERROR:", error);

    return {
      enabledGroups: {},
      customVoices: {}
    };
  }
}


async function saveData(data) {
  try {
    await fs.ensureDir(DATA_DIR);
    await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch (error) {
    console.error("[EMOJI VOICE] DATA SAVE ERROR:", error);
  }
}


/* =========================================================
   GET ALL EMOJIS
========================================================= */

async function getEmojiMap() {
  const data = await loadData();

  const map = {
    ...DEFAULT_EMOJI_AUDIO,
    ...data.customVoices
  };

  return map;
}


/* =========================================================
   GET GROUP STATUS
========================================================= */

async function isGroupEnabled(threadID) {
  const data = await loadData();

  /*
   * New group = ON by default.
   *
   * false = explicitly OFF
   * true / undefined = ON
   */

  return data.enabledGroups[String(threadID)] !== false;
}


async function setGroupStatus(threadID, status) {
  const data = await loadData();

  data.enabledGroups[String(threadID)] = status;

  await saveData(data);
}


/* =========================================================
   GET ALL BOT GROUPS
========================================================= */

async function getAllGroups(api) {
  return new Promise((resolve, reject) => {

    try {

      api.getThreadList(
        1000,
        null,
        ["INBOX"],
        (err, list) => {

          if (err) {
            return reject(err);
          }

          if (!Array.isArray(list)) {
            return resolve([]);
          }

          /*
           * Only group chats.
           *
           * Single-person conversations are ignored.
           */

          const groups = list.filter(thread => {

            if (!thread) return false;

            if (thread.isGroup === true) {
              return true;
            }

            if (
              Array.isArray(thread.participantIDs) &&
              thread.participantIDs.length > 2
            ) {
              return true;
            }

            return false;
          });

          resolve(groups);

        }
      );

    } catch (error) {
      reject(error);
    }

  });
}


/* =========================================================
   TYPING / DELAY
========================================================= */

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));


/* =========================================================
   MODULE
========================================================= */

module.exports = {

  config: {
    name: "emoji_voice",
    aliases: ["ev"],
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 3,
    role: 0,

    shortDescription: "Emoji Voice System",

    longDescription:
      "Emoji voice system with group settings, emoji list, group management and custom emoji voice.",

    category: "system",

    guide: {
      en:
        "ev\n" +
        "ev on\n" +
        "ev off\n" +
        "ev setting"
    }
  },


  /* =======================================================
     COMMAND START
  ======================================================= */

  onStart: async function ({
    api,
    event,
    args,
    message
  }) {

    const threadID = String(event.threadID);

    const action =
      args.length
        ? args.join(" ").trim().toLowerCase()
        : "status";


    /* =====================================================
       EV ON
    ===================================================== */

    if (action === "on") {

      await setGroupStatus(threadID, true);

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━╮
┃ 🟢 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘
┃
┃ 𝗦𝘁𝗮𝘁𝘂𝘀 : 𝗢𝗡
┃ 𝗚𝗿𝗼𝘂𝗽 : 𝗘𝗻𝗮𝗯𝗹𝗲𝗱
╰━━━━━━━━━━━━━━━━━━╯`
      );
    }


    /* =====================================================
       EV OFF
    ===================================================== */

    if (action === "off") {

      await setGroupStatus(threadID, false);

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━╮
┃ 🔴 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘
┃
┃ 𝗦𝘁𝗮𝘁𝘂𝘀 : 𝗢𝗙𝗙
┃ 𝗚𝗿𝗼𝘂𝗽 : 𝗗𝗶𝘀𝗮𝗯𝗹𝗲𝗱
╰━━━━━━━━━━━━━━━━━━╯`
      );
    }


    /* =====================================================
       SETTING
    ===================================================== */

    if (
      action === "setting" ||
      action === "settings"
    ) {

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🎛️ 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘 𝗦𝗘𝗧𝗧𝗜𝗡𝗚
╰━━━━━━━━━━━━━━━━━━━━━━╯

1️⃣ 𝗘𝗺𝗼𝗷𝗶 𝗟𝗶𝘀𝘁
2️⃣ 𝗠𝗮𝗻𝗮𝗴𝗲 𝗚𝗿𝗼𝘂𝗽'𝘀
3️⃣ 𝗔𝗱𝗱 𝗘𝗩
4️⃣ 𝗢𝗙𝗙
5️⃣ 𝗢𝗡

━━━━━━━━━━━━━━━━━━━━━━
💬 Reply with option number
━━━━━━━━━━━━━━━━━━━━━━`,
        (err, info) => {

          if (err || !info) return;

          global.GoatBot.onReply.set(
            info.messageID,
            {
              commandName: "emoji_voice",
              type: "setting"
            }
          );

        }
      );
    }


    /* =====================================================
       CURRENT STATUS
    ===================================================== */

    const enabled =
      await isGroupEnabled(threadID);

    const emojiMap =
      await getEmojiMap();

    return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🎙️ 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘
╰━━━━━━━━━━━━━━━━━━━━━━╯

📡 𝗦𝘁𝗮𝘁𝘂𝘀 : ${enabled ? "🟢 𝗢𝗡" : "🔴 𝗢𝗙𝗙"}
🎭 𝗘𝗺𝗼𝗷𝗶 : ${Object.keys(emojiMap).length}

⚙️ 𝗦𝗲𝘁𝘁𝗶𝗻𝗴 : 𝗲𝘃 𝘀𝗲𝘁𝘁𝗶𝗻𝗴
━━━━━━━━━━━━━━━━━━━━━━`
    );
  },


  /* =======================================================
     REPLY HANDLER
  ======================================================= */

  onReply: async function ({
    api,
    event,
    message
  }) {

    const reply =
      event.body?.trim();

    if (!reply) return;

    const data =
      global.GoatBot.onReply.get(event.messageReply?.messageID);

    if (!data) return;

    if (data.commandName !== "emoji_voice") return;


    /* =====================================================
       SETTING MENU
    ===================================================== */

    if (data.type === "setting") {

      const option =
        reply.toLowerCase();


      /* ================================================
         1 = EMOJI LIST
      ================================================ */

      if (
        option === "1" ||
        option === "emoji list"
      ) {

        const emojiMap =
          await getEmojiMap();

        const emojis =
          Object.keys(emojiMap);

        let text =
`╭━━━━━━〔 🎭 𝗘𝗠𝗢𝗝𝗜 𝗟𝗜𝗦𝗧 〕━━━━━━╮

`;

        emojis.forEach((emoji, index) => {

          const custom =
            DEFAULT_EMOJI_AUDIO[emoji]
              ? "𝗗𝗲𝗳𝗮𝘂𝗹𝘁"
              : "𝗖𝘂𝘀𝘁𝗼𝗺";

          text +=
`┃ ${String(index + 1).padStart(2, "0")} ┃ ${emoji} ┃ ${custom}
`;

        });

        text +=
`
╰━━━━━━━━━━━━━━━━━━━━━━╯
📦 𝗧𝗼𝘁𝗮𝗹 : ${emojis.length}`;

        return message.reply(text);
      }


      /* ================================================
         2 = MANAGE GROUPS
      ================================================ */

      if (
        option === "2" ||
        option === "manage group's" ||
        option === "manage groups"
      ) {

        try {

          const groups =
            await getAllGroups(api);

          if (!groups.length) {
            return message.reply(
              "❌ 𝗡𝗼 𝗚𝗿𝗼𝘂𝗽 𝗙𝗼𝘂𝗻𝗱."
            );
          }

          const groupData =
            await loadData();

          const onGroups = [];
          const offGroups = [];

          groups.forEach(group => {

            const id =
              String(group.threadID);

            const name =
              group.name ||
              "Unnamed Group";

            const isOn =
              groupData.enabledGroups[id] !== false;

            const item = {
              id,
              name
            };

            if (isOn) {
              onGroups.push(item);
            } else {
              offGroups.push(item);
            }

          });


          let text =
`╭━━━━〔 🎛️ 𝗠𝗔𝗡𝗔𝗚𝗘 𝗚𝗥𝗢𝗨𝗣'𝗦 〕━━━━╮

🟢 𝗢𝗡 𝗟𝗜𝗦𝗧
`;

          if (onGroups.length) {

            onGroups.forEach((group, index) => {

              text +=
`${index + 1}. ${group.name}
   └─ ${group.id}
`;

            });

          } else {

            text +=
`└─ 𝗡𝗼 𝗴𝗿𝗼𝘂𝗽𝘀

`;

          }


          text +=
`
🔴 𝗢𝗙𝗙 𝗟𝗜𝗦𝗧
`;

          if (offGroups.length) {

            offGroups.forEach((group, index) => {

              text +=
`${index + 1}. ${group.name}
   └─ ${group.id}
`;

            });

          } else {

            text +=
`└─ 𝗡𝗼 𝗴𝗿𝗼𝘂𝗽𝘀

`;

          }


          text +=
`
━━━━━━━━━━━━━━━━━━━━━━
💡 𝗧𝗼 𝗰𝗵𝗮𝗻𝗴𝗲 𝗮 𝗴𝗿𝗼𝘂𝗽:
𝗥𝗲𝗽𝗹𝘆 → group ID + on/off

𝗘𝘅𝗮𝗺𝗽𝗹𝗲:
${groups[0]?.threadID || "GROUP_ID"} on
━━━━━━━━━━━━━━━━━━━━━━`;

          return message.reply(
            text,
            (err, info) => {

              if (err || !info) return;

              global.GoatBot.onReply.set(
                info.messageID,
                {
                  commandName: "emoji_voice",
                  type: "manage"
                }
              );

            }
          );

        } catch (error) {

          console.error(
            "[EV MANAGE ERROR]",
            error
          );

          return message.reply(
            "❌ 𝗚𝗿𝗼𝘂𝗽 𝗟𝗶𝘀𝘁 𝗙𝗲𝘁𝗰𝗵 𝗙𝗮𝗶𝗹𝗲𝗱."
          );
        }
      }


      /* ================================================
         3 = ADD EV
      ================================================ */

      if (
        option === "3" ||
        option === "add ev"
      ) {

        return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ ➕ 𝗔𝗗𝗗 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘
╰━━━━━━━━━━━━━━━━━━━━━━╯

🎭 প্রথমে যে 𝗘𝗺𝗼𝗷𝗶 যোগ করতে চাও সেটা পাঠাও।

𝗘𝘅𝗮𝗺𝗽𝗹𝗲:
😍

━━━━━━━━━━━━━━━━━━━━━━
💡 শুধু একটি emoji পাঠাও।
━━━━━━━━━━━━━━━━━━━━━━`,
          (err, info) => {

            if (err || !info) return;

            global.GoatBot.onReply.set(
              info.messageID,
              {
                commandName: "emoji_voice",
                type: "addEmoji"
              }
            );

          }
        );
      }


      /* ================================================
         4 = OFF CURRENT GROUP
      ================================================ */

      if (
        option === "4" ||
        option === "off"
      ) {

        await setGroupStatus(
          event.threadID,
          false
        );

        return message.reply(
          "🔴 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲 𝗢𝗙𝗙"
        );
      }


      /* ================================================
         5 = ON CURRENT GROUP
      ================================================ */

      if (
        option === "5" ||
        option === "on"
      ) {

        await setGroupStatus(
          event.threadID,
          true
        );

        return message.reply(
          "🟢 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲 𝗢𝗡"
        );
      }

      return;
    }


    /* =====================================================
       ADD EMOJI → RECEIVE VOICE URL
    ===================================================== */

    if (data.type === "addEmoji") {

      const emoji =
        reply.trim();

      const emojiMap =
        await getEmojiMap();

      if (
        Array.from(emoji).length !== 1
      ) {

        return message.reply(
          "❌ শুধু একটি emoji পাঠাও।"
        );

      }

      if (emojiMap[emoji]) {

        return message.reply(
`⚠️ এই emoji আগে থেকেই আছে।

🎭 ${emoji}

অন্য emoji পাঠাও।`
        );
      }


      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🎙️ 𝗩𝗢𝗜𝗖𝗘 𝗟𝗜𝗡𝗞
╰━━━━━━━━━━━━━━━━━━━━━━╯

🎭 Emoji : ${emoji}

এখন voice-এর direct URL পাঠাও।

উদাহরণ:
https://files.catbox.moe/example.mp3

━━━━━━━━━━━━━━━━━━━━━━`,
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
       ADD VOICE URL
    ===================================================== */

    if (data.type === "addVoice") {

      const emoji =
        data.emoji;

      const url =
        reply.trim();

      if (!/^https?:\/\//i.test(url)) {

        return message.reply(
          "❌ একটি valid direct voice URL পাঠাও।"
        );
      }

      /*
       * Basic audio URL validation
       */

      if (
        !/\.(mp3|wav|m4a|ogg)(\?.*)?$/i.test(url)
      ) {

        return message.reply(
`⚠️ URL টি audio file-এর direct link মনে হচ্ছে না।

MP3 / WAV / M4A / OGG link দাও।`
        );
      }

      const db =
        await loadData();

      db.customVoices[emoji] = [url];

      await saveData(db);

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ ✅ 𝗘𝗩 𝗔𝗗𝗗𝗘𝗗
╰━━━━━━━━━━━━━━━━━━━━━━╯

🎭 𝗘𝗺𝗼𝗷𝗶 : ${emoji}
🎙️ 𝗩𝗼𝗶𝗰𝗲 : 𝗔𝗱𝗱𝗲𝗱

এখন ${emoji} পাঠালে
এই voice play হবে।

📦 𝗦𝗮𝘃𝗲𝗱 : 𝗣𝗲𝗿𝗺𝗮𝗻𝗲𝗻𝘁
━━━━━━━━━━━━━━━━━━━━━━`
      );
    }


    /* =====================================================
       MANAGE GROUP ON/OFF
    ===================================================== */

    if (data.type === "manage") {

      const parts =
        reply.split(/\s+/);

      if (parts.length < 2) {

        return message.reply(
`❌ Format ভুল।

ব্যবহার:

GROUP_ID on

অথবা

GROUP_ID off`
        );
      }

      const groupID =
        parts[0];

      const status =
        parts[1].toLowerCase();

      if (
        !["on", "off"].includes(status)
      ) {

        return message.reply(
          "❌ শুধু on অথবা off ব্যবহার করো।"
        );
      }


      /*
       * Verify group exists in bot's
       * current group list.
       */

      let groups = [];

      try {

        groups =
          await getAllGroups(api);

      } catch (_) {

        return message.reply(
          "❌ Group list পাওয়া যায়নি।"
        );
      }


      const group =
        groups.find(
          g =>
            String(g.threadID) ===
            String(groupID)
        );


      if (!group) {

        return message.reply(
`❌ এই Group ID পাওয়া যায়নি।

Bot হয়তো ওই group-এ নেই।`
        );
      }


      await setGroupStatus(
        groupID,
        status === "on"
      );


      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃ 🎛️ 𝗚𝗥𝗢𝗨𝗣 𝗨𝗣𝗗𝗔𝗧𝗘𝗗
╰━━━━━━━━━━━━━━━━━━━━━━╯

👥 𝗚𝗿𝗼𝘂𝗽 :
${group.name || "Unnamed Group"}

🆔 𝗜𝗗 :
${groupID}

📡 𝗦𝘁𝗮𝘁𝘂𝘀 :
${status === "on" ? "🟢 𝗢𝗡" : "🔴 𝗢𝗙𝗙"}

━━━━━━━━━━━━━━━━━━━━━━`
      );
    }
  },


  /* =======================================================
     EMOJI CHAT
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
     * Only exact emoji triggers.
     */

    const emojiMap =
      await getEmojiMap();

    const audioList =
      emojiMap[body];

    if (!audioList) return;


    /*
     * Check current group status
     */

    const enabled =
      await isGroupEnabled(
        event.threadID
      );

    if (!enabled) return;


    /*
     * Random voice
     */

    const audioUrl =
      audioList[
        Math.floor(
          Math.random() *
          audioList.length
        )
      ];


    const cacheDir =
      path.join(
        __dirname,
        "cache"
      );

    await fs.ensureDir(cacheDir);


    const filePath =
      path.join(
        cacheDir,
        `ev_${Date.now()}_${Math.floor(
          Math.random() * 100000
        )}.mp3`
      );


    try {

      const response =
        await axios.get(
          audioUrl,
          {
            responseType:
              "arraybuffer",
            timeout: 20000
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


      /*
       * Delete cache
       */

      setTimeout(
        async () => {

          try {

            if (
              await fs.pathExists(
                filePath
              )
            ) {

              await fs.remove(
                filePath
              );

            }

          } catch (_) {}

        },
        15000
      );


    } catch (error) {

      console.error(
        "[EMOJI VOICE ERROR]:",
        error?.message || error
      );


      /*
       * তোমার আগের funny error message
       */

      return message.reply(
        "ইমোজি দিয়ে লাভ নাই 🤣\nযাও ভালো মুন্সী দেখো গা জান 💋"
      );
    }
  }
};