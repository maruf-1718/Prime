const fs = require("fs");
const { downloadVideo } = require("sagor-video-downloader");

module.exports = {
  config: {
    name: "download",
    version: "3.0",
    author: "Mohammad Maruf",
    countDown: 5,
    role: 0,

    shortDescription: {
      en: "Download Facebook & TikTok videos"
    },

    longDescription: {
      en: "Download Facebook and TikTok videos by link or reply"
    },

    category: "media",

    guide: {
      en:
        "{pn} <Facebook/TikTok link>\n" +
        "Reply to a Facebook/TikTok link with: download"
    }
  },

  /* =====================================================
     REACTION
  ===================================================== */

  setReaction: async function (api, messageID, emoji) {
    try {
      await new Promise((resolve) => {
        api.setMessageReaction(
          emoji,
          messageID,
          () => resolve(),
          true
        );
      });
    } catch {}
  },

  /* =====================================================
     CHECK FACEBOOK / TIKTOK
  ===================================================== */

  isSupportedUrl: function (url) {
    try {
      const parsed = new URL(url);

      const hostname =
        parsed.hostname
          .toLowerCase()
          .replace(/^www\./, "");

      const facebook =
        hostname === "facebook.com" ||
        hostname.endsWith(".facebook.com") ||
        hostname === "fb.watch";

      const tiktok =
        hostname === "tiktok.com" ||
        hostname.endsWith(".tiktok.com");

      return facebook || tiktok;

    } catch {
      return false;
    }
  },

  /* =====================================================
     EXTRACT URL
  ===================================================== */

  extractUrl: function (text) {
    if (!text) return null;

    const matches =
      text.match(/https?:\/\/[^\s]+/gi);

    if (!matches) return null;

    for (const rawUrl of matches) {

      /*
       * Messenger message-এর শেষে punctuation থাকলে
       * সেটা URL থেকে বাদ দেওয়া হবে।
       */

      const cleanUrl =
        rawUrl.replace(/[),.!?]+$/g, "");

      if (
        this.isSupportedUrl(cleanUrl)
      ) {
        return cleanUrl;
      }
    }

    return null;
  },

  /* =====================================================
     DOWNLOAD VIDEO
  ===================================================== */

  downloadAndSend: async function ({
    api,
    event,
    url
  }) {

    let filePath = null;

    await this.setReaction(
      api,
      event.messageID,
      "⌛"
    );

    try {

      /* =================================================
         DOWNLOAD
      ================================================= */

      const result =
        await downloadVideo(url);

      if (
        !result ||
        !result.filePath ||
        !fs.existsSync(result.filePath)
      ) {
        throw new Error(
          "Video file not found"
        );
      }

      filePath =
        result.filePath;

      /* =================================================
         25 MB CHECK
      ================================================= */

      const stats =
        fs.statSync(filePath);

      const sizeMB =
        stats.size /
        (1024 * 1024);

      if (sizeMB > 25) {

        await this.setReaction(
          api,
          event.messageID,
          "❌"
        );

        try {
          fs.unlinkSync(filePath);
        } catch {}

        return;
      }

      /* =================================================
         SEND VIDEO
      ================================================= */

      await new Promise(
        (resolve, reject) => {

          api.sendMessage(
            {
              attachment:
                fs.createReadStream(
                  filePath
                )
            },

            event.threadID,

            (err) => {

              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        }
      );

      /* =================================================
         SUCCESS
      ================================================= */

      await this.setReaction(
        api,
        event.messageID,
        "🪽"
      );

    } catch (error) {

      console.error(
        "[DOWNLOAD ERROR]",
        error.message
      );

      await this.setReaction(
        api,
        event.messageID,
        "❌"
      );

    } finally {

      /* =================================================
         DELETE TEMP FILE
      ================================================= */

      if (
        filePath &&
        fs.existsSync(filePath)
      ) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }
  },

  /* =====================================================
     NORMAL COMMAND
     
     /download <link>
  ===================================================== */

  onStart: async function ({
    api,
    event,
    args
  }) {

    const input =
      args.join(" ").trim();

    if (!input) {
      await this.setReaction(
        api,
        event.messageID,
        "❌"
      );
      return;
    }

    const url =
      this.extractUrl(input);

    if (!url) {
      await this.setReaction(
        api,
        event.messageID,
        "❌"
      );
      return;
    }

    return this.downloadAndSend({
      api,
      event,
      url
    });
  },

  /* =====================================================
     REPLY SYSTEM
     
     Reply to Facebook/TikTok link:
     
     download
  ===================================================== */

  onChat: async function ({
    api,
    event
  }) {

    const body =
      (event.body || "").trim();

    /*
     * শুধু "download" হলে কাজ করবে।
     */

    if (
      body.toLowerCase() !==
      "download"
    ) {
      return;
    }

    /*
     * Reply information দরকার।
     */

    const reply =
      event.messageReply;

    if (!reply) {
      return;
    }

    /*
     * Reply করা message-এর text
     */

    let replyText =
      reply.body || "";

    /*
     * কিছু Messenger message-এ
     * body না থাকলেও URL থাকতে পারে।
     */

    const url =
      this.extractUrl(replyText);

    /*
     * Supported URL না হলে silent থাকবে।
     */

    if (!url) {
      return;
    }

    return this.downloadAndSend({
      api,
      event,
      url
    });
  }
};