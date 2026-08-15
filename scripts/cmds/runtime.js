module.exports = {
  config: {
    name: "runtime",
    aliases: ["rtm"],
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 0,
    role: 0,

    description: {
      en: "Show bot runtime."
    },

    category: "system",

    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    const uptime = process.uptime();

    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    let runtime = "";

    if (days > 0) {
      runtime += `${days}d `;
    }

    if (hours > 0) {
      runtime += `${hours}h `;
    }

    if (minutes > 0) {
      runtime += `${minutes}m `;
    }

    runtime += `${seconds}s`;

    const msg =
`╭─❖─ 𝗥𝗨𝗡𝗧𝗜𝗠𝗘 ─❖─╮
│          ${runtime}
│    🤖 𝗠𝗮𝗿𝘂𝗳'𝘀 𝗕𝗼𝘁
╰──────────────╯`;

    return message.reply(msg);
  }
};