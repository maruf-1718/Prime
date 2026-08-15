module.exports = {
  config: {
    name: "autoinvite",
    version: "1.0.0",
    author: "Mohammad Maruf",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    try {
      // শুধু member leave/remove event
      if (event.logMessageType !== "log:unsubscribe") return;

      const threadID = event.threadID;
      const data = event.logMessageData || {};

      const leftID = data.leftParticipantFbId;
      const author = event.author;

      // UID না পাওয়া গেলে কিছু করবে না
      if (!leftID) return;

      /*
       * নিজে leave করলে:
       * leftParticipantFbId === author
       *
       * অন্য কেউ kick করলে:
       * author !== leftParticipantFbId
       */
      if (String(leftID) !== String(author)) return;

      // Leave করা user-কে আবার add করার চেষ্টা
      await api.addUserToGroup(
        String(leftID),
        threadID
      );

      // সফল হলেও কোনো message/reply নয়
      return;

    } catch (error) {
      // Failed হলেও কোনো message নয়
      console.error(
        "[AUTOINVITE] Add failed:",
        error?.message || error
      );

      return;
    }
  }
};