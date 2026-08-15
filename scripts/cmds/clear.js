module.exports = {
  config: {
    name: "clear",
    aliases: [],
    author: "Mohammad Maruf",
    version: "1.0.0",
    countDown: 5,
    role: 0,

    shortDescription: {
      en: "Clear bot messages"
    },

    longDescription: {
      en: "Unsend bot messages while keeping the latest 20 messages"
    },

    category: "owner",

    guide: {
      en: "{p}clear\n{p}clear all"
    }
  },

  onStart: async function ({ api, event, args }) {

    const threadID = event.threadID;
    const messageID = event.messageID;
    const botID = String(api.getCurrentUserID());

    /* =========================
       REACTION HELPER
    ========================= */

    const react = async emoji => {
      try {
        await api.setMessageReaction(
          emoji,
          messageID,
          () => {},
          true
        );
      } catch (_) {
        // Reaction unsupported হলেও command চলবে
      }
    };

    /* =========================
       LOADING
    ========================= */

    await react("⏳");

    try {

      /* =========================
         GET HISTORY
      ========================= */

      const messages = await api.getThreadHistory(
        threadID,
        100
      );

      if (
        !Array.isArray(messages) ||
        messages.length === 0
      ) {
        await react("✅");
        return;
      }

      /* =========================
         CHECK CLEAR ALL
      ========================= */

      const isAll =
        String(args[0] || "").toLowerCase() === "all";

      let targetMessages = [];

      if (isAll) {

        /*
         * clear all
         * History থেকে পাওয়া
         * সব Bot message
         */
        targetMessages = messages.filter(
          msg =>
            String(msg.senderID) === botID &&
            msg.messageID
        );

      } else {

        /*
         * clear
         *
         * Latest 20 message রেখে
         * তার আগের messageগুলো নেওয়া
         */
        const oldMessages = messages.slice(20);

        /*
         * শুধু Bot-এর message
         */
        targetMessages = oldMessages.filter(
          msg =>
            String(msg.senderID) === botID &&
            msg.messageID
        );
      }

      /* =========================
         NOTHING TO CLEAR
      ========================= */

      if (targetMessages.length === 0) {
        await react("✅");
        return;
      }

      /* =========================
         UNSEND
      ========================= */

      let success = 0;
      let failed = 0;

      for (const msg of targetMessages) {

        try {

          await api.unsendMessage(
            msg.messageID
          );

          success++;

          /*
           * API rate-limit কমানোর জন্য
           * ছোট delay
           */
          await new Promise(
            resolve => setTimeout(resolve, 150)
          );

        } catch (err) {

          failed++;

          console.error(
            `[CLEAR] Failed ${msg.messageID}:`,
            err?.message || err
          );
        }
      }

      /* =========================
         FINAL REACTION
      ========================= */

      if (success > 0 && failed === 0) {

        // সব সফল
        await react("✅");

      } else if (success > 0 && failed > 0) {

        // কিছু হয়েছে, কিছু হয়নি
        await react("⚠️");

      } else {

        // কিছুই unsend হয়নি
        await react("❌");
      }

    } catch (err) {

      console.error(
        "[CLEAR] ERROR:",
        err?.message || err
      );

      /*
       * কোনো error message পাঠাবে না
       */
      await react("❌");

      return;
    }
  }
};