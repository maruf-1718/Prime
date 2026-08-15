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

    shortDescription: {
      en: "Upload media to Catbox"
    },

    longDescription: {
      en: "Reply to an image, video or audio and upload it to Catbox."
    },

    category: "media",

    guide: {
      en: "Reply to an image/video/audio with catbox"
    },

    cooldowns: 5
  },

  /* =====================================================
     DOWNLOAD ATTACHMENT
  ===================================================== */

  downloadAttachment: async function (
    url,
    filePath
  ) {
    const response =
      await axios.get(url, {
        responseType: "stream",
        timeout: 30000,
        maxRedirects: 5
      });

    await new Promise(
      (resolve, reject) => {

        const writer =
          fs.createWriteStream(
            filePath
          );

        response.data.pipe(
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

        response.data.on(
          "error",
          reject
        );
      }
    );

    if (
      !fs.existsSync(filePath)
    ) {
      throw new Error(
        "File download failed"
      );
    }

    return filePath;
  },

  /* =====================================================
     UPLOAD TO CATBOX
  ===================================================== */

  uploadToCatbox: async function (
    filePath
  ) {

    const form =
      new FormData();

    form.append(
      "reqtype",
      "fileupload"
    );

    form.append(
      "fileToUpload",
      fs.createReadStream(
        filePath
      )
    );

    const response =
      await axios.post(
        "https://catbox.moe/user/api.php",
        form,
        {
          headers: {
            ...form.getHeaders()
          },

          timeout: 60000,

          maxContentLength:
            Infinity,

          maxBodyLength:
            Infinity
        }
      );

    const result =
      String(
        response.data || ""
      ).trim();

    /*
     * Catbox সাধারণত direct URL return করে।
     */

    if (
      !result ||
      !/^https?:\/\/\S+$/i.test(
        result
      )
    ) {
      throw new Error(
        result ||
        "Catbox returned an invalid response"
      );
    }

    return result;
  },

  /* =====================================================
     GET FILE EXTENSION
  ===================================================== */

  getExtension: function (
    attachment
  ) {

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

    if (
      type === "video"
    ) {
      return "mp4";
    }

    if (
      type === "audio"
    ) {
      return "mp3";
    }

    if (
      type === "animated_image"
    ) {
      return "gif";
    }

    return "dat";
  },

  /* =====================================================
     MAIN
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
     * Must reply to a message
     */

    if (
      !messageReply ||
      !Array.isArray(
        messageReply.attachments
      ) ||
      messageReply.attachments.length === 0
    ) {

      return api.sendMessage(
        "❐ Please reply to an image, video or audio file.",
        threadID,
        messageID
      );
    }

    const attachments =
      messageReply.attachments.filter(
        attachment =>
          attachment &&
          attachment.url
      );

    if (
      !attachments.length
    ) {

      return api.sendMessage(
        "❌ No downloadable attachment found.",
        threadID,
        messageID
      );
    }

    const uploadedLinks = [];
    const failedFiles = [];

    /*
     * ================================================
     * PROCESS EACH ATTACHMENT
     * ================================================
     */

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

        /*
         * Download
         */

        await this.downloadAttachment(
          attachment.url,
          filePath
        );

        /*
         * Upload
         */

        const link =
          await this.uploadToCatbox(
            filePath
          );

        uploadedLinks.push(
          link
        );

      } catch (error) {

        console.error(
          "[CATBOX ERROR]",
          error.message
        );

        failedFiles.push(
          i + 1
        );

      } finally {

        /*
         * Always remove temporary file
         */

        if (
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
    }

    /* =================================================
       RESULT
    ================================================= */

    if (
      uploadedLinks.length === 0
    ) {

      return api.sendMessage(
        "❌ Catbox upload failed.",
        threadID,
        messageID
      );
    }

    let result =
      uploadedLinks.join("\n");

    if (
      failedFiles.length > 0
    ) {

      result +=
        `\n\n⚠️ Failed: ${failedFiles.length}`;
    }

    return api.sendMessage(
      result,
      threadID,
      messageID
    );
  }
};