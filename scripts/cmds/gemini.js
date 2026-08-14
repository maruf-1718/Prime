const axios = require("axios");

module.exports = {
	config: {
		name: "gemini",
		aliases: ["ai", "ask"],
		version: "1.0.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,
		category: "AI",

		description: {
			en: "Chat with Google Gemini AI."
		},

		guide: {
			en:
				"{pn} <question>\n" +
				"Example: {pn} Hello\n\n" +
				"Reply to a message with {pn} to ask Gemini about it."
		}
	},

	onStart: async function ({ message, event, args }) {

		/* =====================================
		   🔑 GEMINI API KEY
		   👉 ONLY CHANGE THIS
		===================================== */

		const API_KEY = "AQ.Ab8RN6I64l8bnJeL1XAjiyMpRN1V1B-_CG_08s-cJeYRZdOiNQ";

		/* =====================================
		   CHECK API KEY
		===================================== */

		if (
			!API_KEY ||
			API_KEY === "YOUR_GEMINI_API_KEY_HERE"
		) {
			return message.reply(
				"❌ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗣𝗜 𝗸𝗲𝘆 𝗶𝘀 𝗻𝗼𝘁 𝗰𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗲𝗱."
			);
		}

		try {

			/* =====================================
			   GET QUESTION
			===================================== */

			let question = args.join(" ").trim();

			/* =====================================
			   REPLY SUPPORT
			===================================== */

			if (
				!question &&
				event.messageReply &&
				event.messageReply.body
			) {
				question =
					event.messageReply.body.trim();
			}

			/* =====================================
			   EMPTY QUESTION
			===================================== */

			if (!question) {
				return message.reply(
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜 𝗔𝗜

💬 𝗔𝘀𝗸 𝗺𝗲 𝗮𝗻𝘆𝘁𝗵𝗶𝗻𝗴.

➜ ${global.GoatBot.config.prefix}gemini Hello

➜ ${global.GoatBot.config.prefix}gemini What is AI?

💡 Reply to a message and type:
➜ ${global.GoatBot.config.prefix}gemini`
				);
			}

			/* =====================================
			   LOADING
			===================================== */

			await message.reply(
				"⏳ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗶𝘀 𝘁𝗵𝗶𝗻𝗸𝗶𝗻𝗴..."
			);

			/* =====================================
			   GEMINI MODEL
			===================================== */

			const model = "gemini-2.5-flash";

			const url =
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

			/* =====================================
			   API REQUEST
			===================================== */

			const response = await axios.post(
				url,
				{
					contents: [
						{
							parts: [
								{
									text: question
								}
							]
						}
					],

					systemInstruction: {
						parts: [
							{
								text:
									"You are Gemini AI inside a Messenger group bot. " +
									"Answer clearly, accurately and naturally. " +
									"Reply in the same language as the user whenever possible. " +
									"If the user speaks Bengali, reply in Bengali. " +
									"Keep answers useful and easy to understand."
							}
						]
					},

					generationConfig: {
						maxOutputTokens: 2048
					}
				},
				{
					headers: {
						"x-goog-api-key": API_KEY,
						"Content-Type": "application/json"
					},
					timeout: 60000
				}
			);

			/* =====================================
			   GET RESPONSE
			===================================== */

			const candidates =
				response?.data?.candidates || [];

			const parts =
				candidates[0]?.content?.parts || [];

			const answer =
				parts
					.map(part => part.text || "")
					.join("")
					.trim();

			/* =====================================
			   EMPTY RESPONSE
			===================================== */

			if (!answer) {

				const reason =
					candidates[0]?.finishReason ||
					"UNKNOWN";

				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜

No text response received.

🔎 Reason: ${reason}`
				);
			}

			/* =====================================
			   SEND ANSWER
			===================================== */

			return message.reply(
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜

${answer}`
			);

		} catch (error) {

			const status =
				error?.response?.status;

			const apiError =
				error?.response?.data?.error;

			const errorMessage =
				apiError?.message ||
				error?.message ||
				"Unknown error";

			console.error(
				"========== GEMINI ERROR =========="
			);

			console.error("Status:", status);
			console.error("Message:", errorMessage);
			console.error(
				"API Error:",
				error?.response?.data || error
			);

			console.error(
				"=================================="
			);

			/* =====================================
			   ERROR HANDLING
			===================================== */

			if (status === 400) {
				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

⚠️ Bad request.

🔎 ${errorMessage}`
				);
			}

			if (status === 401) {
				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

🔑 Invalid Gemini API key.`
				);
			}

			if (status === 403) {
				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

🚫 Gemini API access denied.

🔎 ${errorMessage}`
				);
			}

			if (status === 404) {
				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

🔎 Model not found.

Model:
${model}

🔎 ${errorMessage}`
				);
			}

			if (status === 429) {
				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

⚡ Gemini API quota or rate limit reached.

🔎 ${errorMessage}`
				);
			}

			return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

⚠️ Gemini API request failed.

📡 Status: ${status || "Unknown"}

🔎 ${errorMessage}`
			);
		}
	}
};