const fs = require("fs");
const { downloadVideo } = require("sagor-video-downloader");

module.exports = {
  config: {
    name: "download",
    version: "2.1",
    author: "Mohammad Maruf",
    countDown: 5,
    role: 0,

    shortDescription: {
      en: "Download Facebook & TikTok videos"
    },

    longDescription: {
      en: "Download videos only from Facebook and TikTok"
    },

    category: "media",

    guide: {
      en: "{pn} <Facebook/TikTok link>"
    }
  },

  onStart: async function ({
    api,
    event,
    args
  }) {

    const url = args[0];

    /* =====================================================
       LOADING REACTION
    ===================================================== */

    const react = (emoji) => {
      return new Promise((resolve) => {
        api.setMessageReaction(
          emoji,
          event.messageID,
          () => resolve(),
          true
        );
      });
    };

    await react("⌛");

    /* =====================================================
       URL CHECK
    ===================================================== */

    if (!url) {
      await react("❌");
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      await react("❌");
      return;
    }

    const hostname =
      parsedUrl.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    /* =====================================================
       FACEBOOK
    ===================================================== */

    const isFacebook =
      hostname === "facebook.com" ||
      hostname.endsWith(".facebook.com") ||
      hostname === "fb.watch";

    /* =====================================================
       TIKTOK
    ===================================================== */

    const isTikTok =
      hostname === "tiktok.com" ||
      hostname.endsWith(".tiktok.com");

    /* =====================================================
       ONLY FACEBOOK + TIKTOK
    ===================================================== */

    if (!isFacebook && !isTikTok) {
      await react("❌");
      return;
    }

    let filePath = null;

    try {

      /* ===================================================
         DOWNLOAD
      =================================================== */

      const result =
        await downloadVideo(url);

      if (
        !result ||
        !result.filePath ||
        !fs.existsSync(result.filePath)
      ) {
        throw new Error(
          "Download failed"
        );
      }

      filePath =
        result.filePath;

      /* ===================================================
         FILE SIZE CHECK
      =================================================== */

      const stats =
        fs.statSync(filePath);

      const fileSizeMB =
        stats.size /
        (1024 * 1024);

      if (fileSizeMB > 25) {

        try {
          fs.unlinkSync(filePath);
        } catch {}

        await react("❌");
        return;
      }

      /* ===================================================
         SEND VIDEO
      =================================================== */

      await new Promise((resolve, reject) => {

        api.sendMessage(
          {
            attachment:
              fs.createReadStream(filePath)
          },

          event.threadID,

          (err) => {

            if (err) {
              reject(err);
              return;
            }

            resolve();
          }
        );
      });

      /* ===================================================
         SUCCESS
      =================================================== */

      await react("🪽");

    } catch (error) {

      console.error(
        "[DOWNLOAD]",
        error.message
      );

      await react("❌");

    } finally {

      /* ===================================================
         DELETE TEMP FILE
      =================================================== */

      if (
        filePath &&
        fs.existsSync(filePath)
      ) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }
  }
};