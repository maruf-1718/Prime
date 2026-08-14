const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const TEXT_MODEL = "gemini-3.6-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image";

const MAX_MESSAGE_LENGTH = 19000;


/* =========================================
   SPLIT LONG TEXT
========================================= */

function splitMessage(text, maxLength = MAX_MESSAGE_LENGTH) {
	const chunks = [];

	if (!text) return chunks;

	for (let i = 0; i < text.length; i += maxLength) {
		chunks.push(text.slice(i, i + maxLength));
	}

	return chunks;
}


/* =========================================
   GET QUESTION
========================================= */

function getQuestion(event, args) {

	let question = args.join(" ").trim();

	if (
		!question &&
		event.messageReply &&
		event.messageReply.body
	) {
		question = event.messageReply.body.trim();
	}

	return question;
}


/* =========================================
   TEXT GEMINI
========================================= */

async function askGemini(question, API_KEY) {

	const url =
		`https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent`;

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

	const parts =
		response?.data?.candidates?.[0]?.content?.parts || [];

	const answer =
		parts
			.map(part => part.text || "")
			.join("")
			.trim();

	if (!answer) {
		throw new Error(
			"Gemini returned an empty response."
		);
	}

	return answer;
}


/* =========================================
   DOWNLOAD REPLIED IMAGE
========================================= */

async function downloadImage(url) {

	const response = await axios.get(
		url,
		{
			responseType: "arraybuffer",
			timeout: 60000
		}
	);

	const contentType =
		response.headers["content-type"] ||
		"image/jpeg";

	let extension = ".jpg";

	if (contentType.includes("png")) {
		extension = ".png";
	} else if (contentType.includes("webp")) {
		extension = ".webp";
	} else if (contentType.includes("gif")) {
		extension = ".gif";
	}

	const cacheDir =
		path.join(__dirname, "cache");

	await fs.ensureDir(cacheDir);

	const filePath =
		path.join(
			cacheDir,
			`gemini_input_${Date.now()}${extension}`
		);

	const buffer =
		Buffer.from(response.data);

	await fs.writeFile(
		filePath,
		buffer
	);

	return {
		filePath,
		buffer,
		mimeType: contentType
	};
}


/* =========================================
   GENERATE / EDIT IMAGE
========================================= */

async function generateImage({
	prompt,
	API_KEY,
	imageData = null,
	mimeType = null
}) {

	const input = [];


	/* TEXT PROMPT */

	input.push({
		type: "text",
		text: prompt
	});


	/* REPLIED IMAGE */

	if (imageData) {

		input.push({
			type: "image",
			mime_type:
				mimeType || "image/jpeg",
			data:
				imageData.toString("base64")
		});
	}


	const response =
		await axios.post(

			"https://generativelanguage.googleapis.com/v1beta/interactions",

			{
				model: IMAGE_MODEL,

				input,

				response_format: {
					type: "image",
					mime_type: "image/jpeg",
					aspect_ratio: "1:1",
					image_size: "1K"
				}
			},

			{
				headers: {
					"x-goog-api-key": API_KEY,
					"Content-Type":
						"application/json"
				},

				timeout: 120000
			}
		);


	/* =====================================
	   GET GENERATED IMAGE
	===================================== */

	const outputImage =
		response?.data?.output_image;


	if (
		!outputImage ||
		!outputImage.data
	) {
		throw new Error(
			"Gemini did not return an image."
		);
	}


	return Buffer.from(
		outputImage.data,
		"base64"
	);
}


/* =========================================
   SEND IMAGE
========================================= */

async function sendImage(
	api,
	threadID,
	messageID,
	imageBuffer
) {

	const cacheDir =
		path.join(__dirname, "cache");

	await fs.ensureDir(cacheDir);


	/* JPEG FILE */

	const filePath =
		path.join(
			cacheDir,
			`gemini_result_${Date.now()}.jpg`
		);


	await fs.writeFile(
		filePath,
		imageBuffer
	);


	try {

		await api.sendMessage(
			{
				attachment:
					fs.createReadStream(filePath)
			},
			threadID,
			messageID
		);

	} finally {

		setTimeout(
			() => {

				try {

					if (
						fs.existsSync(filePath)
					) {
						fs.unlinkSync(filePath);
					}

				} catch (_) {}

			},
			10000
		);
	}
}


