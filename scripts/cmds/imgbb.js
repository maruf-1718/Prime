const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_KEY = "e268e37c013a8e9b4fb8fde5205d0145";

module.exports = {
	config: {
		name: "imgbb",
		version: "2.0.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,
		category: "tools",

		shortDescription: "Upload replied image to ImgBB",

		longDescription:
			"Reply to an image with imgbb to upload it to ImgBB.",

		guide: {
			en: "{pn} (reply to an image)"
		}
	},

	onStart: async function ({ api, event }) {

		let filePath = null;

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

			const attachment =
				reply.attachments.find(
					a =>
						a.type === "photo" ||
						a.type === "image"
				);

			if (
				!attachment ||
				!attachment.url
			) {
				return api.sendMessage(
					"❌ No image found in the replied message.",
					event.threadID,
					event.messageID
				);
			}

			/* =========================
			   DOWNLOAD IMAGE
			========================= */

			const imageResponse =
				await axios.get(
					attachment.url,
					{
						responseType: "arraybuffer",
						timeout: 30000
					}
				);

			const imageBuffer =
				Buffer.from(
					imageResponse.data
				);

			if (!imageBuffer.length) {
				throw new Error(
					"Empty image"
				);
			}

			/* =========================
			   BASE64
			========================= */

			const base64Image =
				imageBuffer.toString("base64");

			/* =========================
			   IMGBB UPLOAD
			========================= */

			const uploadURL =
				"https://api.imgbb.com/1/upload";

			const form =
				new URLSearchParams();

			form.append(
				"key",
				API_KEY
			);

			form.append(
				"image",
				base64Image
			);

			const uploadResponse =
				await axios.post(
					uploadURL,
					form.toString(),
					{
						headers: {
							"Content-Type":
								"application/x-www-form-urlencoded"
						},

						timeout: 60000
					}
				);

			const data =
				uploadResponse.data;

			/* =========================
			   CHECK RESPONSE
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

			const imageURL =
				data.data.url;

			/* =========================
			   DOWNLOAD FROM IMGBB
			========================= */

			const uploadedImage =
				await axios.get(
					imageURL,
					{
						responseType: "arraybuffer",
						timeout: 30000
					}
				);

			/* =========================
			   CACHE
			========================= */

			const cacheDir =
				path.join(
					__dirname,
					"cache"
				);

			await fs.ensureDir(
				cacheDir
			);

			filePath =
				path.join(
					cacheDir,
					`imgbb_${Date.now()}.jpg`
				);

			await fs.writeFile(
				filePath,
				Buffer.from(
					uploadedImage.data
				)
			);

			/* =========================
			   SEND ONLY IMAGE
			========================= */

			await api.sendMessage(
				{
					attachment:
						fs.createReadStream(
							filePath
						)
				},
				event.threadID,
				event.messageID
			);

			/* =========================
			   DELETE CACHE
			========================= */

			setTimeout(() => {

				try {

					if (
						filePath &&
						fs.existsSync(filePath)
					) {
						fs.unlinkSync(
							filePath
						);
					}

				} catch (err) {

					console.error(
						"Cache delete error:",
						err
					);

				}

			}, 15000);

		} catch (error) {

			console.error(
				"IMGBB ERROR:",
				error.response?.data ||
				error.message ||
				error
			);

			/* Cleanup */

			if (
				filePath &&
				fs.existsSync(filePath)
			) {
				try {
					fs.unlinkSync(
						filePath
					);
				} catch (_) {}
			}

			return api.sendMessage(
				"❌ Image upload failed.",
				event.threadID,
				event.messageID
			);
		}
	}
};