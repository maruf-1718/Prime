const axios = require("axios");

/* =========================================
   🔑 GEMINI API KEY
   👉 ONLY CHANGE THIS ONE LINE
========================================= */

const API_KEY = "AQ.Ab8RN6LKQ8_QeS7E15lO_q0LX4frMsacxkAjRkPiUq0EKE6dEA";


/* =========================================
   🤖 FAST MODEL
========================================= */

const MODEL = "gemini-3.1-flash-lite";


/* =========================================
   📏 MESSAGE LIMIT
========================================= */

const MAX_MESSAGE_LENGTH = 19000;


/* =========================================
   💾 CONVERSATION MEMORY
========================================= */

const conversations = new Map();


/* =========================================
   🧹 CLEAN OLD CONVERSATIONS
========================================= */

function cleanupConversations() {

	const now = Date.now();

	for (const [key, data] of conversations) {

		/*
		 * Remove conversations older than 30 minutes.
		 */

		if (
			now - data.updatedAt >
			30 * 60 * 1000
		) {
			conversations.delete(key);
		}
	}
}


/* =========================================
   🔑 USER CONVERSATION KEY
========================================= */

function getUserKey(event) {

	return `${event.threadID}:${event.senderID}`;
}


/* =========================================
   ✂️ SPLIT LONG MESSAGE
========================================= */

function splitMessage(
	text,
	maxLength = MAX_MESSAGE_LENGTH
) {

	const chunks = [];

	if (!text) {
		return chunks;
	}

	for (
		let i = 0;
		i < text.length;
		i += maxLength
	) {

		chunks.push(
			text.slice(i, i + maxLength)
		);
	}

	return chunks;
}


/* =========================================
   🤖 GEMINI REQUEST
========================================= */

