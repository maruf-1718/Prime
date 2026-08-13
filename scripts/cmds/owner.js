const fs = require("fs-extra");
const request = require("request");
const path = require("path");

module.exports = {
  config: {
    name: "owner",
    version: "1.0.0",
    author: "Mohammad Maruf",
    role: 0,
    shortDescription: "Owner information with image",
    category: "Information",
    guide: {
      en: "owner"
    }
  },

  onStart: async function ({ api, event }) {
    const ownerText = 
`╭─── 👑 𝐎𝐰𝐧𝐞𝐫 𝐈𝐧𝐟𝐨 👑 ────╮
│ ━━━━━━ 𝐍𝐚𝐦𝐞 ━━━━━━━
│      𝐌𝐨𝐡𝐚𝐦𝐦𝐚𝐝 𝐌𝐚𝐫𝐮𝐟 🤷🏻‍♂️
│ ━━━━━━ 𝐍𝐢𝐜𝐤 ━━━━━━━━
│               𝐈𝐬𝐡𝐫𝐚𝐭 🎀 
│ ━━━━━━ 𝐀𝐠𝐞 ━━━━━━━━━
│               𝟏𝟔+ 👶🏻
│ ━━━━━━ 𝐑𝐞𝐥𝐚𝐭𝐢𝐨𝐧 ━━━━━━━
│              𝐒𝐢𝐧𝐠𝐥𝐞 🥹
│ ━━━━━━ 𝐖𝐨𝐫𝐤 ━━━━━━━━
│               𝐒𝐭𝐮𝐝𝐞𝐧𝐭 😎
│ ━━━━━━ 𝐄𝐝𝐮𝐜𝐚𝐭𝐢𝐨𝐧 ━━━━━━
│                𝐒𝐞𝐜𝐫𝐞𝐭 🤫
│ ━━━━━━ 𝐋𝐨𝐜𝐚𝐭𝐢𝐨𝐧 ━━━━━━
│          𝐊𝐮𝐫𝐢𝐠𝐫𝐦,𝐊𝐚𝐜𝐚𝐤𝐚𝐭𝐚 📍
├───────────────────╯
├──── 🔗 𝐂𝐨𝐧𝐭𝐚𝐜𝐭 ──────╮
│ 📘 𝐅𝐁: 𝐌𝐨𝐡𝐚𝐦𝐦𝐚𝐝 𝐌𝐚𝐫𝐮𝐟
│ 💬 𝐓𝐆: @𝐦𝐚𝐫𝐮𝐟_𝟏𝟕𝟏𝟖
│ 📞 𝐖𝐀: @𝐦𝐚𝐫𝐮𝐟_𝟏𝟕𝟏𝟖
╰───────────────────╯`;

    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(cacheDir, "owner.jpg");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgLink = "https://i.ibb.co/ynVJVbQ5/4a85abc3a112.jpg";

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
