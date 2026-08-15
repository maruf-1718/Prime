const { findUid } = global.utils;

const sleep = ms =>
	new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	config: {
		name: "adduser",
		aliases: ["add"],
		version: "1.0.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,

		description: {
			en: "Silently add users to the current group."
		},

		category: "box chat",

		guide: {
			en:
				"{pn} <uid>\n" +
				"{pn} <uid1> <uid2>\n" +
				"Reply to a user's message and use {pn}"
		}
	},

	onStart: async function ({
		api,
		event,
		args,
		threadsData
	}) {

		const threadID = String(event.threadID);
		const messageID = event.messageID;

		/* =========================
		   REACTION HELPER
		========================= */

		const react = async emoji => {
			try {
				await api.setMessageReaction(
					emoji,
					messageID,
					() => {},
					true
				);
			} catch (_) {}
		};

		/* =========================
		   COLLECT UID
		========================= */

		let uids = [];

		// Reply করা user
		if (
			event.messageReply &&
			event.messageReply.senderID
		) {
			uids.push(
				String(event.messageReply.senderID)
			);
		}

		// UID / Facebook profile link
		if (Array.isArray(args)) {

			for (const arg of args) {

				if (!arg) continue;

				// Numeric UID
				if (/^\d+$/.test(arg)) {

					uids.push(String(arg));

					continue;
				}

				// Facebook profile URL
				if (
					/(facebook|fb|m\.facebook)\.(com|me)/i.test(arg)
				) {

					try {

						const uid = await findUid(arg);

						if (uid) {
							uids.push(String(uid));
						}

					} catch (_) {}
				}
			}
		}

		// Duplicate UID remove
		uids = [...new Set(uids)];

		/* =========================
		   NO UID
		   NO MESSAGE
		========================= */

		if (!uids.length) {
			await react("❌");
			return;
		}

		/* =========================
		   LOADING
		========================= */

		await react("⏳");

		await sleep(500);

		/* =========================
		   GET GROUP DATA
		========================= */

		let threadData;

		try {

			threadData =
				await threadsData.get(threadID);

		} catch (_) {

			await react("❌");
			return;
		}

		/* =========================
		   CURRENT MEMBERS
		========================= */

		const members =
			Array.isArray(threadData?.members)
				? threadData.members
				: [];

		const success = [];
		const failed = [];
		const already = [];

		/* =========================
		   CHECK + ADD
		========================= */

		for (const uid of uids) {

			// Group-এর current member list check
			const member = members.find(
				m =>
					String(m.userID) === String(uid)
			);

			// Already group-এ থাকলে add করবে না
			if (
				member &&
				member.inGroup === true
			) {
				already.push(uid);
				continue;
			}

			// Add করার চেষ্টা
			try {

				await api.addUserToGroup(
					String(uid),
					threadID
				);

				success.push(uid);

			} catch (_) {

				failed.push(uid);
			}

			await sleep(500);
		}

		/* =========================
		   FINAL REACTION
		========================= */

		// সব successfully added
		if (
			success.length > 0 &&
			failed.length === 0
		) {

			await react("✅");

		}

		// কিছু added + কিছু failed
		else if (
			success.length > 0 &&
			failed.length > 0
		) {

			await react("⚠️");

		}

		// আগে থেকেই group-এ ছিল
		else if (
			success.length === 0 &&
			already.length > 0 &&
			failed.length === 0
		) {

			await react("⚠️");

		}

		// সব failed
		else {

			await react("❌");
		}

		/*
		 * কোনো message.reply()
		 * কোনো message.send()
		 * কোনো error message নেই।
		 *
		 * শুধু command message-এর
		 * reaction পরিবর্তন হবে।
		 */

		return;
	}
};