/* =========================================
   GEMINI COMMAND
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

		countDown: 5,

		role: 0,

		category: "AI",

		description: {
			en:
				"Chat with Gemini and generate/edit images."
		},

		guide: {
			en:
				"{pn} <question>\n" +
				"{pn} image <prompt>\n" +
				"Reply to an image with {pn} image <instruction>"
		}
	},


	/* =========================================
	   COMMAND START
	========================================= */

	onStart: async function ({
		api,
		message,
		event,
		args
	}) {

		/* =====================================
		   🔑 API KEY
		   👉 ONLY CHANGE THIS
		===================================== */

		const API_KEY =
			"AQ.Ab8RN6I64l8bnJeL1XAjiyMpRN1V1B-_CG_08s-cJeYRZdOiNQ";


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
		   CHECK IMAGE MODE
		===================================== */

		const firstArg =
			(args[0] || "").toLowerCase();

		const isImageMode =
			firstArg === "image" ||
			firstArg === "img" ||
			firstArg === "photo";


		/* =====================================
		   🖼️ IMAGE MODE
		===================================== */

		if (isImageMode) {

			const prompt =
				args
					.slice(1)
					.join(" ")
					.trim();


			if (!prompt) {

				return message.reply(
`🖼️ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗜𝗠𝗔𝗚𝗘

➜ ${global.GoatBot.config.prefix}g image <prompt>

Example:

➜ ${global.GoatBot.config.prefix}g image a beautiful bird

💡 Reply to an image with this command to edit it.`
				);
			}


			let loadingMessage;

			try {

				loadingMessage =
					await message.reply(
						"🎨 𝗚𝗲𝗺𝗶𝗻𝗶 𝗶𝘀 𝗰𝗿𝗲𝗮𝘁𝗶𝗻𝗴 𝘆𝗼𝘂𝗿 𝗶𝗺𝗮𝗴𝗲..."
					);

			} catch (_) {}


			const loadingMessageID =
				loadingMessage?.messageID ||
				loadingMessage?.messageId;


			let repliedImage = null;


			try {

				/* =================================
				   GET REPLIED IMAGE
				================================= */

				if (
					event.messageReply &&
					event.messageReply.attachments &&
					event.messageReply.attachments.length
				) {

					const attachment =
						event.messageReply.attachments.find(
							item =>
								item.type === "photo" ||
								item.type === "image" ||
								item.type === "animated_image"
						);

					if (attachment?.url) {

						repliedImage =
							await downloadImage(
								attachment.url
							);
					}
				}


				/* =================================
				   IMAGE PROMPT
				================================= */

				let finalPrompt =
					prompt;


				if (repliedImage) {

					finalPrompt =
`Edit the provided image according to this instruction:

${prompt}

Preserve the important details of the original image unless the instruction specifically asks to change them.`;
				}


				/* =================================
				   GENERATE IMAGE
				================================= */

				const imageBuffer =
					await generateImage({

						prompt:
							finalPrompt,

						API_KEY,

						imageData:
							repliedImage?.buffer ||
							null,

						mimeType:
							repliedImage?.mimeType ||
							null
					});


				/* =================================
				   UPDATE LOADING
				================================= */

				if (loadingMessageID) {

					try {

						await api.editMessage(
							"✅ 𝗜𝗺𝗮𝗴𝗲 𝗿𝗲𝗮𝗱𝘆! 🖼️",
							loadingMessageID
						);

					} catch (_) {}
				}


				/* =================================
				   SEND IMAGE
				================================= */

				await sendImage(
					api,
					event.threadID,
					event.messageID,
					imageBuffer
				);


				/* =================================
				   CLEAN INPUT IMAGE
				================================= */

				if (
					repliedImage?.filePath
				) {

					try {

						await fs.remove(
							repliedImage.filePath
						);

					} catch (_) {}
				}

				return;

			} catch (error) {

				console.error(
					"Gemini Image Error:",
					error?.response?.data ||
					error
				);


				const status =
					error?.response?.status;

				const apiError =
					error?.response?.data?.error;

				const errorMessage =
					apiError?.message ||
					error?.message ||
					"Unknown error";


				const errorText =
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗜𝗠𝗔𝗚𝗘 𝗘𝗥𝗥𝗢𝗥

📡 Status: ${status || "Unknown"}

🔎 ${errorMessage}`;


				if (loadingMessageID) {

					try {

						return await api.editMessage(
							errorText,
							loadingMessageID
						);

					} catch (_) {}
				}


				return message.reply(
					errorText
				);
			}
		}


		/* =====================================
		   🤖 NORMAL TEXT MODE
		===================================== */

		let question =
			getQuestion(event, args);


		if (!question) {

			question =
				"Say a short friendly greeting to the user and ask how you can help today.";
		}


		let loadingMessage;

		try {

			loadingMessage =
				await message.reply(
					"⏳ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗶𝘀 𝘁𝗵𝗶𝗻𝗸𝗶𝗻𝗴..."
				);

		} catch (_) {}


		const loadingMessageID =
			loadingMessage?.messageID ||
			loadingMessage?.messageId;


		try {

			const answer =
				await askGemini(
					question,
					API_KEY
				);


			const chunks =
				splitMessage(answer);


			const firstMessage =
`🤖 𝗚𝗘𝗠𝗜𝗡𝗜

${chunks[0]}`;


			/* =================================
			   EDIT LOADING MESSAGE
			================================= */

			if (loadingMessageID) {

				try {

					await api.editMessage(
						firstMessage,
						loadingMessageID
					);

				} catch (_) {

					await message.reply(
						firstMessage
					);
				}

			} else {

				await message.reply(
					firstMessage
				);
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


			const errorText =
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

📡 Status: ${status || "Unknown"}

🔎 ${errorMessage}`;


			if (loadingMessageID) {

				try {

					return await api.editMessage(
						errorText,
						loadingMessageID
					);

				} catch (_) {}
			}


			return message.reply(
				errorText
			);
		}
	},


	/* =========================================
	   💬 BARE "g" SUPPORT
	========================================= */

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


		const API_KEY =
			"AQ.Ab8RN6I64l8bnJeL1XAjiyMpRN1V1B-_CG_08s-cJeYRZdOiNQ";


		if (
			!API_KEY ||
			API_KEY ===
				"YOUR_GEMINI_API_KEY_HERE"
		) {

			return message.reply(
				"❌ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗔𝗣𝗜 𝗸𝗲𝘆 𝗶𝘀 𝗻𝗼𝘁 𝗰𝗼𝗻𝗳𝗶𝗴𝘂𝗿𝗲𝗱."
			);
		}


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


		let loadingMessage;

		try {

			loadingMessage =
				await message.reply(
					"⏳ 𝗚𝗲𝗺𝗶𝗻𝗶 𝗶𝘀 𝘁𝗵𝗶𝗻𝗸𝗶𝗻𝗴..."
				);

		} catch (_) {}


		const loadingMessageID =
			loadingMessage?.messageID ||
			loadingMessage?.messageId;


		try {

			const answer =
				await askGemini(
					question,
					API_KEY
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

				} catch (_) {

					await message.reply(
						firstMessage
					);
				}

			} else {

				await message.reply(
					firstMessage
				);
			}


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


			const errorText =
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗘𝗥𝗥𝗢𝗥

📡 Status: ${status || "Unknown"}

🔎 ${errorMessage}`;


			if (loadingMessageID) {

				try {

					return await api.editMessage(
						errorText,
						loadingMessageID
					);

				} catch (_) {}
			}


			return message.reply(
				errorText
			);
		}
	}
};