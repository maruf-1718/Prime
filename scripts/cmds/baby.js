const axios = require("axios");

const simsim = "https://simsimi-api-tjb1.onrender.com";

/* ═══════════════════════════════════════
   🎀 TYPING INDICATOR
═══════════════════════════════════════ */

const typing = async (api, threadID, ms = 2500) => {
  try {
    if (typeof api.sendTypingIndicator === "function") {
      await api.sendTypingIndicator(threadID, true);
      await new Promise(resolve => setTimeout(resolve, ms));
      await api.sendTypingIndicator(threadID, false);
    }
  } catch {}
};


/* ═══════════════════════════════════════
   🎀 FEMALE STYLE
═══════════════════════════════════════ */

const femaleReplies = [
  "⎯⎯”হুম বলো জানু-))🥺🎀🪽",
  "⎯⎯”জি বলো বাবু-))🙈🎀",
  "⎯⎯”হুম আমি তো আছি-))🥰🪽",
  "⎯⎯”এতো ডাকো কেন গো-))😚🎀",
  "⎯⎯”কী হয়েছে বাবু-))🥹🪽",
  "⎯⎯”আমাকে ডাকছিলে নাকি-))🙈💗",
  "⎯⎯”হুম বলো শুনছি-))🌸🎀",
  "⎯⎯”আচ্ছা বলো তো-))🥰🪽",
  "⎯⎯”এই যে আমি এখানে-))🙆🏻‍♀️🎀",
  "⎯⎯”এতো মিষ্টি করে ডাকলে তো আসতেই হবে-))😚🪽"
];


/* ═══════════════════════════════════════
   🎀 MAIN MODULE
═══════════════════════════════════════ */

