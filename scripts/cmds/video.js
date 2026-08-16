const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");

const API_CONFIG =
  "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

const CACHE_DIR =
  path.join(__dirname, "video_cache");

module.exports = {
  config: {
    name: "video",
    aliases: ["v"],
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 5,
    role: 0,

    shortDescription: {
      en: "Search and download YouTube videos"
    },

    longDescription: {
      en: "Search YouTube and reply with a number to download a selected video."
    },

    category: "media",

    guide: {
      en: "{pn} <video name>"
    }
  },

  /* =====================================================
     START
  ===================================================== */

  onStart: async function ({
    api,
    event,
    args
  }) {

    const query =
      args.join(" ").trim();

    if (!query) {
      return api.sendMessage(
        "❌ Video name dao.",
        event.threadID,
        event.messageID
      );
    }

    try {

      /* ===============================================
         SEARCH YOUTUBE
      =============================================== */

      const search =
        await ytSearch(query);

      if (
        !search ||
        !Array.isArray(search.videos) ||
        !search.videos.length
      ) {
        return api.sendMessage(
          "❌ Kono video paoa jayni.",
          event.threadID,
          event.messageID
        );
      }

      const videos =
        search.videos.slice(0, 6);

      let body =
        "🔎 YouTube Results\n\n";

      const attachments = [];

      for (
        let i = 0;
        i < videos.length;
        i++
      ) {

        const video =
          videos[i];

        body +=
          `${i + 1}. ${video.title}\n` +
          `⏱️ ${video.timestamp || "N/A"}\n` +
          `👤 ${video.author?.name || "Unknown"}\n` +
          `👁️ ${(video.views || 0).toLocaleString()}\n\n`;

        /* -------------------------------------------
           Thumbnail download
        ------------------------------------------- */

        try {

          const image =
            await axios.get(
              video.thumbnail,
              {
                responseType: "stream",
                timeout: 20000
              }
            );

          attachments.push(
            image.data
          );

        } catch {
          /* Thumbnail fail হলেও search চলবে */
        }
      }

      body +=
        `📥 Reply 1-${videos.length} to download`;

      /* ===============================================
         SEND RESULT
      =============================================== */

      api.sendMessage(
        {
          body,
          attachment:
            attachments.length
              ? attachments
              : undefined
        },

        event.threadID,

        (error, info) => {

          if (error || !info) {
            return;
          }

          global.GoatBot.onReply.set(
            info.messageID,
            {
              commandName:
                this.config.name,

              author:
                event.senderID,

              videos,

              listMessageID:
                info.messageID
            }
          );
        }
      );

    } catch (error) {

      console.error(
        "[VIDEO SEARCH ERROR]",
        error.message
      );

      return api.sendMessage(
        "❌ YouTube search failed.",
        event.threadID,
        event.messageID
      );
    }
  },

  /* =====================================================
     REPLY
  ===================================================== */

  onReply: async function ({
    api,
    event,
    Reply
  }) {

    /* ===============================================
       ONLY ORIGINAL USER
    =============================================== */

    if (
      event.senderID !==
      Reply.author
    ) {
      return;
    }

    const choice =
      parseInt(
        String(
          event.body || ""
        ).trim()
      );

    if (
      isNaN(choice) ||
      choice < 1 ||
      choice > Reply.videos.length
    ) {

      return api.sendMessage(
        `❌ 1-${Reply.videos.length} এর মধ্যে একটি number দাও।`,
        event.threadID,
        event.messageID
      );
    }

    /* ===============================================
       REMOVE RESULT MESSAGE
    =============================================== */

    if (
      Reply.listMessageID
    ) {

      try {
        await api.unsendMessage(
          Reply.listMessageID
        );
      } catch {}
    }

    try {
      global.GoatBot.onReply.delete(
        event.messageReply?.messageID
      );
    } catch {}

    const video =
      Reply.videos[
        choice - 1
      ];

    const videoUrl =
      video.url;

    /* ===============================================
       CREATE CACHE
    =============================================== */

    await fs.ensureDir(
      CACHE_DIR
    );

    const safeName =
      String(
        video.title || "youtube_video"
      )
        .replace(
          /[\/\\:*?"<>|]/g,
          ""
        )
        .replace(
          /\s+/g,
          "_"
        )
        .slice(0, 80);

    const filePath =
      path.join(
        CACHE_DIR,
        `${Date.now()}_${safeName}.mp4`
      );

    try {

      /* =============================================
         GET DOWNLOAD API
      ============================================= */

      const configResponse =
        await axios.get(
          API_CONFIG,
          {
            timeout: 30000
          }
        );

      const apiUrl =
        configResponse.data?.nixtube;

      if (!apiUrl) {
        throw new Error(
          "Download API unavailable"
        );
      }

      /* =============================================
         GET DOWNLOAD URL
      ============================================= */

      const apiResponse =
        await axios.get(
          apiUrl,
          {
            params: {
              url: videoUrl,
              type: "video"
            },

            timeout: 120000
          }
        );

      const data =
        apiResponse.data;

      if (
        !data ||
        !data.downloadUrl
      ) {

        console.error(
          "[VIDEO API RESPONSE]",
          data
        );

        throw new Error(
          "Download link unavailable"
        );
      }

      const downloadUrl =
        data.downloadUrl;

      /* =============================================
         DOWNLOAD FILE
      ============================================= */

      const downloadResponse =
        await axios.get(
          downloadUrl,
          {
            responseType: "stream",
            timeout: 300000,
            maxRedirects: 10
          }
        );

      await new Promise(
        (resolve, reject) => {

          const writer =
            fs.createWriteStream(
              filePath
            );

          downloadResponse.data.pipe(
            writer
          );

          writer.on(
            "finish",
            resolve
          );

          writer.on(
            "error",
            reject
          );

          downloadResponse.data.on(
            "error",
            reject
          );
        }
      );

      /* =============================================
         CHECK FILE
      ============================================= */

      if (
        !fs.existsSync(filePath)
      ) {
        throw new Error(
          "Downloaded file not found"
        );
      }

      const stats =
        fs.statSync(
          filePath
        );

      if (
        stats.size <= 0
      ) {
        throw new Error(
          "Downloaded file is empty"
        );
      }

      /* =============================================
         SEND VIDEO
      ============================================= */

      const caption =
        `🎬 ${video.title}\n` +
        `👤 ${video.author?.name || "Unknown"}\n` +
        `⏱️ ${video.timestamp || "N/A"}\n` +
        `👁️ ${(video.views || 0).toLocaleString()}`;

      await new Promise(
        (resolve, reject) => {

          api.sendMessage(
            {
              body: caption,

              attachment:
                fs.createReadStream(
                  filePath
                )
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
        }
      );

    } catch (error) {

      console.error(
        "[VIDEO DOWNLOAD ERROR]",
        error.message
      );

      return api.sendMessage(
        "❌ Video download failed.",
        event.threadID,
        event.messageID
      );

    } finally {

      /* =============================================
         DELETE TEMP FILE
      ============================================= */

      if (
        fs.existsSync(filePath)
      ) {

        try {
          await fs.remove(
            filePath
          );
        } catch {}

      }
    }
  }
};