const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "emojiv0",
    version: "1.0.0",
    author: "Mohammad Maruf",
    role: 0,
    category: "system",
    shortDescription: "Emoji Song",
    longDescription: "Send a specific song when a specific emoji is detected."
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    try {
      const { body, threadID, messageID, senderID } = event;

      if (!body) return;

      // Cooldown
      global.emojiSong ??= {};
      if (
        global.emojiSong[threadID] &&
        Date.now() - global.emojiSong[threadID] < 3000
      )
        return;

      const songs = {
        "1️⃣": "https://files.catbox.moe/etsdn9.mp3",
        "2️⃣": "https://files.catbox.moe/ayepdz.mp3",
        "3️⃣": "https://files.catbox.moe/oaecnx.mp3",
        "4️⃣": "https://files.catbox.moe/xtpf61.mp3",
        "5️⃣": "https://files.catbox.moe/12grz0.mp3",
        "6️⃣": "https://files.catbox.moe/aaqddo.mp3",
        "7️⃣": "https://files.catbox.moe/k3acvx.mp3",
        "🤪":
"https://files.catbox.moe/ihmbr7.mp3"
      };

      let url = null;

      for (const emoji in songs) {
        if (body.includes(emoji)) {
          url = songs[emoji];
          break;
        }
      }

      if (!url) return;

      global.emojiSong[threadID] = Date.now();

      api.setMessageReaction("🆗", messageID);

      const filePath = path.join(
        __dirname,
        "cache",
        `emoji_${Date.now()}.mp3`
      );

      const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: "🎵 এই নাও তোমার Product 🎶",
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          () => {
            if (fs.existsSync(filePath))
              fs.unlinkSync(filePath);
          },
          messageID
        );
      });

      writer.on("error", () => {
        api.sendMessage("❌ Failed to send song!", threadID, messageID);
      });

    } catch (err) {
      console.log(err);
      api.sendMessage("⚠️ Failed to download song!", event.threadID);
    }
  }
};