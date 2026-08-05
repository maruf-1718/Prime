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

        // যদি এই জয়েনিং মেসেজটি আগেই প্রসেস হয়ে থাকে, তবে আর পাঠাবে না
        if (processedEvents.has(eventKey)) continue;
        processedEvents.add(eventKey);

        // ১০ সেকেন্ড পর হিস্ট্রি মেমোরি ক্লিয়ার
        setTimeout(() => processedEvents.delete(eventKey), 10000);

        await sendWelcomeBanner({ api, event, Threads, userID: participant.userFbId });
      }
    }
  },

  // Manual Trigger: কেউ কমান্ড দিলেও টেস্ট করতে পারবে
  onStart: async function ({ api, event, Threads }) {
    let targetID = event.senderID;
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    }
    await sendWelcomeBanner({ api, event, Threads, userID: targetID });
  }
};

async function sendWelcomeBanner({ api, event, Threads, userID }) {
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const outputPath = path.join(cacheDir, `welcome_${userID}_${Date.now()}.png`);

  try {
    // ১. ইউজার ও গ্রুপ তথ্য সংগ্রহ
    let userName = "New Member";
    try {
      const userInfo = await api.getUserInfo(userID);
      if (userInfo && userInfo[userID]) {
        userName = userInfo[userID].name || "New Member";
      }
    } catch (e) {}

    let threadName = "রং ঢং মাস্তি";
    let memberCount = "N/A";
    try {
      const threadInfo = await Threads.getInfo(event.threadID);
      if (threadInfo) {
        if (threadInfo.threadName) threadName = threadInfo.threadName;
        if (threadInfo.participantIDs) memberCount = threadInfo.participantIDs.length;
      }
    } catch (e) {}

    const today = new Date().toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    // ২. ক্যানভাস ব্যানার ডিজাইন
    const canvas = createCanvas(1200, 630);
    const ctx = canvas.getContext("2d");

    // ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0f2027");
    gradient.addColorStop(0.5, "#203a43");
    gradient.addColorStop(1, "#2c5364");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ওভারলে কার্ড
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(50, 50, 1100, 530, 25);
    } else {
      ctx.rect(50, 50, 1100, 530);
    }
    ctx.fill();

    // ৩. প্রোফাইল পিকচার লোড
    let avatarImg = null;
    try {
      avatarImg = await loadImage(`https://graph.facebook.com/${userID}/picture?height=500&width=500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
    } catch (e) {
      try {
        avatarImg = await loadImage("https://i.imgur.com/2xdA4A4.png");
      } catch (err) {}
    }

    if (avatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(600, 190, 90, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImg, 510, 100, 180, 180);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(600, 190, 92, 0, Math.PI * 2, true);
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#00d2ff";
      ctx.stroke();
    }

    // ৪. টেক্সট
    ctx.textAlign = "center";

    ctx.font = "bold 40px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("WELCOME TO OUR ADDA GROUP", 600, 340);

    ctx.font = "bold 34px sans-serif";
    ctx.fillStyle = "#00d2ff";
    ctx.fillText(threadName, 600, 390);

    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "#ff007f";
    ctx.fillText(`Hello, ${userName}!`, 600, 440);

    ctx.font = "22px sans-serif";
    ctx.fillStyle = "#e0e0e0";
    ctx.fillText(`Member #${memberCount}  |  Joined: ${today}`, 600, 485);

    ctx.font = "italic 18px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("Created by: Mohammad Maruf", 600, 535);

    // ৫. ইমেজ ফাইলে সেভ ও সেন্ড
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);

    await api.sendMessage(
      {
        body: `🎀-স্বাগতম-🎊 @${userName}!\nআমাদের আড্ডা গ্রুপে আপনাকে স্বাগতম! 🎊❤️`,
        mentions: [{ tag: `@${userName}`, id: userID }],
        attachment: fs.createReadStream(outputPath)
      },
      event.threadID,
      () => {
        // ফাইল সেন্ড হয়ে গেলে অটোমেটিক ক্যাশ থেকে ডিলেট হয়ে যাবে
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      },
      event.messageID
    );

  } catch (error) {
    console.error("Welcome Error:", error);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
}
