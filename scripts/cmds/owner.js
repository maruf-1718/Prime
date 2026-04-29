const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "1.3.0",
    author: "—"𝐈𝐭'𝐳 𝐌𝐚𝐢𝐝𝐮𝐥🫰",
    role: 0,
    shortDescription: "Owner information with image",
    category: "Information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ api, event }) {
    const ownerText = 
`╭─ 👑 Oᴡɴᴇʀ Iɴғᴏ 👑 ─╮
│ 👤 Nᴀᴍᴇ       : Mᴏʜᴀᴍᴍᴀᴅ 𝐌𝐚𝐢𝐝𝐮𝐥
│ 🧸 Nɪᴄᴋ       : —"𝐈𝐭'𝐳 🫶🫰
│ 🎂 Aɢᴇ        : 18+
│ 💘 Rᴇʟᴀᴛɪᴏɴ : Sɪɴɢʟᴇ
│ 🎓 Pʀᴏғᴇssɪᴏɴ : Sᴛᴜᴅᴇɴᴛ
│ 📚 Eᴅᴜᴄᴀᴛɪᴏɴ : Iɴᴛᴇʀ 2ɴᴅ Yᴇᴀʀ
│ 🏡 Lᴏᴄᴀᴛɪᴏɴ : 𝗥𝗮𝗻𝗴𝗽𝘂𝗿 - 𝗞𝘂𝗿𝗶𝗴𝗿𝗮𝗺
├─ 🔗 Cᴏɴᴛᴀᴄᴛ ─╮
│ 📘 Facebook  : Mohammad.Maidul.20 
│ 💬 Messenger: m.Mohammad.Maidul.20
│ 📞 WhatsApp  : wa.me/01707791855
╰────────────────╯`;

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "owner.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgLink = "https://i.imgur.com/1G4ZhU7.jpeg";

    const send = () => {
      api.sendMessage(
        {
          body: ownerText,
          attachment: fs.createReadStream(imgPath)
        },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );
    };

    request(encodeURI(imgLink))
      .pipe(fs.createWriteStream(imgPath))
      .on("close", send);
  }
};