module.exports = {

  config: {
    name: "baby",

    aliases: [
      "maruf",
      "মারুফ",
      "oi",
      "xan",
      "kolixa",
      "bbz"
    ],

    version: "3.7",

    author: "Mohammad Maruf",

    countDown: 0,

    role: 0,

    shortDescription: "Female AI Chat",

    longDescription:
      "Female-style AI chat with teaching, auto-teaching, reply system and stylish responses.",

    category: "box chat",

    guide: {
      en:
        "{p}baby [message]\n" +
        "{p}baby teach [question] - [answer]\n" +
        "{p}baby autoteach on/off\n" +
        "{p}baby list\n" +
        "{p}baby msg [trigger]\n" +
        "{p}baby edit [question] - [old] - [new]\n" +
        "{p}baby remove [question] - [answer]"
    }
  },


  /* ═══════════════════════════════════════
     🎀 COMMAND
  ═══════════════════════════════════════ */

  onStart: async function ({
    api,
    event,
    args,
    message,
    usersData
  }) {

    const senderID = event.senderID;
    const threadID = event.threadID;

    const senderName =
      await usersData.getName(senderID);

    const query =
      args.join(" ").trim();

    const lowerQuery =
      query.toLowerCase();


    try {

      /* ───────── EMPTY ───────── */

      if (!query) {

        await typing(
          api,
          threadID,
          1800
        );

        const reply =
          femaleReplies[
            Math.floor(
              Math.random() *
              femaleReplies.length
            )
          ];

        return message.reply(
          reply,
          (err, info) => {

            if (!err && info) {

              global.GoatBot.onReply.set(
                info.messageID,
                {
                  commandName: "baby"
                }
              );

            }

          }
        );
      }


      /* ═══════════════════════════════════════
         🎀 AUTOTEACH
      ═══════════════════════════════════════ */

      if (
        args[0]?.toLowerCase() ===
        "autoteach"
      ) {

        const mode =
          args[1]?.toLowerCase();

        if (
          !["on", "off"].includes(mode)
        ) {

          return message.reply(
            "⎯⎯”Use: baby autoteach on/off-))🎀"
          );

        }

        const status =
          mode === "on";

        await axios.post(
          `${simsim}/setting`,
          {
            autoTeach: status
          },
          {
            timeout: 10000
          }
        );

        return message.reply(
          status
            ? "⎯⎯”𝐀𝐮𝐭𝐨 𝐓𝐞𝐚𝐜𝐡 𝐎𝐍-))🟢🎀🪽"
            : "⎯⎯”𝐀𝐮𝐭𝐨 𝐓𝐞𝐚𝐜𝐡 𝐎𝐅𝐅-))🔴🎀🪽"
        );
      }


      /* ═══════════════════════════════════════
         🎀 LIST
      ═══════════════════════════════════════ */

      if (
        args[0]?.toLowerCase() ===
        "list"
      ) {

        const res =
          await axios.get(
            `${simsim}/list`,
            {
              timeout: 10000
            }
          );

        return message.reply(

`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🎀 𝐁𝐚𝐛𝐲 𝐀𝐈 𝐒𝐭𝐚𝐭𝐮𝐬
┣━━━━━━━━━━━━━━━━━━━━
┃ 📝 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧𝐬 : ${res.data.totalQuestions || 0}
┃ 💬 𝐑𝐞𝐩𝐥𝐢𝐞𝐬   : ${res.data.totalReplies || 0}
┃ 👩🏻 𝐌𝐨𝐝𝐞      : 𝐅𝐞𝐦𝐚𝐥𝐞
┣━━━━━━━━━━━━━━━━━━━━
┃ 👑 𝐎𝐰𝐧𝐞𝐫 : 𝐌𝐨𝐡𝐚𝐦𝐦𝐚𝐝 𝐌𝐚𝐫𝐮𝐟
╰━━━━━━━━━━━━━━━━━━━━╯`

        );

      }


      /* ═══════════════════════════════════════
         🎀 MSG
      ═══════════════════════════════════════ */

      if (
        args[0]?.toLowerCase() ===
        "msg"
      ) {

        const trigger =
          args
            .slice(1)
            .join(" ")
            .trim();

        if (!trigger) {

          return message.reply(
            "⎯⎯”Use: baby msg [trigger]-))🎀"
          );

        }

        const res =
          await axios.get(
            `${simsim}/simsimi-list?ask=${encodeURIComponent(trigger)}`,
            {
              timeout: 10000
            }
          );

        if (
          !res.data.replies?.length
        ) {

          return message.reply(
            "⎯⎯”এই trigger-এর কোনো reply পাওয়া যায়নি-))🥺🎀"
          );

        }

        const formatted =
          res.data.replies
            .map(
              (rep, i) =>
                `┃ ${i + 1}. ${rep}`
            )
            .join("\n");

        return message.reply(

`╭━━━━━━━━━━━━━━━━━━━━╮
┃ 🎀 𝐓𝐫𝐢𝐠𝐠𝐞𝐫 : ${trigger}
┃ 💬 𝐑𝐞𝐩𝐥𝐢𝐞𝐬 : ${res.data.total || res.data.replies.length}
┣━━━━━━━━━━━━━━━━━━━━
${formatted}
╰━━━━━━━━━━━━━━━━━━━━╯`

        );
      }


      /* ═══════════════════════════════════════
         🎀 TEACH
      ═══════════════════════════════════════ */

      if (
        args[0]?.toLowerCase() ===
        "teach"
      ) {

        const parts =
          query
            .replace(
              /^teach\s+/i,
              ""
            )
            .split(" - ");

        if (
          parts.length < 2
        ) {

          return message.reply(
            "⎯⎯”Use: baby teach question - answer-))🎀"
          );

        }

        const ask =
          parts[0].trim();

        const ans =
          parts
            .slice(1)
            .join(" - ")
            .trim();

        const res =
          await axios.get(
            `${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderName=${encodeURIComponent(senderName)}&senderID=${senderID}`,
            {
              timeout: 10000
            }
          );

        return message.reply(
          res.data.message ||
          "⎯⎯”শিখে রাখলাম বাবু-))🥰🎀🪽"
        );

      }


      /* ═══════════════════════════════════════
         🎀 EDIT
      ═══════════════════════════════════════ */

      if (
        args[0]?.toLowerCase() ===
        "edit"
      ) {

        const parts =
          query
            .replace(
              /^edit\s+/i,
              ""
            )
            .split(" - ");

        if (
          parts.length < 3
        ) {

          return message.reply(
            "⎯⎯”Use: baby edit question - old - new-))🎀"
          );

        }

        const ask =
          parts[0].trim();

        const oldReply =
          parts[1].trim();

        const newReply =
          parts
            .slice(2)
            .join(" - ")
            .trim();

        const res =
          await axios.get(
            `${simsim}/edit?ask=${encodeURIComponent(ask)}&old=${encodeURIComponent(oldReply)}&new=${encodeURIComponent(newReply)}`,
            {
              timeout: 10000
            }
          );

        return message.reply(
          res.data.message ||
          "⎯⎯”Reply টা update করে দিলাম-))🎀✨"
        );

      }


      /* ═══════════════════════════════════════
         🎀 REMOVE
      ═══════════════════════════════════════ */

      if (
        ["remove", "rm"]
          .includes(
            args[0]?.toLowerCase()
          )
      ) {

        const parts =
          query
            .replace(
              /^(remove|rm)\s+/i,
              ""
            )
            .split(" - ");

        if (
          parts.length < 2
        ) {

          return message.reply(
            "⎯⎯”Use: baby remove question - answer-))🎀"
          );

        }

        const ask =
          parts[0].trim();

        const ans =
          parts
            .slice(1)
            .join(" - ")
            .trim();

        const res =
          await axios.get(
            `${simsim}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}`,
            {
              timeout: 10000
            }
          );

        return message.reply(
          res.data.message ||
          "⎯⎯”Reply টা remove করে দিলাম-))🎀🪽"
        );

      }


      /* ═══════════════════════════════════════
         🎀 NORMAL AI CHAT
      ═══════════════════════════════════════ */

      await typing(
        api,
        threadID,
        2200
      );

      const res =
        await axios.get(
          `${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`,
          {
            timeout: 15000
          }
        );

      let replies =
        Array.isArray(
          res.data.response
        )
          ? res.data.response
          : [
              res.data.response ||
              "⎯⎯”হুম জানু-))🥺🎀🪽"
            ];


      for (
        const r of replies
      ) {

        await new Promise(
          resolve => {

            message.reply(
              `⎯⎯”${r}-))🎀🪽`,
              (err, info) => {

                if (
                  !err &&
                  info
                ) {

                  global.GoatBot.onReply.set(
                    info.messageID,
                    {
                      commandName:
                        "baby"
                    }
                  );

                }

                resolve();

              }
            );

          }
        );

      }

    } catch (err) {

      console.error(
        "Baby command error:",
        err.message
      );

      return message.reply(
        "⎯⎯”উফফ বাবু, একটু সমস্যা হয়েছে-))🥺🎀"
      );

    }

  },


  /* ═══════════════════════════════════════
     🎀 REPLY SYSTEM
  ═══════════════════════════════════════ */

  onReply: async function ({
    api,
    event,
    message,
    usersData
  }) {

    const text =
      event.body?.trim();

    if (!text) return;

    const senderName =
      await usersData.getName(
        event.senderID
      );

    try {

      await typing(
        api,
        event.threadID,
        2200
      );

      const res =
        await axios.get(
          `${simsim}/simsimi?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)}`,
          {
            timeout: 15000
          }
        );

      const replies =
        Array.isArray(
          res.data.response
        )
          ? res.data.response
          : [
              res.data.response ||
              "⎯⎯”হুম বলো জানু-))🥺🎀"
            ];


      for (
        const r of replies
      ) {

        await message.reply(
          `⎯⎯”${r}-))🎀🪽`,
          (err, info) => {

            if (
              !err &&
              info
            ) {

              global.GoatBot.onReply.set(
                info.messageID,
                {
                  commandName:
                    "baby"
                }
              );

            }

          }
        );

      }

    } catch (err) {

      console.error(
        "Baby onReply error:",
        err.message
      );

    }

  },


  /* ═══════════════════════════════════════
     🎀 AUTO CHAT
  ═══════════════════════════════════════ */

  onChat: async function ({
    api,
    event,
    message,
    usersData
  }) {

    const raw =
      event.body
        ? event.body
            .toLowerCase()
            .trim()
        : "";

    if (!raw) return;

    const senderID =
      event.senderID;

    const senderName =
      await usersData.getName(
        senderID
      );

    const threadID =
      event.threadID;


    try {

      /* ═══════════════════════════════════════
         🎀 SINGLE TRIGGERS
      ═══════════════════════════════════════ */

      const triggers = [
        "baby",
        "bby",
        "oi",
        "xan",
        "bbz",
        "maruf",
        "মারুফ",
        "kolixa",
        "bot"
      ];


      if (
        triggers.includes(raw)
      ) {

        await typing(
          api,
          threadID,
          3500
        );

        const reply =
          femaleReplies[
            Math.floor(
              Math.random() *
              femaleReplies.length
            )
          ];

        return message.reply(
          reply,
          (err, info) => {

            if (
              !err &&
              info
            ) {

              global.GoatBot.onReply.set(
                info.messageID,
                {
                  commandName:
                    "baby"
                }
              );

            }

          }
        );

      }


      /* ═══════════════════════════════════════
         🎀 PREFIX CHAT
      ═══════════════════════════════════════ */

      const prefixes = [
        "baby ",
        "bby ",
        "xan ",
        "bbz ",
        "maruf ",
        "মারুফ ",
        "kolixa ",
        "bot "
      ];


      const prefix =
        prefixes.find(
          p => raw.startsWith(p)
        );


      if (prefix) {

        const q =
          raw
            .slice(prefix.length)
            .trim();

        if (!q) return;

        await typing(
          api,
          threadID,
          2200
        );

        const res =
          await axios.get(
            `${simsim}/simsimi?text=${encodeURIComponent(q)}&senderName=${encodeURIComponent(senderName)}`,
            {
              timeout: 15000
            }
          );

        const replies =
          Array.isArray(
            res.data.response
          )
            ? res.data.response
            : [
                res.data.response ||
                "⎯⎯”হুম জানু-))🥺🎀🪽"
              ];


        for (
          const r of replies
        ) {

          await message.reply(
            `⎯⎯”${r}-))🎀🪽`,
            (err, info) => {

              if (
                !err &&
                info
              ) {

                global.GoatBot.onReply.set(
                  info.messageID,
                  {
                    commandName:
                      "baby"
                  }
                );

              }

            }
          );

        }

        return;

      }


      /* ═══════════════════════════════════════
         🎀 AUTO TEACH
      ═══════════════════════════════════════ */

      if (
        event.messageReply
      ) {

        try {

          const setting =
            await axios.get(
              `${simsim}/setting`,
              {
                timeout: 8000
              }
            );

          if (
            setting.data?.autoTeach
          ) {

            const ask =
              event.messageReply.body
                ?.toLowerCase()
                .trim();

            const ans =
              raw.trim();

            if (
              ask &&
              ans &&
              ask !== ans
            ) {

              setTimeout(
                async () => {

                  try {

                    await axios.get(
                      `${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderName=${encodeURIComponent(senderName)}&senderID=${senderID}`,
                      {
                        timeout: 10000
                      }
                    );

                  } catch {}

                },
                500
              );

            }

          }

        } catch {}

      }

    } catch (err) {

      console.error(
        "Baby onChat error:",
        err.message
      );

    }

  }

};