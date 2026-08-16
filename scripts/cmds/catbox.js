const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "catbox",
    version: "1.0.0",
    author: "Mohammad Maruf",

    role: 0,
    countDown: 5,

    shortDescription: {
      en: "Upload media to Catbox"
    },

    longDescription: {
      en: "Reply to an image, video or audio and upload it to Catbox."
    },

    category: "media",

    guide: {
      en: "{pn} — Reply to image/video/audio"
    }
  },

  /* =====================================================
     DOWNLOAD ATTACHMENT
  ===================================================== */

  downloadAttachment: async function (url, filePath) {
    const response = await axios({
      method: "GET",
      url,
      responseType: "stream",
      timeout: 60000,
      maxRedirects: 10,
      validateStatus: status =>
        status >= 200 && status < 300
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);

      response.data.on("error", reject);
    });

    if (
      !fs.existsSync(filePath) ||
      fs.statSync(filePath).size === 0
    ) {
      throw new Error("Attachment download failed");
    }
  },

  /* =====================================================
     UPLOAD TO CATBOX
  ===================================================== */

  uploadToCatbox: async function (filePath) {
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

        timeout: 120000,

        maxContentLength: Infinity,
        maxBodyLength: Infinity,

        validateStatus: status =>
          status >= 200 && status < 300
      }
    );

    const result =
      String(response.data || "").trim();

    if (
      !result ||
      !/^https?:\/\/\S+$/i.test(result)
    ) {
      throw new Error(
        result || "Invalid Catbox response"
      );
    }

    return result;
  },

  /* =====================================================
     FILE EXTENSION
  ===================================================== */

  getExtension: function (attachment) {
    const type =
      String(
        attachment?.type || ""
      ).toLowerCase();

    if (
      type === "photo" ||
      type === "image"
    ) {
      return "jpg";
    }

    if (type === "video") {
      return "mp4";
    }

    if (type === "audio") {
      return "mp3";
    }

    if (type === "animated_image") {
      return "gif";
    }

    return "dat";
  },

  /* =====================================================
     MAIN COMMAND
  ===================================================== */

  onStart: async function ({
    api,
    event
  }) {
    const {
      threadID,
      messageID,
      messageReply
    } = event;

    /*
     * Must reply to media
     */

    if (
      !messageReply ||
      !Array.isArray(
        messageReply.attachments
      ) ||
      messageReply.attachments.length === 0
    ) {
      return api.sendMessage(
        "❐ একটি image, video অথবা audio-তে reply করে command দাও।",
        threadID,
        messageID
      );
    }

    /*
     * Only downloadable attachments
     */

    const attachments =
      messageReply.attachments.filter(
        attachment =>
          attachment &&
          attachment.url
      );

    if (!attachments.length) {
      return api.sendMessage(
        "❌ Downloadable attachment পাওয়া যায়নি।",
        threadID,
        messageID
      );
    }

    const links = [];
    const failed = [];

    /* ===================================================
       PROCESS FILES
    =================================================== */

    for (
      let i = 0;
      i < attachments.length;
      i++
    ) {
      const attachment =
        attachments[i];

      const ext =
        this.getExtension(
          attachment
        );

      const filePath =
        path.join(
          __dirname,
          `catbox_${Date.now()}_${i}_${Math.random()
            .toString(36)
            .slice(2)}.${ext}`
        );

      try {
        /* Download */

        await this.downloadAttachment(
          attachment.url,
          filePath
        );

        /* Upload */

        const link =
          await this.uploadToCatbox(
            filePath
          );

        links.push(link);

      } catch (error) {
        console.error(
          "[CATBOX ERROR]",
          error.response?.data ||
          error.message
        );

        failed.push(i + 1);

      } finally {
        /* Delete temporary file */

        if (
          fs.existsSync(filePath)
        ) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
        }
      }
    }

    /* ===================================================
       RESULT
    =================================================== */

    if (!links.length) {
      return api.sendMessage(
        "❌ Catbox upload failed.",
        threadID,
        messageID
      );
    }

    let result =
      links.join("\n");

    if (failed.length) {
      result +=
        `\n\n⚠️ ${failed.length} file upload failed.`;
    }

    return api.sendMessage(
      result,
      threadID,
      messageID
    );
  }
};