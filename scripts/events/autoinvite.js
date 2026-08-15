module.exports = {
  config: {
    name: "autoinvite",
    version: "1.0.0",
    author: "Mohammad Maruf",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    try {
      console.log("[AUTOINVITE] EVENT:", event.logMessageType);
      console.log("[AUTOINVITE] DATA:", event.logMessageData);

      if (event.logMessageType !== "log:unsubscribe") return;

      const threadID = event.threadID;
      const data = event.logMessageData || {};
      const leftID = data.leftParticipantFbId;

      console.log("[AUTOINVITE] LEFT UID:", leftID);
      console.log("[AUTOINVITE] AUTHOR:", event.author);

      if (!leftID) {
        console.log("[AUTOINVITE] No leftParticipantFbId");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        await api.addUserToGroup(
          String(leftID),
          String(threadID)
        );

        console.log(
          "[AUTOINVITE] ADD SUCCESS:",
          leftID
        );

      } catch (err) {
        console.log(
          "[AUTOINVITE] ADD FAILED:",
          err?.message || err
        );
      }

    } catch (err) {
      console.log(
        "[AUTOINVITE] ERROR:",
        err?.message || err
      );
    }
  }
};