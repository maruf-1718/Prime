const fs = require("fs");
const { downloadVideo } = require("sagor-video-downloader");

module.exports = {
  config: {
    name: "download",
    aliases: ["d"],
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 3,
    role: 0,

    shortDescription: {
      en: "Download video from link"
    },

    longDescription: {
      en: "Download video from a link or by replying to a link"
    },

    category: "media",

    guide: {
      en:
        "{pn} <link>\n" +
        "Reply to a link with: {pn}"
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
     EXTRACT URL FROM TEXT
  ===================================================== */

  extractUrl: function (text) {
    if (!text) {
      return null;
    }

    const matches = String(text).match(
      /https?:\/\/[^\s<>"']+/gi
    );

    if (!matches || !matches.length) {
      return null;
    }

    return matches[0]
      .trim()
      .replace(/^[<("'`\[]+/, "")
      .replace(/[>),.!?;:'"`\]]+$/g, "");
  },

  /* =====================================================
     FIND URL DEEPLY
     
     Reply message-এর বিভিন্ন field থেকে
     URL খুঁজে বের করবে।
  ===================================================== */

  findUrlDeep: function (
    data,
    visited = new Set(),
    depth = 0
  ) {
    if (
      data === null ||
      data === undefined ||
      depth > 7
    ) {
      return null;
    }

    /* String */

    if (
      typeof data === "string"
    ) {
      return this.extractUrl(data);
    }

    /* Object protection */

    if (
      typeof data === "object"
    ) {
      if (visited.has(data)) {
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

      /* Priority URL fields */

      const priorityKeys = [
        "url",
        "href",
        "link",
        "uri",
        "permalink",
        "permalink_url",
        "shareUrl",
        "shareURL",
        "source",
        "targetUrl",
        "targetURL",
        "webUrl",
        "webURL",
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

      /* Common text fields */

      const textKeys = [
        "body",
        "message",
        "text",
        "caption",
        "description"
      ];

      for (
        const key of textKeys
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

      /* Other fields */

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
     GET URL FROM REPLY
  ===================================================== */

  getReplyUrl: function (event) {
    if (!event.messageReply) {
      return null;
    }

    return this.findUrlDeep(
      event.messageReply
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

    /* Prevent duplicate processing */

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
      "🔰"
    );

    try {

      /* =================================================
         DOWNLOAD
      ================================================= */

      const result =
        await downloadVideo(
          url
        );

      if (
        !result ||
        !result.filePath ||
        !fs.existsSync(
          result.filePath
        )
      ) {
        throw new Error(
          "Downloaded file not found"
        );
      }

      filePath =
        result.filePath;

      /* =================================================
         SEND FILE
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

      /* Success */

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
        "⚠️"
      );

    } finally {

      /* Delete temporary file */

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

      this.processing.delete(
        processID
      );
    }
  },

  /* =====================================================
     PREFIX COMMAND SUPPORT
     
     /download <link>
     /d <link>
     
     Prefix থাকলেও কাজ করবে।
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

    const url =
      this.extractUrl(
        input
      );

    if (!url) {

      await this.setReaction(
        api,
        event.messageID,
        "⚠️"
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
     PREFIXLESS SYSTEM
     
     download <link>
     d <link>
     
     Reply + download
     Reply + d
  ===================================================== */

  onChat: async function ({
    api,
    event
  }) {

    const body =
      String(
        event.body || ""
      )
      .trim();

    if (!body) {
      return;
    }

    const lower =
      body.toLowerCase();

    /* =================================================
       DIRECT:
       download <link>
       d <link>
    ================================================= */

    const directMatch =
      body.match(
        /^(download|d)\s+(https?:\/\/\S+)$/i
      );

    if (directMatch) {

      const url =
        this.extractUrl(
          directMatch[2]
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

    /* =================================================
       REPLY:
       download
       d
    ================================================= */

    if (
      lower !== "download" &&
      lower !== "d"
    ) {
      return;
    }

    /* Must be a reply */

    if (
      !event.messageReply
    ) {
      return;
    }

    /* Find URL from replied message */

    const url =
      this.getReplyUrl(
        event
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
};