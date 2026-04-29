const axios = require("axios");

module.exports = {
  config: {
    name: "ffinfo",
    aliases: ["freefireinfo", "ffstats"],
    version: "2.1.0",
    author: "Dipto ✚ Edit by Mᴏʜᴀᴍᴍᴀᴅ Aᴋᴀsʜ",
    role: 0,
    premium: false,
    description: "Show complete Free Fire player info with styled output",
    category: "game",
    guide: {
      en: "{p}ffinfo <uid>"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const uid = args[0];
      if (!uid) {
        return api.sendMessage(
          "⚠️ Please provide a Free Fire UID\n📌 Example: ffinfo 3060644273",
          event.threadID,
          event.messageID
        );
      }

      const wait = await api.sendMessage(
        "⏳ Fetching Free Fire player info...",
        event.threadID
      );

      const url = `https://ff.mlbbai.com/info/?uid=${uid}`;
      const res = await axios.get(url);
      const data = res.data;

      if (!data || !data.basicInfo) {
        return api.editMessage(
          "❌ Failed to fetch player data. UID may be invalid.",
          wait.messageID
        );
      }

      const b = data.basicInfo;
      const clan = data.clanBasicInfo || {};
      const pet = data.petInfo || {};
      const social = data.socialInfo || {};
      const credit = data.creditScoreInfo || {};
      const cap = data.captainBasicInfo || {};

      const msg = `
🎮 𝐅ʀᴇᴇ 𝐅ɪʀᴇ 𝐏ʟᴀʏᴇʀ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━
👤 𝐍ᴀᴍᴇ: ${b.nickname || "N/A"}
🆔 𝐔ɪᴅ: ${b.accountId || uid}
🌍 𝐑ᴇɢɪᴏɴ: ${b.region || "N/A"}
⭐ 𝐋ᴇᴠᴇʟ: ${b.level || "N/A"}
❤️ 𝐋ɪᴋᴇꜱ: ${b.liked || 0}
📈 𝐄xᴘ: ${b.exp || 0}

🏆 𝐑ᴀɴᴋ: ${b.rank || "N/A"}
🎯 𝐑ᴀɴᴋ 𝐏ᴏɪɴᴛꜱ: ${b.rankingPoints || 0}
⚔️ 𝐂ꜱ 𝐑ᴀɴᴋ: ${b.csRank || "N/A"}
🎮 𝐂ꜱ 𝐏ᴏɪɴᴛꜱ: ${b.csRankingPoints || 0}

👑 𝐌ᴀx 𝐑ᴀɴᴋ: ${b.maxRank || "N/A"}
👑 𝐌ᴀx 𝐂ꜱ 𝐑ᴀɴᴋ: ${b.csMaxRank || "N/A"}
🎟️ 𝐄ʟɪᴛᴇ 𝐏ᴀꜱꜱ: ${b.hasElitePass ? "✅ Yes" : "❌ No"}
🏅 𝐁ᴀᴅɢᴇꜱ: ${b.badgeCnt || 0}

📅 𝐒ᴇᴀꜱᴏɴ: ${b.seasonId || "N/A"}
🛠️ 𝐑ᴇʟᴇᴀꜱᴇ: ${b.releaseVersion || "N/A"}
👁️ 𝐁ʀ 𝐑ᴀɴᴋ 𝐒ʜᴏᴡ: ${b.showBrRank ? "Yes" : "No"}
👁️ 𝐂ꜱ 𝐑ᴀɴᴋ 𝐒ʜᴏᴡ: ${b.showCsRank ? "Yes" : "No"}
⏳ 𝐀ᴄᴄᴏᴜɴᴛ 𝐂ʀᴇᴀᴛᴇ: ${new Date(b.createAt * 1000).toLocaleDateString("en-GB")}

🛡️ 𝐆ᴜɪʟᴅ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━
🏷️ 𝐆ᴜɪʟᴅ 𝐍ᴀᴍᴇ: ${clan.clanName || "None"}
🆔 𝐆ᴜɪʟᴅ 𝐈ᴅ: ${clan.clanId || "N/A"}
📊 𝐆ᴜɪʟᴅ 𝐋ᴇᴠᴇʟ: ${clan.clanLevel || "N/A"}
👥 𝐌ᴇᴍʙᴇʀꜱ: ${clan.memberNum || 0}/${clan.capacity || 0}
👑 𝐆ᴜɪʟᴅ 𝐋ᴇᴀᴅᴇʀ: ${cap.nickname || "N/A"} (Lv.${cap.level || "?"})

🐾 𝐏ᴇᴛ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━
🐶 𝐍ᴀᴍᴇ: ${pet.name || "None"}
📈 𝐋ᴇᴠᴇʟ: ${pet.level || "N/A"}
⭐ 𝐄xᴘ: ${pet.exp || 0}
🎨 𝐒ᴋɪɴ 𝐈ᴅ: ${pet.skinId || "N/A"}

🌐 𝐒ᴏᴄɪᴀʟ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━
🚻 𝐆ᴇɴᴅᴇʀ: ${social.gender?.replace("Gender_", "") || "N/A"}
🗣️ 𝐋ᴀɴɢᴜᴀɢᴇ: ${social.language?.replace("Language_", "") || "N/A"}
✍️ 𝐒ɪɢɴᴀᴛᴜʀᴇ:
${social.signature
  ? social.signature.replace(/\[B]|\[C]|\[ff[0-9a-f]+]/g, "")
  : "None"}

🛡️ 𝐂ʀᴇᴅɪᴛ 𝐒ᴄᴏʀᴇ
━━━━━━━━━━━━━━━━
💯 𝐒ᴄᴏʀᴇ: ${credit.creditScore || "N/A"}
🎁 𝐑ᴇᴡᴀʀᴅ: ${credit.rewardState?.replace("REWARD_STATE_", "") || "N/A"}
📆 𝐏ᴇʀɪᴏᴅ 𝐄ɴᴅ: ${
        credit.periodicSummaryEndTime
          ? new Date(credit.periodicSummaryEndTime * 1000).toLocaleDateString("en-GB")
          : "N/A"
      }

✨ Powered by 𝐌ᴏʜᴀᴍᴍᴀᴅ Maidul
`;

      await api.editMessage(msg, wait.messageID);
    } catch (err) {
      api.sendMessage(
        `❌ Error: ${err.message}`,
        event.threadID,
        event.messageID
      );
    }
  }
};
