const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");
const FormData = require("form-data");

const NIX_API =
  "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

const CACHE_DIR =
  path.join(__dirname, "cache");

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
      en: "Search YouTube and download selected video."
    },

    category: "media",

    guide: {
      en: "{pn} <video name>"
    }
  },

  /* =====================================================
     CATBOX UPLOAD
  ===================================================== */

  uploadCatbox: async function (filePath) {

    const form = new FormData();

    form.append(
      "reqtype",
      "fileupload"
    );

    form.append(
      "fileToUpload",
      fs.createReadStream(filePath)
    );

    const response = await axios.post(
      "https://catbox.moe/user/api.php",
      form,
      {
        headers: {
          ...form.getHeaders()
        },

        timeout: 180000,

        maxContentLength:
          Infinity,

        maxBodyLength:
          Infinity,

        validateStatus:
          () => true
      }
    );

    const result =
      String(
        response.data || ""
      ).trim();

    console.log(
      "[CATBOX]",
      response.status,
      result
    );

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      throw new Error(
        `Catbox HTTP ${response.status}: ${result}`
      );
    }

    if (
      !/^https?:\/\/\S+$/i.test(result)
    ) {
      throw new Error(
        `Catbox invalid response: ${result}`
      );
    }

    return result;
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

    api.setMessageReaction(
      "⌛",
      event.messageID,
      () => {},
      true
    );

    try {

      /* ===============================================
         YOUTUBE SEARCH
      =============================================== */

      const search =
        await ytSearch(query);

      if (
        !search ||
        !search.videos ||
        !search.videos.length
      ) {
        throw new Error(
          "No video found"
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

        try {

          const image =
            await axios.get(
              video.thumbnail,
              {
                responseType:
                  "stream",
                timeout: 20000
              }
            );

          attachments.push(
            image.data
          );

        } catch {}
      }

      body +=
        `📥 Reply 1-${videos.length} to download`;

      /* ===============================================
         SEND RESULTS
      =============================================== */

      api.sendMessage(
        {
          body,

          ...(attachments.length
            ? {
                attachment:
                  attachments
              }
            : {})
        },

        event.threadID,

        (error, info) => {

          if (
            error ||
            !info
          ) {
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

      api.setMessageReaction(
        "✅",
        event.messageID,
        () => {},
        true
      );

    } catch (error) {

      console.error(
        "[VIDEO SEARCH]",
        error.message
      );

      api.setMessageReaction(
        "❌",
        event.messageID,
        () => {},
        true
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
        `❌ 1-${Reply.videos.length} এর মধ্যে number দাও।`,
        event.threadID,
        event.messageID
      );
    }

    /* ===============================================
       REMOVE RESULT
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

    const youtubeUrl =
      video.url;

    let filePath = null;

    try {

      await fs.ensureDir(
        CACHE_DIR
      );

      /* =============================================
         GET API
      ============================================= */

      const config =
        await axios.get(
          NIX_API,
          {
            timeout: 30000
          }
        );

      const apiUrl =
        config.data?.api;

      if (!apiUrl) {
        throw new Error(
          "API URL not found"
        );
      }

      console.log(
        "[YTDL API]",
        apiUrl
      );

      /* =============================================
         GET VIDEO DOWNLOAD URL

         Same system as sing.js
      ============================================= */

      const result =
        await axios.get(
          `${apiUrl}/ytdl`,
          {
            params: {
              url: youtubeUrl,
              type: "video"
            },

            timeout: 180000
          }
        );

      console.log(
        "[YTDL RESPONSE]",
        result.data
      );

      if (
        !result.data ||
        !result.data.status ||
        !result.data.downloadUrl
      ) {
        throw new Error(
          "YTDL API did not return download URL"
        );
      }

      const downloadUrl =
        result.data.downloadUrl;

      /* =============================================
         DOWNLOAD VIDEO
      ============================================= */

      const safeName =
        String(
          result.data.title ||
          video.title ||
          "youtube_video"
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

      filePath =
        path.join(
          CACHE_DIR,
          `${Date.now()}_${safeName}.mp4`
        );

      const download =
        await axios.get(
          downloadUrl,
          {
            responseType:
              "stream",

            timeout:
              300000,

            maxRedirects:
              10
          }
        );

      await new Promise(
        (resolve, reject) => {

          const writer =
            fs.createWriteStream(
              filePath
            );

          download.data.pipe(
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

          download.data.on(
            "error",
            reject
          );
        }
      );

      if (
        !fs.existsSync(
          filePath
        )
      ) {
        throw new Error(
          "Video file missing"
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
          "Empty video file"
        );
      }

      /* =============================================
         UPLOAD TO CATBOX
      ============================================= */

      const catboxUrl =
        await this.uploadCatbox(
          filePath
        );

      console.log(
        "[CATBOX URL]",
        catboxUrl
      );

      /* =============================================
         GET VIDEO BACK FROM CATBOX
      ============================================= */

      const catboxVideo =
        await axios.get(
          catboxUrl,
          {
            responseType:
              "stream",

            timeout:
              300000
          }
        );

      /* =============================================
         SEND VIDEO
      ============================================= */

      await new Promise(
        (resolve, reject) => {

          api.sendMessage(
            {
              body:
                `🎬 ${result.data.title || video.title}\n` +
                `👤 ${video.author?.name || "Unknown"}\n` +
                `⏱️ ${video.timestamp || "N/A"}\n\n` +
                `🔗 ${catboxUrl}`,

              attachment:
                catboxVideo.data
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

      api.setMessageReaction(
        "🪽",
        event.messageID,
        () => {},
        true
      );

    } catch (error) {

      console.error(
        "[VIDEO ERROR]",
        error.message
      );

      api.setMessageReaction(
        "❌",
        event.messageID,
        () => {},
        true
      );

      return api.sendMessage(
        "❌ Video download failed.",
        event.threadID,
        event.messageID
      );

    } finally {

      /* =============================================
         DELETE LOCAL FILE
      ============================================= */

      if (
        filePath &&
        fs.existsSync(
          filePath
        )
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