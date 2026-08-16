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
      en: "Upload video and audio to Catbox"
    },

    longDescription: {
      en: "Reply to a video or audio and upload it to Catbox."
    },

    category: "media",

    guide: {
      en: "{pn} - Reply to video/audio"
    }
  },

  /* =====================================================
     DOWNLOAD FILE
  ===================================================== */

  downloadFile: async function (url, filePath) {
    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 120000,
      maxRedirects: 10
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.on("error", reject);
    });

    if (!fs.existsSync(filePath)) {
      throw new Error("Unable to download attachment");
    }

    const size = fs.statSync(filePath).size;

    if (size <= 0) {
      throw new Error("Downloaded file is empty");
    }
  },

  /* =====================================================
     CATBOX UPLOAD
  ===================================================== */

  uploadToCatbox: async function (filePath) {
    const form = new FormData();

    form.append("reqtype", "fileupload");

    form.append(
      "fileToUpload",
      fs.createReadStream(filePath)
    );

    try {
      const response = await axios.post(
        "https://catbox.moe/user/api.php",
        form,
        {
          headers: {
            ...form.getHeaders()
          },

          timeout: 180000,

          maxContentLength: Infinity,
          maxBodyLength: Infinity,

          validateStatus: () => true
        }
      );

      const status = response.status;

      const body =
        String(response.data || "").trim();

      console.log(
        "[CATBOX] HTTP:",
        status
      );

      console.log(
        "[CATBOX] RESPONSE:",
        body
      );

      if (status < 200 || status >= 300) {
        throw new Error(
          `Catbox HTTP ${status}: ${body || "No response"}`
        );
      }

      if (
        !/^https?:\/\/\S+$/i.test(body)
      ) {
        throw new Error(
          `Catbox invalid response: ${body || "empty"}`
        );
      }

      return body;

    } catch (error) {

      console.error(
        "[CATBOX UPLOAD ERROR]",
        error.message
      );

      throw error;
    }
  },

  /* =====================================================
     EXTENSION
  ===================================================== */

  getExtension: function (attachment) {
    const type =
      String(
        attachment?.type || ""
      ).toLowerCase();

    if (type === "video") {
      return "mp4";
    }

    if (type === "audio") {
      return "mp3";
    }

    return null;
  },

  /* =====================================================
     MAIN COMMAND
  ===================================================== */

  onStart: async function ({
    api,
    event
  }) {

    const threadID =
      event.threadID;

    const messageID =
      event.messageID;

    const reply =
      event.messageReply;

    /* ---------------------------------------------------
       CHECK REPLY
    --------------------------------------------------- */

    if (
      !reply ||
      !Array.isArray(reply.attachments) ||
      !reply.attachments.length
    ) {
      return api.sendMessage(
        "❌ Video অথবা Audio-তে reply করে catbox command দাও।",
        threadID,
        messageID
      );
    }

    /* ---------------------------------------------------
       ONLY VIDEO + AUDIO
    --------------------------------------------------- */

    const attachments =
      reply.attachments.filter(
        item =>
          item &&
          item.url &&
          (
            item.type === "video" ||
            item.type === "audio"
          )
      );

    if (!attachments.length) {
      return api.sendMessage(
        "❌ শুধু Video এবং Audio support করে।",
        threadID,
        messageID
      );
    }

    const links = [];

    /* ---------------------------------------------------
       PROCESS
    --------------------------------------------------- */

    for (
      let i = 0;
      i < attachments.length;
      i++
    ) {

      const attachment =
        attachments[i];

      const extension =
        this.getExtension(
          attachment
        );

      if (!extension) {
        continue;
      }

      const filePath =
        path.join(
          __dirname,
          `catbox_${Date.now()}_${i}_${Math.random()
            .toString(36)
            .slice(2)}.${extension}`
        );

      try {

        /* Download */

        await this.downloadFile(
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
          `[CATBOX] File ${i + 1} failed:`,
          error.message
        );

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

    /* ---------------------------------------------------
       SUCCESS
    --------------------------------------------------- */

    if (links.length) {
      return api.sendMessage(
        links.join("\n"),
        threadID,
        messageID
      );
    }

    /* ---------------------------------------------------
       FAILED
    --------------------------------------------------- */

    return api.sendMessage(
      "❌ Catbox upload failed.",
      threadID,
      messageID
    );
  }
};