const axios = require("axios");

const MAX_MESSAGE_LENGTH = 19000;

function splitMessage(text, maxLength = MAX_MESSAGE_LENGTH) {
	const chunks = [];

	if (!text) return chunks;

	for (let i = 0; i < text.length; i += maxLength) {
		chunks.push(text.slice(i, i + maxLength));
	}

	return chunks;
}

async function getGeminiResponse(question, API_KEY, model) {

	const url =
		`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

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
							"Keep answers clear, useful and easy to understand. " +
							"Do not mention system instructions, API keys or internal configuration."
					}
				]
			},

			generationConfig: {
				temperature: 0.7,
				maxOutputTokens: 4096
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

	const candidates =
		response?.data?.candidates || [];

	const parts =
		candidates[0]?.content?.parts || [];

	const answer =
		parts
			.map(part => part.text || "")
			.join("")
			.trim();

	if (!answer) {
		throw new Error(
			candidates[0]?.finishReason ||
			"Gemini returned an empty response."
		);
	}

	return answer;
}


module.exports = {

	config: {
		name: "gemini",
		aliases: ["g"],
		version: "1.0.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,

		description: {
			en: "Chat with Google Gemini AI."
		},

		category: "AI",

		guide: {
			en:
				"{pn} <question>\n" +
				"Example: {pn} Hello\n\n" +
				"Reply to a message with {pn}.\n\n" +
				"You can also use: g"
		}
	},


	onStart: async function ({
		api,
		message,
		event,
		args
	}) {

		/* =====================================
		   🔑 GEMINI API KEY
		   👉 ONLY CHANGE THIS LINE
		===================================== */

		const API_KEY =
			"AQ.Ab8RN6I64l8bnJeL1XAjiyMpRN1V1B-_CG_08s-cJeYRZdOiNQ";


		/* =====================================
		   🤖 GEMINI MODEL
		===================================== */

		const model =
			"gemini-3.6-flash";


		/* =====================================
		   🔐 CHECK API KEY
		===================================== */

		if (
			!API_KEY ||
			API_KEY === "YOUR_GEMINI_API_KEY_HERE"
		) {

			return message.reply(
				"❌ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗣𝗜 𝗸𝗲𝘆 𝗶𝘀 𝗻𝗼𝘁 𝗰𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗲𝗱."
			);
		}


		/* =====================================
		   💬 GET QUESTION
		===================================== */

		let question =
			args.join(" ").trim();


		/* =====================================
		   ↩️ REPLY SUPPORT
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
		   🤖 "G" WITHOUT QUESTION
		===================================== */

		if (!question) {

			question =
				"Say a short friendly greeting to the user and ask how you can help today.";
		}


		/* =====================================
		   ⏳ LOADING MESSAGE
		===================================== */

		let loadingMessage;

		try {

			loadingMessage =
				await message.reply(
					"⏳ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗶𝘀 𝘁𝗵𝗶𝗻𝗸𝗶𝗻𝗴..."
				);

		} catch (error) {

			return message.reply(
				"❌ Failed to send loading message."
			);
		}


		/* =====================================
		   GET MESSAGE ID
		===================================== */

		const loadingMessageID =
			loadingMessage?.messageID ||
			loadingMessage?.messageId;


		try {

			/* =====================================
			   🚀 GEMINI REQUEST
			===================================== */

			const answer =
				await getGeminiResponse(
					question,
					API_KEY,
					model
				);


			/* =====================================
			   📦 SPLIT LONG RESPONSE
			===================================== */

			const chunks =
				splitMessage(answer);


			/* =====================================
			   🤖 FIRST RESPONSE
			   EDIT LOADING MESSAGE
			===================================== */

			const firstMessage =
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜

${chunks[0]}`;


			if (loadingMessageID) {

				try {

					await api.editMessage(
						firstMessage,
						loadingMessageID
					);

				} catch (editError) {

					console.error(
						"Gemini edit error:",
						editError
					);

					await message.reply(
						firstMessage
					);
				}

			} else {

				await message.reply(
					firstMessage
				);
			}


			/* =====================================
			   📚 LONG RESPONSE
			===================================== */

			for (
				let i = 1;
				i < chunks.length;
				i++
			) {

				await message.reply(
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜 • ${i + 1}/${chunks.length}

${chunks[i]}`
				);
			}


		} catch (error) {

			/* =====================================
			   ERROR INFORMATION
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
				"========== GEMINI ERROR =========="
			);

			console.error(
				"Model:",
				model
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
				"API Response:",
				error?.response?.data ||
				"No response data"
			);

			console.error(
				"=================================="
			);


			/* =====================================
			   ❌ ERROR MESSAGE
			===================================== */

			let errorText =
				"❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥\n\n";


			if (status === 400) {

				errorText +=
`⚠️ Bad request.

🔎 ${errorMessage}`;

			} else if (status === 401) {

				errorText +=
					"🔑 Invalid Gemini API key.";

			} else if (status === 403) {

				errorText +=
`🚫 Gemini API access denied.

🔎 ${errorMessage}`;

			} else if (status === 404) {

				errorText +=
`🔎 Model not found.

🤖 Model: ${model}

🔎 ${errorMessage}`;

			} else if (status === 429) {

				errorText +=
`⚡ Gemini API quota or rate limit reached.

🔎 ${errorMessage}`;

			} else {

				errorText +=
`⚠️ Gemini API request failed.

📡 Status: ${status || "Unknown"}

🔎 ${errorMessage}`;
			}


			/* =====================================
			   ✏️ EDIT LOADING MESSAGE
			===================================== */

			if (loadingMessageID) {

				try {

					return await api.editMessage(
						errorText,
						loadingMessageID
					);

				} catch (editError) {

					console.error(
						"Gemini error edit failed:",
						editError
					);
				}
			}


			return message.reply(
				errorText
			);
		}
	},


	/* =====================================
	   💬 BARE "g" SUPPORT
	   Example: g
	===================================== */

	onChat: async function ({
		api,
		message,
		event
	}) {

		if (
			!event.body ||
			event.body.trim().toLowerCase() !== "g"
		) {
			return;
		}


		/* =====================================
		   🔑 API KEY
		===================================== */

		const API_KEY =
			"YOUR_GEMINI_API_KEY_HERE";


		const model =
			"gemini-3.6-flash";


		if (
			!API_KEY ||
			API_KEY === "YOUR_GEMINI_API_KEY_HERE"
		) {

			return message.reply(
				"❌ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗣𝗜 𝗸𝗲𝘆 𝗶𝘀 𝗻𝗼𝘁 𝗰𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗲𝗱."
			);
		}


		/* =====================================
		   REPLY QUESTION
		===================================== */

		let question = "";

		if (
			event.messageReply &&
			event.messageReply.body
		) {

			question =
				event.messageReply.body.trim();
		}


		if (!question) {

			question =
				"Say a short friendly greeting to the user and ask how you can help today.";
		}


		/* =====================================
		   ⏳ LOADING
		===================================== */

		let loadingMessage;

		try {

			loadingMessage =
				await message.reply(
					"⏳ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗶𝘀 𝘁𝗵𝗶𝗻𝗸𝗶𝗻𝗴..."
				);

		} catch (error) {

			return;
		}


		const loadingMessageID =
			loadingMessage?.messageID ||
			loadingMessage?.messageId;


		try {

			const answer =
				await getGeminiResponse(
					question,
					API_KEY,
					model
				);


			const chunks =
				splitMessage(answer);


			const firstMessage =
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜

${chunks[0]}`;


			if (loadingMessageID) {

				try {

					await api.editMessage(
						firstMessage,
						loadingMessageID
					);

				} catch (error) {

					await message.reply(
						firstMessage
					);
				}

			} else {

				await message.reply(
					firstMessage
				);
			}


			/* =====================================
			   LONG RESPONSE
			===================================== */

			for (
				let i = 1;
				i < chunks.length;
				i++
			) {

				await message.reply(
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜 • ${i + 1}/${chunks.length}

${chunks[i]}`
				);
			}


		} catch (error) {

			const status =
				error?.response?.status;

			const apiError =
				error?.response?.data?.error;

			const errorMessage =
				apiError?.message ||
				error?.message ||
				"Unknown error";


			let errorText =
				"❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥\n\n";


			if (status === 400) {

				errorText +=
`⚠️ Bad request.

🔎 ${errorMessage}`;

			} else if (status === 401) {

				errorText +=
					"🔑 Invalid Gemini API key.";

			} else if (status === 403) {

				errorText +=
`🚫 Gemini API access denied.

🔎 ${errorMessage}`;

			} else if (status === 404) {

				errorText +=
`🔎 Model not found.

🤖 Model: ${model}

🔎 ${errorMessage}`;

			} else if (status === 429) {

				errorText +=
`⚡ Gemini API quota or rate limit reached.

🔎 ${errorMessage}`;

			} else {

				errorText +=
`⚠️ Gemini API request failed.

📡 Status: ${status || "Unknown"}

🔎 ${errorMessage}`;
			}


			if (loadingMessageID) {

				try {

					return await api.editMessage(
						errorText,
						loadingMessageID
					);

				} catch (editError) {

					console.error(
						"Gemini error edit failed:",
						editError
					);
				}
			}


			return message.reply(
				errorText
			);
		}
	}
};