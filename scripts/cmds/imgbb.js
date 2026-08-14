const axios = require("axios");

const API_KEY = "e268e37c013a8e9b4fb8fde5205d0145";

module.exports = {
	config: {
		name: "imgbb",
		version: "2.1.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,
		category: "tools",

		shortDescription: "Upload replied image to ImgBB",

		longDescription:
			"Reply to an image with imgbb to upload it and get the direct ImgBB link.",

		guide: {
			en: "{pn} (reply to an image)"
		}
	},

	onStart: async function ({ api, event }) {

		try {

			/* =========================
			   CHECK REPLY
			========================= */

			const reply = event.messageReply;

			if (
				!reply ||
				!reply.attachments ||
				!reply.attachments.length
			) {
				return api.sendMessage(
					"❌ Please reply to an image.",
					event.threadID,
					event.messageID
				);
			}

			/* =========================
			   FIND IMAGE
			========================= */

			const attachment = reply.attachments.find(
				a =>
					(
						a.type === "photo" ||
						a.type === "image"
					) &&
					a.url
			);

			if (!attachment) {
				return api.sendMessage(
					"❌ No image found in the replied message.",
					event.threadID,
					event.messageID
				);
			}

			/* =========================
			   DOWNLOAD IMAGE
			========================= */

			const imageResponse = await axios.get(
				attachment.url,
				{
					responseType: "arraybuffer",
					timeout: 30000
				}
			);

			const imageBuffer = Buffer.from(
				imageResponse.data
			);

			if (!imageBuffer.length) {
				throw new Error("Empty image received");
			}

			/* =========================
			   CONVERT TO BASE64
			========================= */

			const base64Image =
				imageBuffer.toString("base64");

			/* =========================
			   UPLOAD TO IMGBB
			========================= */

			const form = new URLSearchParams();

			form.append("key", API_KEY);
			form.append("image", base64Image);

			const response = await axios.post(
				"https://api.imgbb.com/1/upload",
				form.toString(),
				{
					headers: {
						"Content-Type":
							"application/x-www-form-urlencoded"
					},
					timeout: 60000
				}
			);

			const data = response.data;

			/* =========================
			   GET DIRECT LINK
			========================= */

			if (
				!data ||
				!data.success ||
				!data.data ||
				!data.data.url
			) {
				console.error(
					"ImgBB Response:",
					data
				);

				throw new Error(
					"ImgBB upload failed"
				);
			}

			const imageURL = data.data.url;

			/* =========================
			   SEND ONLY LINK
			========================= */

			return api.sendMessage(
				imageURL,
				event.threadID,
				event.messageID
			);

		} catch (error) {

			console.error(
				"IMGBB ERROR:",
				error.response?.data ||
				error.message ||
				error
			);

			return api.sendMessage(
				"❌ Image upload failed.",
				event.threadID,
				event.messageID
			);
		}
	}
};