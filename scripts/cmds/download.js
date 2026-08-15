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
      en: "Download Facebook and TikTok videos from links or replied posts"
    },

    category: "media",

    guide: {
      en:
        "{pn} <Facebook/TikTok link>\n" +
        "Reply to a Facebook/TikTok Reel with: download"
    }
  },

  /* =====================================================
     PROCESS LOCK
  ===================================================== */

  processing: new Set(),

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
      const parsed = new URL(url);

      const hostname =
        parsed.hostname
          .toLowerCase()
          .replace(/^www\./, "");

      return (
        hostname === "facebook.com" ||
        hostname.endsWith(".facebook.com") ||
        hostname === "fb.watch" ||
        hostname === "tiktok.com" ||
        hostname.endsWith(".tiktok.com")
      );

    } catch {
      return false;
    }
  },

  /* =====================================================
     CLEAN URL
  ===================================================== */

  cleanUrl: function (url) {
    if (!url) return null;

    return String(url)
      .trim()
      .replace(
        /^[<("'`\[]+/,
        ""
      )
      .replace(
        /[>),.!?;:'"`\]]+$/g,
        ""
      );
  },

  /* =====================================================
     FIND URL FROM TEXT
  ===================================================== */

  extractUrlFromText: function (text) {
    if (!text) return null;

    const matches =
      String(text).match(
        /https?:\/\/[^\s<>"']+/gi
      );

    if (!matches) {
      return null;
    }

    for (const raw of matches) {
      const url =
        this.cleanUrl(raw);

      if (
        url &&
        this.isSupportedUrl(url)
      ) {
        return url;
      }
    }

    return null;
  },

  /* =====================================================
     DEEP URL FINDER
     
     Facebook shared Reel/Post-এর information
     nested object-এ থাকলেও খুঁজবে।
  ===================================================== */

  findUrlDeep: function (
    data,
    visited = new Set(),
    depth = 0
  ) {

    if (
      data === null ||
      data === undefined ||
      depth > 8
    ) {
      return null;
    }

    /* String */

    if (
      typeof data === "string"
    ) {

      return this.extractUrlFromText(
        data
      );
    }

    /* Prevent circular object */

    if (
      typeof data === "object"
    ) {

      if (
        visited.has(data)
      ) {
        return null;
      }

      visited.add(data);
    }

    /* Array */

    if (
      Array.isArray(data)
    ) {

      for (
        const item of data
      ) {

        const found =
          this.findUrlDeep(
            item,
            visited,
            depth + 1
          );

        if (found) {
          return found;
        }
      }

      return null;
    }

    /* Object */

    if (
      typeof data === "object"
    ) {

      /*
       * URL-related fields আগে check করা হচ্ছে
       */

      const priorityKeys = [
        "url",
        "href",
        "link",
        "uri",
        "source",
        "targetUrl",
        "targetURL",
        "webUrl",
        "webURL",
        "permalink",
        "permalink_url",
        "shareUrl",
        "shareURL",
        "originalUrl",
        "originalURL"
      ];

      for (
        const key of priorityKeys
      ) {

        if (
          Object.prototype.hasOwnProperty.call(
            data,
            key
          )
        ) {

          const found =
            this.findUrlDeep(
              data[key],
              visited,
              depth + 1
            );

          if (found) {
            return found;
          }
        }
      }

      /*
       * এরপর পুরো object scan
       */

      for (
        const [key, value]
        of Object.entries(data)
      ) {

        /*
         * body/message/text-এ URL থাকলে
         */

        if (
          key === "body" ||
          key === "message" ||
          key === "text" ||
          key === "caption" ||
          key === "description"
        ) {

          const found =
            this.findUrlDeep(
              value,
              visited,
              depth + 1
            );

          if (found) {
            return found;
          }
        }
      }

      /*
       * শেষ ধাপে অন্যান্য fields
       */

      for (
        const value
        of Object.values(data)
      ) {

        const found =
          this.findUrlDeep(
            value,
            visited,
            depth + 1
          );

        if (found) {
          return found;
        }
      }
    }

    return null;
  },

  /* =====================================================
     GET URL FROM REPLIED MESSAGE
  ===================================================== */

  getReplyUrl: function (
    event
  ) {

    const reply =
      event.messageReply;

    if (!reply) {
      return null;
    }

    /*
     * পুরো reply object scan
     */

    return this.findUrlDeep(
      reply
    );
  },

  /* =====================================================
     DOWNLOAD + SEND
  ===================================================== */

  downloadAndSend: async function ({
    api,
    event,
    url
  }) {

    const processID =
      String(event.messageID);

    /*
     * একই event দ্বিতীয়বার এলে stop
     */

    if (
      this.processing.has(
        processID
      )
    ) {
      return;
    }

    this.processing.add(
      processID
    );

    let filePath = null;

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
         25 MB CHECK
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

          const stream =
            fs.createReadStream(
              filePath
            );

          stream.on(
            "error",
            reject
          );

          api.sendMessage(
            {
              attachment:
                stream
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
        "[DOWNLOAD ERROR]",
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

      /*
       * Lock remove
       */

      this.processing.delete(
        processID
      );
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

    if (!input) {

      await this.setReaction(
        api,
        event.messageID,
        "❌"
      );

      return;
    }

    const url =
      this.extractUrlFromText(
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
     
     ONLY REPLY PROCESSING
     
     কোনো onReply নেই, তাই duplicate হবে না।
  ===================================================== */

  onChat: async function ({
    api,
    event
  }) {

    const body =
      String(
        event.body || ""
      )
      .trim()
      .toLowerCase();

    /*
     * শুধু "download" হলে reply check করবে।
     */

    if (
      body !== "download"
    ) {
      return;
    }

    /*
     * কোনো reply নেই
     */

    if (
      !event.messageReply
    ) {
      return;
    }

    /*
     * Original Reel/Post থেকে URL বের করা
     */

    const url =
      this.getReplyUrl(
        event
      );

    /*
     * URL না পাওয়া গেলে silent
     */

    if (!url) {
      return;
    }

    /*
     * Safety check
     */

    if (
      !this.isSupportedUrl(
        url
      )
    ) {
      return;
    }

    /*
     * Download
     */

    return this.downloadAndSend({
      api,
      event,
      url
    });
  }
};