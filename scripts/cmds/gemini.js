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

	onStart: async function ({
		message,
		event,
		args
	}) {

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

			let question = args
				.join(" ")
				.trim();


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
			   GEMINI API
			===================================== */

			const url =
				"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";


			const response = await axios.post(
				url,

				{
					contents: [
						{
							role: "user",
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
									"Give helpful, accurate and natural answers. " +
									"Reply in the same language as the user whenever possible. " +
									"If the user speaks Bengali, reply in Bengali. " +
									"Keep answers clear and easy to understand."
							}
						]
					},

					generationConfig: {
						temperature: 0.7,
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
			   GET GEMINI RESPONSE
			===================================== */

			const candidates =
				response?.data?.candidates;

			if (
				!candidates ||
				!candidates.length
			) {
				throw new Error(
					"Gemini returned no candidates."
				);
			}


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

				const finishReason =
					candidates[0]?.finishReason ||
					"UNKNOWN";

				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜

No text response received.

𝗥𝗲𝗮𝘀𝗼𝗻: ${finishReason}`
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

			/* =====================================
			   GET API ERROR
			===================================== */

			const status =
				error?.response?.status;

			const apiError =
				error?.response?.data?.error;

			const errorMessage =
				apiError?.message ||
				error?.message ||
				"Unknown error";


			console.error(
				"========== GEMINI API ERROR =========="
			);

			console.error(
				"Status:",
				status
			);

			console.error(
				"Message:",
				errorMessage
			);

			console.error(
				"API Error:",
				apiError
			);

			console.error(
				"======================================"
			);


			/* =====================================
			   USER-FRIENDLY ERROR
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

🔑 API key is invalid or unauthorized.`
				);
			}


			if (status === 403) {

				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

🚫 API access is forbidden.

Check whether your Gemini API key/project has access to the Gemini API.`
				);
			}


			if (status === 404) {

				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

🔎 Gemini model or endpoint was not found.`
				);
			}


			if (status === 429) {

				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

⚡ Gemini API quota or rate limit reached.

Please try again later.`
				);
			}


			return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

⚠️ Gemini API request failed.

🔎 ${errorMessage}`
			);
		}
	}
};