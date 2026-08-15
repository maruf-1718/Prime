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

      const data = event.logMessageData || {};
      const leftID = data.leftParticipantFbId;

      if (!leftID) return;

      console.log("========== AUTOINVITE EVENT ==========");
      console.log("threadID:", event.threadID);
      console.log("leftID:", leftID);
      console.log("author:", event.author);
      console.log("logMessageData:", JSON.stringify(data, null, 2));
      console.log("======================================");

      // আপাতত leave হওয়া user-কে আবার add করার চেষ্টা
      await api.addUserToGroup(
        String(leftID),
        event.threadID
      );

    } catch (error) {
      console.error(
        "[AUTOINVITE ERROR]:",
        error?.message || error
      );
    }
  }
};