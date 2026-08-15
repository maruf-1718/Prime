const fs = require("fs");
const { downloadVideo } = require("sagor-video-downloader");

module.exports = {

  config: {
    name: "download",
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 5,
    role: 0,

    shortDescription: {
      en: "Download Facebook & TikTok videos"
    },

    longDescription: {
      en: "Download Facebook and TikTok videos by direct link or reply"
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

  setReaction: async function (
    api,
    messageID,
    emoji
  ) {
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
     FACEBOOK / TIKTOK CHECK
  ===================================================== */

  isSupportedUrl: function (url) {

    try {

      const parsed =
        new URL(url);

      const hostname =
        parsed.hostname
          .toLowerCase()
          .replace(/^www\./, "");

      /*
       * Facebook
       */

      const isFacebook =
        hostname === "facebook.com" ||
        hostname.endsWith(".facebook.com") ||
        hostname === "fb.watch";

      /*
       * TikTok
       */

      const isTikTok =
        hostname === "tiktok.com" ||
        hostname.endsWith(".tiktok.com");

      return (
        isFacebook ||
        isTikTok
      );

    } catch {

      return false;

    }
  },

  /* =====================================================
     EXTRACT FACEBOOK / TIKTOK URL
  ===================================================== */

  extractUrl: function (text) {

    if (!text) {
      return null;
    }

    const matches =
      text.match(
        /https?:\/\/[^\s]+/gi
      );

    if (!matches) {
      return null;
    }

    for (
      const rawUrl of matches
    ) {

      /*
       * URL-এর শেষে থাকা punctuation remove
       */

      const cleanUrl =
        rawUrl
          .replace(
            /[),.!?]+$/g,
            ""
          );

      /*
       * Facebook / TikTok হলে
       * সরাসরি return
       */

      if (
        this.isSupportedUrl(
          cleanUrl
        )
      ) {

        return cleanUrl;

      }
    }

    return null;
  },

  /* =====================================================
     DOWNLOAD + SEND
  ===================================================== */

  downloadAndSend: async function ({
    api,
    event,
    url
  }) {

    let filePath = null;

    /*
     * Download শুরু
     */

    await this.setReaction(
      api,
      event.messageID,
      "⌛"
    );

    try {

      /* ================================================
         DOWNLOAD
      ================================================= */

      const result =
        await downloadVideo(url);

      if (
        !result ||
        !result.filePath ||
        !fs.existsSync(
          result.filePath
        )
      ) {

        throw new Error(
          "Video file not found"
        );

      }

      filePath =
        result.filePath;

      /* ================================================
         25 MB LIMIT
      ================================================= */

      const stats =
        fs.statSync(
          filePath
        );

      const sizeMB =
        stats.size /
        (1024 * 1024);

      if (
        sizeMB > 25
      ) {

        await this.setReaction(
          api,
          event.messageID,
          "❌"
        );

        return;
      }

      /* ================================================
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

            (error) => {

              if (error) {
                reject(error);
              } else {
                resolve();
              }

            }
          );

        }
      );

      /* ================================================
         SUCCESS
      ================================================= */

      await this.setReaction(
        api,
        event.messageID,
        "🪽"
      );

    } catch (error) {

      console.error(
        "[DOWNLOAD]",
        error.message
      );

      await this.setReaction(
        api,
        event.messageID,
        "❌"
      );

    } finally {

      /*
       * Temporary file delete
       */

      if (
        filePath &&
        fs.existsSync(
          filePath
        )
      ) {

        try {
          fs.unlinkSync(
            filePath
          );
        } catch {}

      }
    }
  },

  /* =====================================================
     DIRECT COMMAND
     
     /download <link>
  ===================================================== */

  onStart: async function ({
    api,
    event,
    args
  }) {

    const input =
      args
        .join(" ")
        .trim();

    /*
     * Link নেই
     */

    if (!input) {

      await this.setReaction(
        api,
        event.messageID,
        "❌"
      );

      return;
    }

    /*
     * একই URL extractor
     * reply এবং direct দুই জায়গাতেই
     */

    const url =
      this.extractUrl(
        input
      );

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
     ON CHAT
     
     Facebook/TikTok link দেখলে
     সেই message-এর জন্য reply listener
     তৈরি করা হবে।
  ===================================================== */

  onChat: async function ({
    api,
    event
  }) {

    const body =
      (
        event.body || ""
      ).trim();

    /*
     * ---------------------------------------------------
     * CASE 1
     * 
     * কেউ সরাসরি "download" লিখেছে
     * এবং কোনো message reply করেছে।
     * ---------------------------------------------------
     */

    if (
      body.toLowerCase() ===
      "download"
    ) {

      const repliedMessage =
        event.messageReply;

      if (
        !repliedMessage
      ) {
        return;
      }

      const replyText =
        repliedMessage.body ||
        "";

      /*
       * Original message থেকে
       * একই extractor ব্যবহার
       */

      const url =
        this.extractUrl(
          replyText
        );

      if (!url) {
        return;
      }

      return this.downloadAndSend({
        api,
        event,
        url
      });
    }

    /*
     * ---------------------------------------------------
     * CASE 2
     *
     * Message-এর মধ্যে Facebook/TikTok link আছে।
     *
     * এটাকে reply করার পর:
     *
     * download
     *
     * লিখলে onChat সেটা ধরবে।
     * ---------------------------------------------------
     */

    const url =
      this.extractUrl(
        body
      );

    if (!url) {
      return;
    }

    /*
     * Link message-এ reply data save
     */

    try {

      /*
       * GoatBot reply system
       *
       * Link message-এর ID-তে
       * download command-এর information রাখা হচ্ছে।
       */

      global.GoatBot.onReply.set(
        event.messageID,
        {
          commandName:
            "download",

          type:
            "downloadVideo",

          url:
            url
        }
      );

    } catch (error) {

      console.error(
        "[DOWNLOAD REPLY SET]",
        error.message
      );

    }
  },

  /* =====================================================
     ON REPLY
     
     Facebook/TikTok link message-এ
     reply করে "download"
  ===================================================== */

  onReply: async function ({
    api,
    event,
    Reply
  }) {

    if (!Reply) {
      return;
    }

    /*
     * শুধু download reply
     */

    const body =
      (
        event.body || ""
      )
      .trim()
      .toLowerCase();

    if (
      body !==
      "download"
    ) {
      return;
    }

    /*
     * অন্য command-এর reply হলে
     * কিছু করবে না
     */

    if (
      Reply.commandName !==
      "download"
    ) {
      return;
    }

    if (
      Reply.type !==
      "downloadVideo"
    ) {
      return;
    }

    /*
     * আগে থেকেই extracted URL
     */

    const url =
      Reply.url;

    if (
      !url ||
      !this.isSupportedUrl(
        url
      )
    ) {
      return;
    }

    /*
     * Download শুরু
     */

    return this.downloadAndSend({
      api,
      event,
      url
    });
  }
};