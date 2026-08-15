const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "youtubed",
    aliases: ["yd"],
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 5,
    role: 0,

    shortDescription: {
      en: "Download media from direct link"
    },

    longDescription: {
      en: "Download an authorized direct media URL"
    },

    category: "media",

    guide: {
      en:
        "{pn} <direct media link>\n" +
        "Reply to a direct media link with: youtubed"
    }
  },

  processing: new Set(),

  setReaction: async function (api, messageID, emoji) {
    try {
      await new Promise(resolve => {
        api.setMessageReaction(
          emoji,
          messageID,
          () => resolve(),
          true
        );
      });
    } catch {}
  },

  extractUrl: function (text) {
    if (!text) return null;

    const matches =
      String(text).match(/https?:\/\/[^\s<>"']+/gi);

    if (!matches) return null;

    return matches[0]
      .replace(/[),.!?;:'"`\]]+$/g, "");
  },

  downloadAndSend: async function ({
    api,
    event,
    url
  }) {
    const processID =
      String(event.messageID);

    if (this.processing.has(processID)) {
      return;
    }

    this.processing.add(processID);

    let filePath = null;

    await this.setReaction(
      api,
      event.messageID,
      "⌛"
    );

    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 120000,
        maxRedirects: 5
      });

      const contentType =
        String(
          response.headers["content-type"] || ""
        ).toLowerCase();

      /*
       * শুধুমাত্র media/file response গ্রহণ করবে।
       */
      if (
        !(
          contentType.startsWith("video/") ||
          contentType.startsWith("audio/")
        )
      ) {
        throw new Error(
          "URL is not a direct media file"
        );
      }

      let ext = ".mp4";

      if (contentType.includes("webm")) {
        ext = ".webm";
      } else if (contentType.includes("mov")) {
        ext = ".mov";
      } else if (contentType.includes("mkv")) {
        ext = ".mkv";
      } else if (contentType.includes("mp3")) {
        ext = ".mp3";
      } else if (contentType.includes("mpeg")) {
        ext = ".mp3";
      }

      filePath = path.join(
        __dirname,
        `youtubed_${Date.now()}${ext}`
      );

      fs.writeFileSync(
        filePath,
        Buffer.from(response.data)
      );

      await new Promise((resolve, reject) => {
        api.sendMessage(
          {
            attachment:
              fs.createReadStream(filePath)
          },
          event.threadID,
          error => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          }
        );
      });

      await this.setReaction(
        api,
        event.messageID,
        "🪽"
      );

    } catch (error) {
      console.error(
        "[YOUTUBED ERROR]",
        error.message
      );

      await this.setReaction(
        api,
        event.messageID,
        "❌"
      );

    } finally {
      if (
        filePath &&
        fs.existsSync(filePath)
      ) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }

      this.processing.delete(
        processID
      );
    }
  },

  /* =====================================================
     youtubed <link>
     yd <link>
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
     Reply to direct media link
     
     Reply:
     youtubed
     অথবা
     yd
  ===================================================== */

  onChat: async function ({
    api,
    event
  }) {
    const body =
      String(event.body || "")
        .trim()
        .toLowerCase();

    if (
      body !== "youtubed" &&
      body !== "yd"
    ) {
      return;
    }

    if (!event.messageReply) {
      return;
    }

    const replyText =
      event.messageReply.body || "";

    const url =
      this.extractUrl(replyText);

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