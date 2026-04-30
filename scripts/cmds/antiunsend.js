const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports.config = {
  name: "antiunsend",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Maidul Edit",
  description: "Show unsent messages with media",
  commandCategory: "group",
  cooldowns: 5
};

let messageStore = {};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body, senderID, attachments } = event;

  // Save message + attachments
  if (event.type === "message" || event.type === "message_reply") {
    messageStore[messageID] = {
      body: body,
      senderID: senderID,
      attachments: attachments
    };
  }

  // When message is unsent
  if (event.type === "message_unsend") {
    const msg = messageStore[event.messageID];
    if (!msg) return;

    let name = await api.getUserInfo(msg.senderID);
    name = name[msg.senderID].name;

    let text = `😈 Anti-Unsend Activated!\n\n👤 ${name}\n💬 ${msg.body || "No text (media)"}`;

    // Handle media (photo/video/audio)
    if (msg.attachments && msg.attachments.length > 0) {
      let files = [];

      for (let i = 0; i < msg.attachments.length; i++) {
        let fileUrl = msg.attachments[i].url;
        let filePath = path.join(__dirname, `cache_${i}.jpg`);

        let response = await axios({
          url: fileUrl,
          method: "GET",
          responseType: "stream"
        });

        let writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise(resolve => writer.on("finish", resolve));

        files.push(fs.createReadStream(filePath));
      }

      return api.sendMessage({
        body: text,
        attachment: files
      }, threadID, () => {
        // delete temp files
        files.forEach((file, i) => {
          fs.unlinkSync(path.join(__dirname, `cache_${i}.jpg`));
        });
      });
    }

    return api.sendMessage(text, threadID);
  }
};

module.exports.run = async function() {};
