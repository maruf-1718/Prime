const { GoogleGenAI } = require("@google/genai");

module.exports = {
	config: {
		name: "gemini",
		aliases: ["ai", "ask"],
		version: "1.0.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,

		description: {
			en: "Chat with Gemini AI."
		},

		category: "ai",

		guide: {
			en:
				"{pn} <question>\n" +
				"Example: {pn} Hello\n\n" +
				"Reply to a message with {pn} to ask Gemini about it."
		}
	},

	onStart: async function ({
		message,
		event,
		args
	}) {

		try {

			/* =========================
			   GEMINI API KEY
			========================= */

			const API_KEY =
				"AQ.Ab8RN6I64l8bnJeL1XAjiyMpRN1V1B-_CG_08s-cJeYRZdOiNQ";

			if (
				!API_KEY ||
				API_KEY === "YOUR_GEMINI_API_KEY_HERE"
			) {
				return message.reply(
					"❌ Gemini API key is not configured."
				);
			}

			/* =========================
			   GEMINI CLIENT
			========================= */

			const ai = new GoogleGenAI({
				apiKey: API_KEY
			});

			/* =========================
			   GET QUESTION
			========================= */

			let question =
				args.join(" ").trim();

			// If command has no text,
			// use replied message
			if (
				!question &&
				event.messageReply &&
				event.messageReply.body
			) {
				question =
					event.messageReply.body.trim();
			}

			if (!question) {
				return message.reply(
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜 𝗔𝗜

💬 Ask me anything.

➜ ${global.GoatBot.config.prefix}gemini Hello

Or reply to a message and type:
➜ ${global.GoatBot.config.prefix}gemini`
				);
			}

			/* =========================
			   LOADING
			========================= */

			let loadingMessage = null;

			try {
				loadingMessage =
					await message.reply(
						"⏳ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗶𝘀 𝘁𝗵𝗶𝗻𝗸𝗶𝗻𝗴..."
					);
			} catch (_) {}

			/* =========================
			   GEMINI REQUEST
			========================= */

			const response =
				await ai.models.generateContent({
					model: "gemini-3.6-flash",

					contents: question,

					config: {
						systemInstruction:
							"You are Gemini AI inside a Messenger bot. " +
							"Give helpful, accurate and natural answers. " +
							"Reply in the same language as the user whenever possible. " +
							"Keep answers clear and readable.",

						temperature: 0.7,

						maxOutputTokens: 2048
					}
				});

			/* =========================
			   GET RESPONSE
			========================= */

			const answer =
				response.text?.trim();

			if (!answer) {
				return message.reply(
					"❌ Gemini returned an empty response."
				);
			}

			/* =========================
			   SEND ANSWER
			========================= */

			return message.reply(
				`🤖 𝗚𝗘𝗠𝗜𝗡𝗜

${answer}`
			);

		} catch (error) {

			console.error(
				"GEMINI ERROR:",
				error?.response?.data ||
				error?.message ||
				error
			);

			return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

Gemini API request failed.

Please check:
• API key
• API quota
• Model availability
• Internet connection`
			);
		}
	}
};