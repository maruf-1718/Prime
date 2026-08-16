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
      en: "Reply to a video or audio file to upload it to Catbox."
    },

    category: "media",

    guide: {
      en: "{pn} - Reply to a video or audio"
    }
  },

  /* =====================================================
     DOWNLOAD ATTACHMENT
  ===================================================== */

  downloadFile: async function (url, filePath) {
    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
      timeout: 120000,
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

    if (!fs.existsSync(filePath)) {
      throw new Error("File download failed");
    }

    const size = fs.statSync(filePath).size;

    if (size <= 0) {
      throw new Error("Downloaded file is empty");
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

        timeout: 180000,

        maxContentLength: Infinity,
        maxBodyLength: Infinity,

        validateStatus: () => true
      }
    );

    const result =
      String(response.data || "").trim();

    console.log(
      "[CATBOX STATUS]",
      response.status
    );

    console.log(
      "[CATBOX RESPONSE]",
      result
    );

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      throw new Error(
        `Catbox HTTP ${response.status}`
      );
    }

    if (
      !result ||
      !/^https?:\/\/\S+$/i.test(result)
    ) {
      throw new Error(
        result ||
        "Catbox returned an invalid link"
      );
    }

    return result;
  },

  /* =====================================================
     GET FILE EXTENSION
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

    const {
      threadID,
      messageID,
      messageReply
    } = event;

    /* ===================================================
       CHECK REPLY
    =================================================== */

    if (
      !messageReply ||
      !Array.isArray(
        messageReply.attachments
      ) ||
      messageReply.attachments.length === 0
    ) {

      return api.sendMessage(
        "❌ Video অথবা Audio-তে reply করে catbox command দাও।",
        threadID,
        messageID
      );
    }

    /* ===================================================
       ONLY VIDEO + AUDIO
    =================================================== */

    const attachments =
      messageReply.attachments.filter(
        attachment => {

          if (
            !attachment ||
            !attachment.url
          ) {
            return false;
          }

          return (
            attachment.type === "video" ||
            attachment.type === "audio"
          );
        }
      );

    if (!attachments.length) {

      return api.sendMessage(
        "❌ শুধু Video এবং Audio support করে।",
        threadID,
        messageID
      );
    }

    const links = [];

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

      if (!ext) {
        continue;
      }

      const filePath =
        path.join(
          __dirname,
          `catbox_${Date.now()}_${i}_${Math.random()
            .toString(36)
            .slice(2)}.${ext}`
        );

      try {

        /* -----------------------------------------------
           DOWNLOAD
        ----------------------------------------------- */

        await this.downloadFile(
          attachment.url,
          filePath
        );

        /* -----------------------------------------------
           UPLOAD
        ----------------------------------------------- */

        const link =
          await this.uploadToCatbox(
            filePath
          );

        links.push(link);

      } catch (error) {

        console.error(
          "[CATBOX ERROR]",
          error.message
        );

      } finally {

        /* -----------------------------------------------
           DELETE TEMP FILE
        ----------------------------------------------- */

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
       ALL FAILED
    =================================================== */

    if (!links.length) {

      return api.sendMessage(
        "❌ Catbox upload failed.",
        threadID,
        messageID
      );
    }

    /* ===================================================
       SUCCESS
       
       ONLY DIRECT LINKS
    =================================================== */

    return api.sendMessage(
      links.join("\n"),
      threadID,
      messageID
    );
  }
};