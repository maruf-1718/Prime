const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// একই ইউজারকে যেন বারবার স্প্যাম না করে তার জন্য স্প্যাম ফিল্টার
const processedEvents = new Set();

module.exports = {
  config: {
    name: "welcome",
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Auto welcome banner for new members"
    },
    longDescription: {
      en: "Generates an HD Welcome Banner strictly once per user when joining."
    },
    category: "pro",
    guide: {
      en: "Auto triggers on new member join"
    }
  },

  // Auto Trigger: শুধুমাত্র নতুন কেউ গ্রুপে জয়েন হলে কাজ করবে
  onEvent: async function ({ api, event, Threads }) {
    if (event.logMessageType === "log:subscribe") {
      const addedParticipants = event.logMessageData.addedParticipants || [];

      for (const participant of addedParticipants) {
        const eventKey = `${event.threadID}_${participant.userFbId}_${event.time || Date.now()}`;

        if (processedEvents.has(eventKey)) continue;
        processedEvents.add(eventKey);

        setTimeout(() => processedEvents.delete(eventKey), 10000);

        await sendWelcomeBanner({
          api,
          event,
          Threads,
          userID: participant.userFbId
        });
      }
    }
  },

  // Manual Trigger
  onStart: async function ({ api, event, Threads }) {
    let targetID = event.senderID;

    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }

    await sendWelcomeBanner({
      api,
      event,
      Threads,
      userID: targetID
    });
  }
};


