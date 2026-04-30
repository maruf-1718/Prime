module.exports.config = {
  name: "antiunsend",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Maidul Edit",
  description: "Show unsent messages",
  commandCategory: "group",
  usages: "",
  cooldowns: 5
};

let messageStore = {};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, messageID, body, senderID, attachments } = event;

  // Save message
  if (event.type === "message" || event.type === "message_reply") {
    messageStore[messageID] = {
      body: body,
      senderID: senderID,
      attachments: attachments
    };
  }

  // Detect unsend
  if (event.type === "message_unsend") {
    const msg = messageStore[event.messageID];

    if (!msg) return;

    let name = await api.getUserInfo(msg.senderID);
    name = name[msg.senderID].name;

    let text = `😈 Anti-Unsend Activated!\n\n👤 ${name}\n💬 Message: ${msg.body || "No text"}`;

    if (msg.attachments.length > 0) {
      return api.sendMessage({
        body: text,
        attachment: msg.attachments.map(att => att.url)
      }, threadID);
    }

    return api.sendMessage(text, threadID);
  }
};

module.exports.run = async function() {};
