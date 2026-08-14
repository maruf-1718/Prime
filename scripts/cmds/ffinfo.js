const axios = require("axios");

const API_URL = "https://free-ff-api-src-5plp.onrender.com/api/v1/account";

module.exports = {
  config: {
    name: "ffinfo",
    aliases: ["freefireinfo", "ffstats"],
    version: "1.0.0",
    author: "Mohammad Maruf",
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

      if (!/^\d+$/.test(uid)) {
        return api.sendMessage(
          "❌ Invalid UID.\n\nPlease enter a valid numeric Free Fire UID.",
          event.threadID,
          event.messageID
        );
      }

      const wait = await api.sendMessage(
        "⏳ Fetching Free Fire player info...",
        event.threadID
      );

      /*
       * 🇧🇩 Default region = BD
       *
       * API requires both region and UID.
       */

      const url =
        `${API_URL}?region=BD&uid=${encodeURIComponent(uid)}`;

      const res = await axios.get(url, {
        timeout: 20000,
        headers: {
          "Accept": "application/json"
        }
      });

      const data = res.data || {};

      /*
       * API error handling
       */

      if (
        data.error ||
        !data.basicInfo
      ) {

        const errorMessage =
          data.message ||
          data.error ||
          "Player not found or API unavailable.";

        return api.editMessage(
          `❌ Failed to fetch player data.\n\n🔎 ${errorMessage}`,
          wait.messageID
        );
      }


      /* =====================================
         BASIC INFO
      ===================================== */

      const b =
        data.basicInfo || {};


      /* =====================================
         GUILD INFO
      ===================================== */

      const clan =
        data.clanBasicInfo || {};


      /* =====================================
         PET INFO
      ===================================== */

      const pet =
        data.petInfo || {};


      /* =====================================
         SOCIAL INFO
      ===================================== */

      const social =
        data.socialInfo || {};


      /* =====================================
         CREDIT SCORE
      ===================================== */

      const credit =
        data.creditScoreInfo || {};


      /* =====================================
         GUILD LEADER
      ===================================== */

      const cap =
        data.captainBasicInfo || {};


      /* =====================================
         DATE FORMAT
      ===================================== */

      const formatDate = value => {

        if (!value) {
          return "N/A";
        }

        const timestamp =
          Number(value);

        if (
          !Number.isFinite(timestamp) ||
          timestamp <= 0
        ) {
          return "N/A";
        }

        return new Date(
          timestamp * 1000
        ).toLocaleDateString("en-GB");
      };


      /* =====================================
         SOCIAL CLEAN
      ===================================== */

      const gender =
        String(
          social.gender || "N/A"
        ).replace(
          /^Gender_/i,
          ""
        );


      const language =
        String(
          social.language || "N/A"
        ).replace(
          /^Language_/i,
          ""
        );


      const signature =
        social.signature
          ? String(social.signature)
              .replace(
                /\[B\]|\[C\]|\[ff[0-9a-fA-F]+\]/g,
                ""
              )
          : "None";


      /* =====================================
         MESSAGE
      ===================================== */

      const msg = `
🎮 𝐅ʀᴇᴇ 𝐅ɪʀᴇ 𝐏ʟᴀʏᴇʀ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━━━

👤 𝐍ᴀᴍᴇ: ${b.nickname || "N/A"}
🆔 𝐔ɪᴅ: ${b.accountId || uid}
🌍 𝐑ᴇɢɪᴏɴ: ${b.region || "BD"}
⭐ 𝐋ᴇᴠᴇʟ: ${b.level ?? "N/A"}
❤️ 𝐋ɪᴋᴇꜱ: ${b.liked ?? 0}
📈 𝐄xᴘ: ${b.exp ?? 0}

🏆 𝐑ᴀɴᴋ: ${b.rank ?? "N/A"}
🎯 𝐑ᴀɴᴋ 𝐏ᴏɪɴᴛꜱ: ${b.rankingPoints ?? 0}
⚔️ 𝐂𝐒 𝐑ᴀɴᴋ: ${b.csRank ?? "N/A"}
🎮 𝐂𝐒 𝐏ᴏɪɴᴛꜱ: ${b.csRankingPoints ?? 0}

👑 𝐌ᴀx 𝐑ᴀɴᴋ: ${b.maxRank ?? "N/A"}
👑 𝐌ᴀx 𝐂𝐒 𝐑ᴀɴᴋ: ${b.csMaxRank ?? "N/A"}

🏅 𝐁ᴀᴅɢᴇꜱ: ${b.badgeCnt ?? 0}
📅 𝐒ᴇᴀꜱᴏɴ: ${b.seasonId ?? "N/A"}
🛠️ 𝐑ᴇʟᴇᴀꜱᴇ: ${b.releaseVersion || "N/A"}

👁️ 𝐁𝐑 𝐑ᴀɴᴋ 𝐒ʜᴏᴡ: ${
  b.showBrRank ? "Yes" : "No"
}

👁️ 𝐂𝐒 𝐑ᴀɴᴋ 𝐒ʜᴏᴡ: ${
  b.showCsRank ? "Yes" : "No"
}

📅 𝐀ᴄᴄᴏᴜɴᴛ 𝐂ʀᴇᴀᴛᴇ: ${
  formatDate(b.createAt)
}


🛡️ 𝐆ᴜɪʟᴅ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━

🏷️ 𝐆ᴜɪʟᴅ 𝐍ᴀᴍᴇ: ${
  clan.clanName || "None"
}

🆔 𝐆ᴜɪʟᴅ 𝐈ᴅ: ${
  clan.clanId || "N/A"
}

📊 𝐆ᴜɪʟᴅ 𝐋ᴇᴠᴇʟ: ${
  clan.clanLevel ?? "N/A"
}

👥 𝐌ᴇᴍʙᴇʀꜱ: ${
  clan.memberNum ?? 0
}/${clan.capacity ?? 0}

👑 𝐆ᴜɪʟᴅ 𝐋ᴇᴀᴅᴇʀ: ${
  cap.nickname || "N/A"
} ${
  cap.level
    ? `(Lv.${cap.level})`
    : ""
}


🐾 𝐏ᴇᴛ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━

🐶 𝐍ᴀᴍᴇ: ${
  pet.name || "None"
}

📈 𝐋ᴇᴠᴇʟ: ${
  pet.level ?? "N/A"
}

⭐ 𝐄xᴘ: ${
  pet.exp ?? 0
}

🎨 𝐒ᴋɪɴ 𝐈ᴅ: ${
  pet.skinId ?? "N/A"
}


🌐 𝐒ᴏᴄɪᴀʟ 𝐈ɴꜰᴏ
━━━━━━━━━━━━━━━━

🚻 𝐆ᴇɴᴅᴇʀ: ${gender}

🗣️ 𝐋ᴀɴɢᴜᴀɢᴇ: ${language}

✍️ 𝐒ɪɢɴᴀᴛᴜʀᴇ:
${signature}


🛡️ 𝐂ʀᴇᴅɪᴛ 𝐒ᴄᴏʀᴇ
━━━━━━━━━━━━━━━━

💯 𝐒ᴄᴏʀᴇ: ${
  credit.creditScore ?? "N/A"
}

🎁 𝐑ᴇᴡᴀʀᴅ: ${
  String(
    credit.rewardState || "N/A"
  ).replace(
    /^REWARD_STATE_/i,
    ""
  )
}

📆 𝐏ᴇʀɪᴏᴅ 𝐄ɴᴅ: ${
  formatDate(
    credit.periodicSummaryEndTime
  )
}


✨ Powered by 𝐌ᴏʜᴀᴍᴍᴀᴅ 𝐌ᴀɪᴅᴜʟ
`;


      /* =====================================
         EDIT WAITING MESSAGE
      ===================================== */

      return api.editMessage(
        msg,
        wait.messageID
      );

    } catch (err) {

      console.error(
        "FFINFO ERROR:",
        err?.response?.data ||
        err?.message ||
        err
      );


      let errorMessage =
        "❌ Failed to fetch Free Fire player info.";


      if (
        err?.response?.status === 404
      ) {

        errorMessage =
          "❌ Player not found or API endpoint unavailable.";

      } else if (
        err?.response?.status === 429
      ) {

        errorMessage =
          "⚠️ API rate limit reached. Please try again later.";

      } else if (
        err?.code === "ECONNABORTED"
      ) {

        errorMessage =
          "⏳ API request timed out. Please try again.";

      } else if (
        err?.response?.data?.message
      ) {

        errorMessage =
          `❌ ${err.response.data.message}`;
      }


      return api.sendMessage(
        errorMessage,
        event.threadID,
        event.messageID
      );
    }
  }
};