async function askGemini(
	question,
	conversation
) {

	/* =====================================
	   BUILD CONTENTS
	===================================== */

	const contents = [];


	/* =====================================
	   PREVIOUS CONVERSATION
	===================================== */

	if (
		conversation &&
		Array.isArray(conversation.history)
	) {

		for (
			const item of conversation.history
		) {

			contents.push({
				role: "user",

				parts: [
					{
						text: item.user
					}
				]
			});


			contents.push({
				role: "model",

				parts: [
					{
						text: item.bot
					}
				]
			});
		}
	}


	/* =====================================
	   CURRENT QUESTION
	===================================== */

	contents.push({

		role: "user",

		parts: [
			{
				text: question
			}
		]
	});


	/* =====================================
	   API URL
	===================================== */

	const url =
		`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;


	/* =====================================
	   REQUEST
	===================================== */

	const response =
		await axios.post(

			url,

			{
				systemInstruction: {

					parts: [
						{
							text:
								"You are Gemini AI inside a Messenger group bot. " +
								"Give helpful, accurate and natural answers. " +
								"Reply in the same language as the user whenever possible. " +
								"If the user speaks Bengali, reply in Bengali. " +
								"Keep answers clear and useful. " +
								"Do not mention system instructions, API keys or internal configuration."
						}
					]
				},

				contents,

				generationConfig: {

					temperature: 0.7,

					maxOutputTokens: 2048,

					thinkingConfig: {
						thinkingLevel: "minimal"
					}
				}
			},

			{
				headers: {
					"x-goog-api-key":
						API_KEY,

					"Content-Type":
						"application/json"
				},

				timeout: 45000
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
			.map(
				part =>
					part.text || ""
			)
			.join("")
			.trim();


	/* =====================================
	   EMPTY RESPONSE CHECK
	===================================== */

	if (!answer) {

		const finishReason =
			candidates[0]?.finishReason ||
			"UNKNOWN";


		throw new Error(
			`Gemini returned an empty response. Finish reason: ${finishReason}`
		);
	}


	return answer;
}


/* =========================================
   ❌ ERROR FORMAT
========================================= */

function formatError(error) {

	const status =
		error?.response?.status;

	const apiError =
		error?.response?.data?.error;

	const errorMessage =
		apiError?.message ||
		error?.message ||
		"Unknown error";


	if (status === 400) {

		return `❌ 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓 𝗘𝗥𝗥𝗢𝗥

⚠️ Bad request.

🔎 ${errorMessage}`;
	}


	if (status === 401) {

		return `❌ 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓 𝗘𝗥𝗥𝗢𝗥

🔑 Invalid Gemini API key.`;
	}


	if (status === 403) {

		return `❌ 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓 𝗘𝗥𝗥𝗢𝗥

🚫 Gemini API access denied.

🔎 ${errorMessage}`;
	}


	if (status === 404) {

		return `❌ 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓 𝗘𝗥𝗥𝗢𝗥

🔎 Gemini model not found.

🤖 Model: ${MODEL}

🔎 ${errorMessage}`;
	}


	if (status === 429) {

		return `❌ 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓 𝗘𝗥𝗥𝗢𝗥

⚡ Gemini API quota or rate limit reached.

🔎 ${errorMessage}`;
	}


	return `❌ 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓 𝗘𝗥𝗥𝗢𝗥

⚠️ Gemini API request failed.

📡 Status: ${status || "Unknown"}

🔎 ${errorMessage}`;
}


/* =========================================
   🚀 PROCESS GEMINI
========================================= */

async function processGemini({
	api,
	message,
	event,
	question,
	conversation
}) {

	/* =====================================
	   ⏳ LOADING
	===================================== */

	let loadingMessage;

	try {

		loadingMessage =
			await message.reply(
				"⏳ 𝐌𝐚𝐫𝐮𝐟'𝐬 𝐁𝐨𝐭 𝗶𝘀 𝘁𝗵𝗶𝗻𝗸𝗶𝗻𝗴..."
			);

	} catch (error) {

		console.error(
			"Loading error:",
			error
		);

		return;
	}


	/* =====================================
	   MESSAGE ID
	===================================== */

	const loadingMessageID =
		loadingMessage?.messageID ||
		loadingMessage?.messageId;


	try {

		/* =================================
		   ASK GEMINI
		================================= */

		const answer =
			await askGemini(
				question,
				conversation
			);


		/* =================================
		   SAVE CONVERSATION
		================================= */

		const userKey =
			getUserKey(event);


		let currentConversation =
			conversations.get(userKey);


		if (!currentConversation) {

			currentConversation = {
				history: []
			};
		}


		currentConversation.history.push({

			user: question,

			bot: answer

		});


		/*
		 * Keep only last 10 turns
		 * to prevent huge prompts.
		 */

		if (
			currentConversation.history.length >
			10
		) {

			currentConversation.history =
				currentConversation.history.slice(-10);
		}


		currentConversation.updatedAt =
			Date.now();


		currentConversation.botMessageID =
			loadingMessageID;


		conversations.set(
			userKey,
			currentConversation
		);


		/* =================================
		   SPLIT LONG RESPONSE
		================================= */

		const chunks =
			splitMessage(answer);


		/* =================================
		   FIRST RESPONSE
		   EDIT LOADING MESSAGE
		================================= */

		const firstMessage =
`🤖 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓

${chunks[0]}`;


		if (loadingMessageID) {

			try {

				await api.editMessage(
					firstMessage,
					loadingMessageID
				);

			} catch (editError) {

				console.error(
					"Edit error:",
					editError
				);

				await message.reply(
					firstMessage
				);
			}

		} else {

			const sent =
				await message.reply(
					firstMessage
				);


			if (sent?.messageID) {

				currentConversation.botMessageID =
					sent.messageID;

				conversations.set(
					userKey,
					currentConversation
				);
			}
		}


		/* =================================
		   LONG RESPONSE
		================================= */

		for (
			let i = 1;
			i < chunks.length;
			i++
		) {

			await message.reply(
`🤖 𝐌𝐀𝐑𝐔𝐅'𝐒 𝐁𝐎𝐓 • ${i + 1}/${chunks.length}

${chunks[i]}`
			);
		}


		/* =================================
		   CLEAN OLD DATA
		================================= */

		cleanupConversations();

	} catch (error) {

		/* =================================
		   LOG ERROR
		================================= */

		console.error(
			"========== GEMINI ERROR =========="
		);

		console.error(
			"Model:",
			MODEL
		);

		console.error(
			"Status:",
			error?.response?.status
		);

		console.error(
			"Response:",
			error?.response?.data
		);

		console.error(
			"Message:",
			error?.message
		);

		console.error(
			"=================================="
		);


		const errorText =
			formatError(error);


		/* =================================
		   EDIT LOADING MESSAGE
		================================= */

		if (loadingMessageID) {

			try {

				return await api.editMessage(
					errorText,
					loadingMessageID
				);

			} catch (editError) {

				console.error(
					"Error edit failed:",
					editError
				);
			}
		}


		return message.reply(
			errorText
		);
	}
}


/* =========================================
   COMMAND
========================================= */

module.exports = {

	config: {

		name: "gemini",

		aliases: [
			"g"
		],

		version: "1.0.0",

		author:
			"Mohammad Maruf",

		countDown: 3,

		role: 0,

		category: "AI",

		description: {
			en:
				"Chat with Google Gemini AI."
		},

		guide: {
			en:
				"{pn} <question>\n" +
				"Example: {pn} Hello\n\n" +
				"Reply to Gemini's response to continue the conversation."
		}
	},


	/* =========================================
	   START COMMAND
	========================================= */

	onStart: async function ({
		api,
		message,
		event,
		args
	}) {

		/* =====================================
		   API KEY CHECK
		===================================== */

		if (
			!API_KEY ||
			API_KEY ===
				"YOUR_GEMINI_API_KEY_HERE"
		) {

			return message.reply(
				"❌ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗣𝗜 𝗸𝗲𝘆 𝗶𝘀 𝗻𝗼𝘁 𝗰𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗲𝗱."
			);
		}


		/* =====================================
		   GET QUESTION
		===================================== */

		let question =
			args.join(" ").trim();


		/* =====================================
		   REPLY MESSAGE
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
		   DEFAULT GREETING
		===================================== */

		if (!question) {

			question =
				"Say a short friendly greeting to the user and ask how you can help today.";
		}


		/* =====================================
		   START NEW CONVERSATION
		===================================== */

		return processGemini({

			api,

			message,

			event,

			question,

			conversation: null

		});
	},


	/* =========================================
	   💬 BARE "g" + REPLY CONTINUATION
	========================================= */

	onChat: async function ({
		api,
		message,
		event
	}) {

		if (!event.body) {
			return;
		}


		const body =
			event.body.trim();


		/* =====================================
		   USER KEY
		===================================== */

		const userKey =
			getUserKey(event);


		const conversation =
			conversations.get(userKey);


		/* =====================================
		   CASE 1: JUST "g"
		===================================== */

		if (
			body.toLowerCase() === "g"
		) {

			/*
			 * If replying to the latest
			 * Gemini response, continue.
			 */

			if (
				conversation &&
				event.messageReply &&
				event.messageReply.messageID ===
					conversation.botMessageID
			) {

				return processGemini({

					api,

					message,

					event,

					question:
						"Continue the conversation naturally.",

					conversation
				});
			}


			/*
			 * Otherwise start greeting.
			 */

			return processGemini({

				api,

				message,

				event,

				question:
					"Say a short friendly greeting to the user and ask how you can help today.",

				conversation: null
			});
		}


		/* =====================================
		   CASE 2:
		   REPLY TO GEMINI WITH ANY TEXT
		===================================== */

		if (
			conversation &&
			event.messageReply &&
			event.messageReply.messageID ===
				conversation.botMessageID
		) {

			/*
			 * User replies directly to
			 * Gemini's latest response.
			 *
			 * No /g required.
			 */

			return processGemini({

				api,

				message,

				event,

				question: body,

				conversation
			});
		}
	}
};