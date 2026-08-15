module.exports = {
  config: {
    name: "autoinvite",
    version: "1.0.0",
    author: "Mohammad Maruf",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    try {
      // শুধু group member remove/leave event
      if (event.logMessageType !== "log:unsubscribe") {
        return;
      }

      const threadID = event.threadID;
      const data = event.logMessageData || {};

      const leftID = data.leftParticipantFbId;

      // UID পাওয়া না গেলে কিছু করবে না
      if (!leftID) return;

      // Bot নিজে leave করলে তাকে আবার add করার চেষ্টা করবে না
      if (String(leftID) === String(event.author)) {
        return;
      }

      try {
        await api.addUserToGroup(
          String(leftID),
          threadID
        );
      } catch (_) {
        // Add না পারলেও কোনো message করবে না
      }

    } catch (_) {
      // কোনো error message নয়
    }
  }
};