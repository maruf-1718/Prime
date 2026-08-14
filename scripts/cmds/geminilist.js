const axios = require("axios");

module.exports = {
	config: {
		name: "geminilist",
		version: "1.0.0",
		author: "Mohammad Maruf",
		countDown: 5,
		role: 0,
		category: "AI"
	},

	onStart: async function ({ message }) {

		const API_KEY = "AQ.Ab8RN6I64l8bnJeL1XAjiyMpRN1V1B-_CG_08s-cJeYRZdOiNQ";

		try {

			const response = await axios.get(
				"https://generativelanguage.googleapis.com/v1beta/models",
				{
					headers: {
						"x-goog-api-key": API_KEY
					},
					params: {
						pageSize: 100
					},
					timeout: 30000
				}
			);

			const models =
				response?.data?.models || [];

			if (!models.length) {
				return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗠𝗢𝗗𝗘𝗟 𝗧𝗘𝗦𝗧

No models were returned.

📦 Model count: 0`
				);
			}

			const list = models
				.slice(0, 20)
				.map((model, index) => {

					const name =
						model.name || "Unknown";

					const methods =
						model.supportedGenerationMethods ||
						model.supportedActions ||
						[];

					return `${index + 1}. ${name}\n   ${methods.join(", ") || "No methods shown"}`;
				})
				.join("\n\n");

			return message.reply(
`✅ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗠𝗢𝗗𝗘𝗟𝗦

📦 Total: ${models.length}

${list}`
			);

		} catch (error) {

			const status =
				error?.response?.status;

			const apiError =
				error?.response?.data?.error;

			return message.reply(
`❌ 𝗚𝗘𝗠𝗜𝗡𝗜 𝗔𝗣𝗜 𝗘𝗥𝗥𝗢𝗥

📡 Status: ${status || "Unknown"}

🔎 ${
				apiError?.message ||
				error?.message ||
				"Unknown error"
			}`
			);
		}
	}
};