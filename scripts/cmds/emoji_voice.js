const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const DATA_FILE = path.join(__dirname, "emoji_voice_data.json");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/* =========================================================
   DEFAULT EMOJI VOICE LIST
========================================================= */

const defaultEmojiAudioMap = {
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
   DATA SYSTEM
========================================================= */

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const data = {
        emojiAudioMap: defaultEmojiAudioMap,
        disabledGroups: []
      };

      fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
      return data;
    }

    const data = fs.readJsonSync(DATA_FILE);

    if (!data.emojiAudioMap) {
      data.emojiAudioMap = defaultEmojiAudioMap;
    }

    if (!Array.isArray(data.disabledGroups)) {
      data.disabledGroups = [];
    }

    return data;

  } catch (error) {
    console.error("[EMOJI_VOICE] DATA LOAD ERROR:", error);

    return {
      emojiAudioMap: defaultEmojiAudioMap,
      disabledGroups: []
    };
  }
}

function saveData(data) {
  try {
    fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error("[EMOJI_VOICE] DATA SAVE ERROR:", error);
    return false;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function isGroupEnabled(data, threadID) {
  return !data.disabledGroups.includes(String(threadID));
}

function setGroupStatus(data, threadID, enabled) {
  threadID = String(threadID);

  data.disabledGroups = data.disabledGroups.filter(
    id => String(id) !== threadID
  );

  if (!enabled) {
    data.disabledGroups.push(threadID);
  }

  saveData(data);
}

async function getThreadName(api, threadID) {
  try {
    const info = await api.getThreadInfo(threadID);

    return (
      info?.threadName ||
      info?.name ||
      `Group ${threadID}`
    );

  } catch (_) {
    return `Group ${threadID}`;
  }
}

function getEmojiList(data) {
  return Object.keys(data.emojiAudioMap);
}

/* =========================================================
   MODULE
========================================================= */

module.exports = {

  config: {
    name: "emoji_voice",
    aliases: ["ev"],
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 2,
    role: 0,

    shortDescription: "Emoji Voice System",

    longDescription:
      "Emoji voice system with group settings, emoji list and voice adding.",

    category: "system",

    guide: {
      en:
        "{pn} setting\n" +
        "{pn} list\n" +
        "{pn} manage\n" +
        "{pn} add\n" +
        "{pn} on\n" +
        "{pn} off"
    }
  },

  /* =======================================================
     START
  ======================================================= */

  onStart: async function ({
    api,
    event,
    args,
    message
  }) {

    const data = loadData();

    const action =
      String(args?.[0] || "")
        .toLowerCase()
        .trim();

    /* =====================================================
       NO ARGUMENT
    ===================================================== */

    if (!action) {

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🎤 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘
╰━━━━━━━━━━━━━━━━━━━━╯

🎛️ 𝗦𝗲𝘁𝘁𝗶𝗻𝗴
➜ ev setting

📋 𝗘𝗺𝗼𝗷𝗶 𝗟𝗶𝘀𝘁
➜ ev list

👥 𝗠𝗮𝗻𝗮𝗴𝗲 𝗚𝗿𝗼𝘂𝗽𝘀
➜ ev manage

➕ 𝗔𝗱𝗱 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲
➜ ev add

🟢 𝗢𝗡
➜ ev on

🔴 𝗢𝗙𝗙
➜ ev off

━━━━━━━━━━━━━━━━━━━━
🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁`
      );
    }

    /* =====================================================
       SETTING
    ===================================================== */

    if (
      action === "setting" ||
      action === "settings"
    ) {

      const enabled =
        isGroupEnabled(
          data,
          event.threadID
        );

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ ⚙️ 𝗘𝗩 𝗦𝗘𝗧𝗧𝗜𝗡𝗚
╰━━━━━━━━━━━━━━━━━━━━╯

📋 𝗘𝗺𝗼𝗷𝗶 𝗟𝗶𝘀𝘁
➜ ev list

👥 𝗠𝗮𝗻𝗮𝗴𝗲 𝗚𝗿𝗼𝘂𝗽𝘀
➜ ev manage

➕ 𝗔𝗱𝗱 𝗘𝗺𝗼𝗷𝗶 𝗩𝗼𝗶𝗰𝗲
➜ ev add

🟢 𝗢𝗡
➜ ev on

🔴 𝗢𝗙𝗙
➜ ev off

━━━━━━━━━━━━━━━━━━━━
📡 𝗧𝗵𝗶𝘀 𝗚𝗿𝗼𝘂𝗽 :
${enabled ? "🟢 𝗢𝗡" : "🔴 𝗢𝗙𝗙"}

🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁`
      );
    }

    /* =====================================================
       EMOJI LIST
    ===================================================== */

    if (
      action === "list" ||
      action === "emojilist"
    ) {

      const emojis =
        getEmojiList(data);

      let text =
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 📋 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘 𝗟𝗜𝗦𝗧
╰━━━━━━━━━━━━━━━━━━━━╯

`;

      emojis.forEach((emoji, index) => {

        const voices =
          data.emojiAudioMap[emoji];

        text +=
`┃ ${String(index + 1).padStart(2, "0")} ┃ ${emoji}  ┃ 🎤 ${voices.length}
`;

      });

      text +=
`
━━━━━━━━━━━━━━━━━━━━
📦 𝗧𝗼𝘁𝗮𝗹 : ${emojis.length}
🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁`;

      return message.reply(text);
    }

    /* =====================================================
       CURRENT GROUP ON
    ===================================================== */

    if (action === "on") {

      setGroupStatus(
        data,
        event.threadID,
        true
      );

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🟢 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘
╰━━━━━━━━━━━━━━━━━━━━╯

✅ 𝗘𝗻𝗮𝗯𝗹𝗲𝗱

🎤 Emoji Voice is now
𝗢𝗡 in this group.

🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁`
      );
    }

    /* =====================================================
       CURRENT GROUP OFF
    ===================================================== */

    if (action === "off") {

      setGroupStatus(
        data,
        event.threadID,
        false
      );

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🔴 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘
╰━━━━━━━━━━━━━━━━━━━━╯

❌ 𝗗𝗶𝘀𝗮𝗯𝗹𝗲𝗱

🎤 Emoji Voice is now
𝗢𝗙𝗙 in this group.

🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁`
      );
    }

    /* =====================================================
       MANAGE GROUPS
    ===================================================== */

    if (
      action === "manage" ||
      action === "groups"
    ) {

      let threadList = [];

      try {

        if (
          global.GoatBot &&
          global.GoatBot.tData
        ) {

          threadList =
            await global.GoatBot.tData.getAll();

        }

      } catch (_) {}

      /*
       * Fallback:
       * Current group দেখানো হবে
       */

      if (
        !Array.isArray(threadList) ||
        threadList.length === 0
      ) {

        const currentName =
          await getThreadName(
            api,
            event.threadID
          );

        threadList = [
          {
            threadID: event.threadID,
            threadName: currentName
          }
        ];
      }

      let onList = [];
      let offList = [];

      for (const thread of threadList) {

        const id =
          String(
            thread.threadID ||
            thread.id ||
            ""
          );

        if (!id) continue;

        let name =
          thread.threadName ||
          thread.name;

        if (!name) {
          name =
            await getThreadName(
              api,
              id
            );
        }

        const item =
          `${name}\n🆔 ${id}`;

        if (
          isGroupEnabled(
            data,
            id
          )
        ) {
          onList.push(item);
        } else {
          offList.push(item);
        }
      }

      let text =
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 👥 𝗠𝗔𝗡𝗔𝗚𝗘 𝗚𝗥𝗢𝗨𝗣𝗦
╰━━━━━━━━━━━━━━━━━━━━╯

🟢 𝗢𝗡 𝗟𝗜𝗦𝗧
━━━━━━━━━━━━━━━━━━━━
`;

      if (onList.length) {

        onList.forEach(
          (item, index) => {

            text +=
`\n${index + 1}. 🟢 ${item}\n`;
          }
        );

      } else {

        text +=
"\nNo groups are ON.\n";
      }

      text +=
`
🔴 𝗢𝗙𝗙 𝗟𝗜𝗦𝗧
━━━━━━━━━━━━━━━━━━━━
`;

      if (offList.length) {

        offList.forEach(
          (item, index) => {

            text +=
`\n${index + 1}. 🔴 ${item}\n`;
          }
        );

      } else {

        text +=
"\nNo groups are OFF.\n";
      }

      text +=
`
━━━━━━━━━━━━━━━━━━━━
💡 Current group:
➜ ev on
➜ ev off

🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁`;

      return message.reply(text);
    }

    /* =====================================================
       ADD NEW EMOJI
    ===================================================== */

    if (
      action === "add" ||
      action === "addvoice" ||
      action === "adde v"
    ) {

      return message.reply(
`🎭 𝗔𝗗𝗗 𝗘𝗠𝗢𝗝𝗜 𝗩𝗢𝗜𝗖𝗘

প্রথমে যে emoji-টি add করতে চাও
সেটি শুধু পাঠাও।

উদাহরণ:
😍

━━━━━━━━━━━━━━━━━━━━
⏳ Emoji-এর অপেক্ষায় আছি...`,
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

    /* =====================================================
       UNKNOWN
    ===================================================== */

    return message.reply(
`⚠️ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗘𝗩 𝗖𝗼𝗺𝗺𝗮𝗻𝗱

➜ ev setting
➜ ev list
➜ ev manage
➜ ev add
➜ ev on
➜ ev off`
    );
  },

  /* =======================================================
     REPLY SYSTEM
  ======================================================= */

  onReply: async function ({
    api,
    event,
    message,
    Reply
  }) {

    if (!Reply) return;

    /* =====================================================
       ADD EMOJI STEP 1
    ===================================================== */

    if (Reply.type === "addEmoji") {

      const emoji =
        String(event.body || "")
          .trim();

      if (!emoji) return;

      /*
       * Only one emoji allowed
       */

      const chars = [
        ...emoji
      ];

      if (chars.length > 2) {

        return message.reply(
`❌ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗘𝗺𝗼𝗷𝗶

শুধু একটি emoji পাঠাও।
উদাহরণ: 😍`
        );
      }

      return message.reply(
`🎤 𝗩𝗢𝗜𝗖𝗘 𝗟𝗜𝗡𝗞

${emoji} এর জন্য voice-এর
direct MP3 link পাঠাও।

উদাহরণ:
https://files.catbox.moe/example.mp3

━━━━━━━━━━━━━━━━━━━━
⏳ Voice link-এর অপেক্ষায় আছি...`,
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
       ADD EMOJI STEP 2
    ===================================================== */

    if (Reply.type === "addVoice") {

      const voiceURL =
        String(event.body || "")
          .trim();

      if (!/^https?:\/\//i.test(voiceURL)) {

        return message.reply(
          "❌ একটি valid voice URL পাঠাও।"
        );
      }

      const data = loadData();

      if (
        !data.emojiAudioMap[
          Reply.emoji
        ]
      ) {

        data.emojiAudioMap[
          Reply.emoji
        ] = [];
      }

      data.emojiAudioMap[
        Reply.emoji
      ].push(voiceURL);

      const saved =
        saveData(data);

      if (!saved) {

        return message.reply(
          "❌ Voice save করা যায়নি।"
        );
      }

      return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━╮
┃ ✅ 𝗩𝗢𝗜𝗖𝗘 𝗔𝗗𝗗𝗘𝗗
╰━━━━━━━━━━━━━━━━━━━━╯

🎭 𝗘𝗺𝗼𝗷𝗶 : ${Reply.emoji}

🎤 𝗩𝗼𝗶𝗰𝗲 :
${voiceURL}

📋 এখন Emoji List-এও
এটি automatically দেখা যাবে।

🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁`
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
      String(event.body || "")
        .trim();

    if (!body) return;

    /*
     * Emoji message ছাড়া অন্য কিছু ignore
     */

    if (
      [...body].length > 2
    ) {
      return;
    }

    const data =
      loadData();

    /*
     * Group OFF হলে কোনো response নয়
     */

    if (
      !isGroupEnabled(
        data,
        event.threadID
      )
    ) {
      return;
    }

    const audioList =
      data.emojiAudioMap[body];

    if (
      !Array.isArray(audioList) ||
      !audioList.length
    ) {
      return;
    }

    /* =====================================================
       RANDOM AUDIO
    ===================================================== */

    const audioURL =
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

    await fs.ensureDir(
      cacheDir
    );

    const safeEmoji =
      encodeURIComponent(body);

    const filePath =
      path.join(
        cacheDir,
        `${safeEmoji}_${Date.now()}_${Math.floor(Math.random() * 100000)}.mp3`
      );

    try {

      const response =
        await axios.get(
          audioURL,
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
       * একটু পরে cache delete
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
        "[EMOJI_VOICE] AUDIO ERROR:",
        error?.message ||
        error
      );

      /*
       * User-facing error message নেই।
       */

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
    }
  }
};