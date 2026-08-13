module.exports = {
  config: {
    name: "adminmention",
    version: "1.3.2",
    author: "Mohammad Maruf",
    countDown: 0,
    role: 0,
    shortDescription: "Replies angrily when someone tags admins",
    longDescription: "If anyone mentions an admin, bot will angrily reply with random messages.",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const adminIDs = ["100078049308655", "100090071683807", "100092480994957"].map(String);

    // Skip if sender is admin
    if (adminIDs.includes(String(event.senderID))) return;

    // যদি কেউ মেনশন দেয়
    const mentionedIDs = event.mentions ? Object.keys(event.mentions).map(String) : [];
    const isMentioningAdmin = adminIDs.some(id => mentionedIDs.includes(id));

    if (!isMentioningAdmin) return;

    // র‍্যান্ডম রাগী রিপ্লাই
    const REPLIES = [
      " ওরে মেনশন দিস না বউ নিয়া চিপায় গেছে 😩🐸",
      "⎯⎯”বস এক বু'দাই তুমারে ডাকতেছে-))😂😏",
      "⎯⎯”অই বুকা'চুদা তুই মেনশন দিবি না আমার বস Maruf রে-))😑🥹",
      "⎯⎯”মেনশন দিছস আর বেচে যাবি? W8 বলতাছি Boss রে-))🫵😠",
      "⎯⎯”Boss এখন Busy আছে-))😌🥱"
    ];

    const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    return message.reply(randomReply);
  }
};
