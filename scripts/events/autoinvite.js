module.exports = {
  config: {
    name: "autoinvite",
    version: "1.0.0",
    author: "Mohammad Maruf",
    category: "events"
  },

  onStart: async ({ api, event }) => {
    // শুধু কেউ নিজে group leave করলে কাজ করবে
    if (event.logMessageType !== "log:unsubscribe") return;

    const { threadID, logMessageData, author } = event;
    const leftID = logMessageData.leftParticipantFbId;

    // Kick করা হলে কাজ করবে না
    if (!leftID || leftID !== author) return;

    try {
      // Leave করা member-কে আবার group-এ add করার চেষ্টা
      await api.addUserToGroup(leftID, threadID);

      // কোনো message পাঠাবে না
      return;
    } catch (err) {
      // Add করা সম্ভব না হলেও কোনো error message পাঠাবে না
      return;
    }
  }
};