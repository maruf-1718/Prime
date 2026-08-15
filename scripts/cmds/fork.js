exports.config = {
  name: "fork",
  version: "1.0.0",
  author: "Mohammad Maruf",
  countDown: 0,
  role: 0,
  shortDescription: "Fork Link",
  longDescription: "Responds when fork or repository is mentioned.",
  category: "system",
  guide: {
    en: "Type 'fork' or 'repository'"
  }
};

const last = {};
const cool = 10000;

// =====================================
// 🖼️ IMAGE / GIF URL
// পরে এখানে URL বসাবে
// =====================================

const IMAGE_URL = ""; 
const GIF_URL = "";

// উদাহরণ:
// const IMAGE_URL = "https://example.com/image.jpg";
// const GIF_URL = "https://example.com/animation.gif";


exports.onStart = async function () {};


exports.onChat = async function ({ event, api }) {

  const threadID = event.threadID;
  const now = Date.now();

  const text =
    (event.body || "")
      .trim()
      .toLowerCase();

  if (!text) return;

  // শুধু fork / repository লিখলে response
  if (
    text !== "fork" &&
    text !== "repository"
  ) {
    return;
  }

  // 10 seconds cooldown
  if (
    last[threadID] &&
    now - last[threadID] < cool
  ) {
    return;
  }

  last[threadID] = now;

  const msg = `╭━━━━━━━━━━━━━━━━━━━━╮
┃🤖 𝐁𝐨𝐭: 𝐌𝐚𝐫𝐮𝐟'𝐬 𝐁𝐨𝐭
┃🔐 𝐅𝐨𝐫𝐤: 𝐏𝐫𝐢𝐯𝐚𝐭𝐞
┃👑 𝐎𝐰𝐧𝐞𝐫: 𝐌𝐨𝐡𝐚𝐦𝐦𝐚𝐝 𝐌𝐚𝐫𝐮𝐟
╰━━━━━━━━━━━━━━━━━━━━╯`;

  // =====================================
  // 🖼️ IMAGE / GIF ATTACHMENT
  // =====================================

  try {

    // Image দিলে
    if (IMAGE_URL) {

      const axios = require("axios");
      const fs = require("fs-extra");

      const response = await axios.get(
        IMAGE_URL,
        {
          responseType: "arraybuffer",
          timeout: 15000
        }
      );

      const filePath =
        __dirname + "/cache/fork_image.jpg";

      await fs.ensureDir(__dirname + "/cache");
      await fs.writeFile(filePath, response.data);

      return api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        event.messageID
      );
    }

    // GIF দিলে
    if (GIF_URL) {

      const axios = require("axios");
      const fs = require("fs-extra");

      const response = await axios.get(
        GIF_URL,
        {
          responseType: "arraybuffer",
          timeout: 15000
        }
      );

      const filePath =
        __dirname + "/cache/fork.gif";

      await fs.ensureDir(__dirname + "/cache");
      await fs.writeFile(filePath, response.data);

      return api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        event.messageID
      );
    }

  } catch (error) {

    console.error(
      "Fork media error:",
      error.message
    );

  }

  // Image/GIF না থাকলে শুধু text
  return api.sendMessage(
    msg,
    threadID,
    event.messageID
  );
};