async function sendWelcomeBanner({ api, event, Threads, userID }) {
  const cacheDir = path.join(__dirname, "cache");

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const outputPath = path.join(
    cacheDir,
    `welcome_${userID}_${Date.now()}.png`
  );

  try {

    // ==============================
    // ১. ইউজার তথ্য
    // ==============================

    let userName = "New Member";

    try {
      const userInfo = await api.getUserInfo(userID);

      if (userInfo && userInfo[userID]) {
        userName = userInfo[userID].name || "New Member";
      }
    } catch (e) {}


    // ==============================
    // ২. গ্রুপ তথ্য
    // ==============================

    let threadName = "রং ঢং মাস্তি";
    let memberCount = "N/A";

    try {
      const threadInfo = await Threads.getInfo(event.threadID);

      if (threadInfo) {
        if (threadInfo.threadName) {
          threadName = threadInfo.threadName;
        }

        if (threadInfo.participantIDs) {
          memberCount = threadInfo.participantIDs.length;
        }
      }
    } catch (e) {}


    // ==============================
    // ৩. তারিখ
    // ==============================

    const today = new Date().toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });


    // ==============================
    // ৪. CANVAS
    // ==============================

    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext("2d");

    ctx.textAlign = "center";


    // ==============================
    // ৫. PREMIUM BACKGROUND
    // ==============================

    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );

    gradient.addColorStop(0, "#050816");
    gradient.addColorStop(0.35, "#111a3a");
    gradient.addColorStop(0.7, "#172554");
    gradient.addColorStop(1, "#090d20");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // ==============================
    // ৬. GLOW CIRCLES
    // ==============================

    function glowCircle(x, y, radius, color) {
      const glow = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      );

      glow.addColorStop(0, color);
      glow.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    glowCircle(120, 100, 250, "rgba(0,210,255,0.20)");
    glowCircle(1080, 120, 280, "rgba(255,0,127,0.18)");
    glowCircle(600, 500, 300, "rgba(124,58,237,0.15)");


    // ==============================
    // ৭. DECORATIVE PARTICLES
    // ==============================

    for (let i = 0; i < 70; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2.5 + 0.5;

      ctx.fillStyle =
        i % 2 === 0
          ? "rgba(0,210,255,0.65)"
          : "rgba(255,255,255,0.45)";

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }


    // ==============================
    // ৮. MAIN GLASS CARD
    // ==============================

    ctx.save();

    ctx.fillStyle = "rgba(5, 8, 22, 0.72)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;

    ctx.beginPath();

    if (ctx.roundRect) {
      ctx.roundRect(45, 40, 1110, 550, 35);
    } else {
      ctx.rect(45, 40, 1110, 550);
    }

    ctx.fill();
    ctx.stroke();

    ctx.restore();


    // ==============================
    // ৯. TOP DECORATION
    // ==============================

    const topGradient = ctx.createLinearGradient(
      250,
      0,
      950,
      0
    );

    topGradient.addColorStop(0, "#00d2ff");
    topGradient.addColorStop(0.5, "#7c3aed");
    topGradient.addColorStop(1, "#ff007f");

    ctx.fillStyle = topGradient;

    ctx.beginPath();

    if (ctx.roundRect) {
      ctx.roundRect(250, 58, 700, 5, 5);
    } else {
      ctx.rect(250, 58, 700, 5);
    }

    ctx.fill();


    // ==============================
    // ১০. PROFILE IMAGE
    // ==============================

    let avatarImg = null;

    try {
      avatarImg = await loadImage(
        `https://graph.facebook.com/${userID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );
    } catch (e) {
      try {
        avatarImg = await loadImage(
          "https://i.imgur.com/2xdA4A4.png"
        );
      } catch (err) {}
    }


    if (avatarImg) {

      // Outer glow
      ctx.save();

      ctx.shadowColor = "#00d2ff";
      ctx.shadowBlur = 30;

      ctx.beginPath();
      ctx.arc(600, 180, 102, 0, Math.PI * 2);
      ctx.fillStyle = "#00d2ff";
      ctx.fill();

      ctx.restore();


      // Gradient ring
      const ringGradient = ctx.createLinearGradient(
        500,
        80,
        700,
        280
      );

      ringGradient.addColorStop(0, "#00d2ff");
      ringGradient.addColorStop(0.5, "#7c3aed");
      ringGradient.addColorStop(1, "#ff007f");


      ctx.beginPath();
      ctx.arc(600, 180, 98, 0, Math.PI * 2);
      ctx.fillStyle = ringGradient;
      ctx.fill();


      // Profile clipping
      ctx.save();

      ctx.beginPath();
      ctx.arc(600, 180, 88, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(
        avatarImg,
        512,
        92,
        176,
        176
      );

      ctx.restore();
    }


    // ==============================
    // ১১. WELCOME TEXT
    // ==============================

    ctx.font = "bold 46px sans-serif";
    ctx.fillStyle = "#ffffff";

    ctx.shadowColor = "rgba(0,210,255,0.45)";
    ctx.shadowBlur = 12;

    ctx.fillText(
      "WELCOME TO OUR ADDA",
      600,
      330
    );

    ctx.shadowBlur = 0;


    // ==============================
    // ১২. GROUP NAME
    // ==============================

    const groupGradient = ctx.createLinearGradient(
      400,
      0,
      800,
      0
    );

    groupGradient.addColorStop(0, "#00d2ff");
    groupGradient.addColorStop(0.5, "#ffffff");
    groupGradient.addColorStop(1, "#00d2ff");

    ctx.font = "bold 34px sans-serif";
    ctx.fillStyle = groupGradient;

    ctx.fillText(
      threadName,
      600,
      375
    );


    // ==============================
    // ১৩. HELLO USER
    // ==============================

    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "#ff4da6";

    ctx.fillText(
      `Hello, ${userName}!`,
      600,
      425
    );


    // ==============================
    // ১৪. INFO BOX
    // ==============================

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;

    ctx.beginPath();

    if (ctx.roundRect) {
      ctx.roundRect(330, 450, 540, 55, 18);
    } else {
      ctx.rect(330, 450, 540, 55);
    }

    ctx.fill();
    ctx.stroke();


    ctx.font = "22px sans-serif";
    ctx.fillStyle = "#e8e8e8";

    ctx.fillText(
      `👥 Member #${memberCount}   •   📅 Joined: ${today}`,
      600,
      485
    );


    // ==============================
    // ১৫. FOOTER
    // ==============================

    ctx.font = "italic 19px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.60)";

    ctx.fillText(
      "Created with ❤️ by Mohammad Maruf",
      600,
      550
    );


    // ==============================
    // ১৬. SIDE DECORATIONS
    // ==============================

    ctx.font = "28px sans-serif";

    ctx.fillStyle = "#00d2ff";
    ctx.fillText("✦", 105, 110);
    ctx.fillText("✦", 1095, 110);

    ctx.fillStyle = "#ff007f";
    ctx.fillText("✧", 95, 525);
    ctx.fillText("✧", 1105, 525);


    // ==============================
    // ১৭. SAVE IMAGE
    // ==============================

    const buffer = canvas.toBuffer("image/png");

    fs.writeFileSync(
      outputPath,
      buffer
    );


    // ==============================
    // ১৮. SEND MESSAGE
    // ==============================

    await api.sendMessage(
      {
        body:
          body:
  `╭━━━〔 🎀 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 🎀 〕━━━╮\n` +
  `┃\n` +
  `┃  ✨ 𝐇𝐞𝐥𝐥𝐨, @${userName}! 🫶\n` +
  `┃\n` +
  `┃  💫 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 𝐎𝐮𝐫 𝐀𝐝𝐝𝐚 𝐆𝐫𝐨𝐮𝐩! 💖\n` +
  `┃  🌸 𝐖𝐞'𝐫𝐞 𝐆𝐥𝐚𝐝 𝐭𝐨 𝐇𝐚𝐯𝐞 𝐘𝐨𝐮 𝐇𝐞𝐫𝐞! ❤️‍🩹\n` +
  `┃\n` +
  `┃  🎀 𝐄𝐧𝐣𝐨𝐲 𝐘𝐨𝐮𝐫 𝐒𝐭𝐚𝐲 & 𝐇𝐚𝐯𝐞 𝐅𝐮𝐧! ✨\n` +
  `┃  🦋 𝐅𝐞𝐞𝐥 𝐅𝐫𝐞𝐞 𝐭𝐨 𝐉𝐨𝐢𝐧 𝐎𝐮𝐫 𝐀𝐝𝐝𝐚! 🫰\n` +
  `┃\n` +
  `╰━━━━━━〔 ❤️‍🩹🎀 〕━━━━━━╯\n\n` +
  `✨ 𝐖𝐢𝐭𝐡 𝐋𝐨𝐯𝐞 — 𝐌𝐨𝐡𝐚𝐦𝐦𝐚𝐝 𝐌𝐚𝐫𝐮𝐟 ❤️‍🩹🎀`,

        mentions: [
          {
            tag: `@${userName}`,
            id: userID
          }
        ],

        attachment: fs.createReadStream(
          outputPath
        )
      },

      event.threadID,

      () => {
        // Send হওয়ার পর cache delete
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      },

      event.messageID
    );

  } catch (error) {

    console.error(
      "Welcome Error:",
      error
    );

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
  }
}