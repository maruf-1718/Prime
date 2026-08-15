module.exports = {
  config: {
    name: "autoinvite",
    version: "1.0.0",
    author: "Mohammad Maruf",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    try {
      if (event.logMessageType !== "log:unsubscribe") return;

      const threadID = event.threadID;
      const data = event.logMessageData || {};
      const leftID = data.leftParticipantFbId;

      if (!leftID) return;

      // Add করার আগে ছোট delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        await api.addUserToGroup(
          String(leftID),
          String(threadID)
        );
      } catch (_) {
        // Add করা না গেলে কোনো message দেবে না
      }

    } catch (_) {
      // কোনো error message দেবে না
    }
  }
};