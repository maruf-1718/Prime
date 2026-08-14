const { findUid } = global.utils;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
	config: {
		name: "adduser",
		version: "2.0.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,

		description: {
			en: "Add a Facebook user to the current group by UID or reply."
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
		message,
		api,
		event,
		args,
		threadsData
	}) {

		const threadID = event.threadID;
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
			} catch (_) {
				// Reaction unsupported হলে command বন্ধ হবে না
			}
		};

		/* =========================
		   COLLECT UID
		========================= */

		let uids = [];

		// 1️⃣ Reply করা user
		if (
			event.messageReply &&
			event.messageReply.senderID
		) {
			uids.push(String(event.messageReply.senderID));
		}

		// 2️⃣ Direct UID arguments
		if (args && args.length) {
			for (const arg of args) {

				// শুধু numeric UID গ্রহণ করবে
				if (/^\d+$/.test(arg)) {
					uids.push(String(arg));
					continue;
				}

				// Facebook profile link হলে UID বের করার চেষ্টা
				if (
					/(facebook|fb|m\.facebook)\.(com|me)/i.test(arg)
				) {
					try {
						const uid = await findUid(arg);

						if (uid)
							uids.push(String(uid));
					} catch (err) {
						console.error(
							"[ADDUSER] UID FIND ERROR:",
							err
						);
					}
				}
			}
		}

		// Duplicate UID remove
		uids = [...new Set(uids)];

		/* =========================
		   NO UID
		========================= */

		if (!uids.length) {

			await react("❌");

			return message.reply(
				"❌ 𝐔𝐈𝐃 𝐍𝐎𝐓 𝐅𝐎𝐔𝐍𝐃!\n\n" +
				"✦ 𝐔𝐬𝐞:\n" +
				"➜ adduser <UID>\n\n" +
				"✦ 𝐄𝐱𝐚𝐦𝐩𝐥𝐞:\n" +
				"➜ adduser 100012345678\n\n" +
				"✦ 𝐎𝐫 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚 𝐮𝐬𝐞𝐫'𝐬 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐚𝐧𝐝 𝐭𝐲𝐩𝐞:\n" +
				"➜ adduser"
			);
		}

		/* =========================
		   LOADING REACTION
		========================= */

		await react("⏳");

		// Small delay for loading effect
		await sleep(700);

		/* =========================
		   GET GROUP DATA
		========================= */

		let threadData;

		try {
			threadData = await threadsData.get(threadID);
		} catch (err) {
			console.error(
				"[ADDUSER] THREAD DATA ERROR:",
				err
			);
		}

		const members = threadData?.members || [];

		const success = [];
		const failed = [];
		const already = [];

		/* =========================
		   ADD USERS
		========================= */

		for (const uid of uids) {

			// Already in group?
			const isAlreadyInGroup = members.some(
				member =>
					String(member.userID) === String(uid) &&
					member.inGroup === true
			);

			if (isAlreadyInGroup) {
				already.push(uid);
				continue;
			}

			try {

				await api.addUserToGroup(
					uid,
					threadID
				);

				success.push(uid);

			} catch (err) {

				console.error(
					`[ADDUSER] Failed to add ${uid}:`,
					err
				);

				failed.push({
					uid,
					error: err?.message || "Unknown error"
				});
			}

			// Small delay between users
			await sleep(500);
		}

		/* =========================
		   FINAL REACTION
		========================= */

		if (success.length > 0 && failed.length === 0) {
			await react("✅");
		} else if (success.length > 0) {
			// Partial success
			await react("✅");
		} else {
			await react("❌");
		}

		/* =========================
		   BUILD RESPONSE
		========================= */

		let result = "";

		// Successful
		if (success.length) {

			result +=
				"╭━━━〔 ✦ 𝐀𝐃𝐃𝐄𝐃 ✦ 〕━━━╮\n" +
				"┃\n";

			success.forEach((uid, index) => {
				result +=
					`┃  ${String(index + 1).padStart(2, "0")} ┃ ✅ ${uid}\n`;
			});

			result +=
				"┃\n" +
				"╰━━━━━━━━━━━━━━━━━━╯\n";
		}

		// Already in group
		if (already.length) {

			result +=
				"\n╭━━〔 ✦ 𝐀𝐋𝐑𝐄𝐀𝐃𝐘 𝐈𝐍 ✦ 〕━━╮\n" +
				"┃\n";

			already.forEach((uid, index) => {
				result +=
					`┃  ${String(index + 1).padStart(2, "0")} ┃ ⚠️ ${uid}\n`;
			});

			result +=
				"┃\n" +
				"╰━━━━━━━━━━━━━━━━━━╯\n";
		}

		// Failed
		if (failed.length) {

			result +=
				"\n╭━━━〔 ✦ 𝐅𝐀𝐈𝐋𝐄𝐃 ✦ 〕━━━╮\n" +
				"┃\n";

			failed.forEach((item, index) => {
				result +=
					`┃  ${String(index + 1).padStart(2, "0")} ┃ ❌ ${item.uid}\n`;
			});

			result +=
				"┃\n" +
				"╰━━━━━━━━━━━━━━━━━━╯\n";
		}

		/* =========================
		   SUMMARY
		========================= */

		result +=
			"\n✦ 𝐓𝐨𝐭𝐚𝐥 : ${uids.length}\n".replace(
				"${uids.length}",
				uids.length
			) +
			`✦ 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 : ${success.length}\n` +
			`✦ 𝐅𝐚𝐢𝐥𝐞𝐝 : ${failed.length}\n` +
			`✦ 𝐀𝐥𝐫𝐞𝐚𝐝𝐲 𝐈𝐧 : ${already.length}`;

		return message.reply(result);
	}
};