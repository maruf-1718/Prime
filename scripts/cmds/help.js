const fs = require("fs-extra");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands"],
    version: "1.0.0",
    author: "Mohammad Maruf",

    shortDescription: "VIP Command Menu",
    longDescription: "Show all available commands in a premium VIP style menu.",

    category: "system",

    guide: {
      en: "{pn}help [command name]"
    }
  },

  onStart: async function ({ message, args, prefix }) {

    const allCommands = global.GoatBot.commands;

    // ==========================================
    // VIP BOLD FONT
    // ==========================================

    const fancyFont = (str) => {

      const map = {
        A:"𝐀", B:"𝐁", C:"𝐂", D:"𝐃", E:"𝐄",
        F:"𝐅", G:"𝐆", H:"𝐇", I:"𝐈", J:"𝐉",
        K:"𝐊", L:"𝐋", M:"𝐌", N:"𝐍", O:"𝐎",
        P:"𝐏", Q:"𝐐", R:"𝐑", S:"𝐒", T:"𝐓",
        U:"𝐔", V:"𝐕", W:"𝐖", X:"𝐗", Y:"𝐘",
        Z:"𝐙",

        a:"𝐚", b:"𝐛", c:"𝐜", d:"𝐝", e:"𝐞",
        f:"𝐟", g:"𝐠", h:"𝐡", i:"𝐢", j:"𝐣",
        k:"𝐤", l:"𝐥", m:"𝐦", n:"𝐧", o:"𝐨",
        p:"𝐩", q:"𝐪", r:"𝐫", s:"𝐬", t:"𝐭",
        u:"𝐮", v:"𝐯", w:"𝐰", x:"𝐱", y:"𝐲",
        z:"𝐳"
      };

      return [...String(str)]
        .map(c => map[c] || c)
        .join("");
    };


    // ==========================================
    // MONO / CATEGORY FONT
    // ==========================================

    const categoryFont = (str) => {

      const map = {
        A:"𝙰", B:"𝙱", C:"𝙲", D:"𝙳", E:"𝙴",
        F:"𝙵", G:"𝙶", H:"𝙷", I:"𝙸", J:"𝙹",
        K:"𝙺", L:"𝙻", M:"𝙼", N:"𝙽", O:"𝙾",
        P:"𝙿", Q:"𝚀", R:"𝚁", S:"𝚂", T:"𝚃",
        U:"𝚄", V:"𝚅", W:"𝚆", X:"𝚇", Y:"𝚈",
        Z:"𝚉",

        a:"𝚊", b:"𝚋", c:"𝚌", d:"𝚍", e:"𝚎",
        f:"𝚏", g:"𝚐", h:"𝚑", i:"𝚒", j:"𝚓",
        k:"𝚔", l:"𝚕", m:"𝚖", n:"𝚗", o:"𝚘",
        p:"𝚙", q:"𝚚", r:"𝚛", s:"𝚜", t:"𝚝",
        u:"𝚞", v:"𝚟", w:"𝚠", x:"𝚡", y:"𝚢",
        z:"𝚣"
      };

      return [...String(str)]
        .map(c => map[c] || c)
        .join("");
    };


    // ==========================================
    // CATEGORY CLEAN
    // ==========================================

    const cleanCategoryName = (text) => {

      if (!text) return "others";

      return String(text)
        .trim()
        .toLowerCase();
    };


    // ==========================================
    // SPECIFIC COMMAND INFO
    // ==========================================

    if (args[0]) {

      const cmdName = args[0].toLowerCase();

      const cmd =
        allCommands.get(cmdName) ||
        [...allCommands.values()].find(c =>
          Array.isArray(c.config?.aliases) &&
          c.config.aliases
            .map(a => String(a).toLowerCase())
            .includes(cmdName)
        );


      if (!cmd) {

        return message.reply(
`╭━━━━━━━━━━━━━━━━━━━━━━╮
┃
┃      ❌ ${fancyFont("NOT FOUND")}
┃
┃  🔍 ${fancyFont("COMMAND")} : ${cmdName}
┃
┃  ⚠️ ${fancyFont("STATUS")} : Not Found
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
        );
      }


      const config = cmd.config || {};

      const aliases =
        Array.isArray(config.aliases)
          ? config.aliases.join(", ")
          : "None";


      const description =
        typeof config.longDescription === "object"
          ? config.longDescription.en || "No description"
          : config.longDescription ||
            config.shortDescription ||
            "No description";


      const guide =
        typeof config.guide === "object"
          ? config.guide.en || `${prefix}${config.name}`
          : config.guide || `${prefix}${config.name}`;


      const usage = String(guide)
        .replace(/\{pn\}/g, `${prefix}${config.name}`);


      const infoMsg =
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃
┃      👑 ${fancyFont("VIP COMMAND")}
┃         ✦ ${fancyFont("INFORMATION")} ✦
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  👑 ${fancyFont("NAME")}
┃  ➜ ${fancyFont(config.name || "Unknown")}
┃
┃  🔗 ${fancyFont("ALIASES")}
┃  ➜ ${fancyFont(aliases)}
┃
┃  📂 ${fancyFont("CATEGORY")}
┃  ➜ ${categoryFont(
    (config.category || "Others").toUpperCase()
  )}
┃
┃  🔢 ${fancyFont("VERSION")}
┃  ➜ ${fancyFont(config.version || "1.0.0")}
┃
┃  👨‍💻 ${fancyFont("AUTHOR")}
┃  ➜ ${fancyFont(config.author || "Unknown")}
┃
┃  📝 ${fancyFont("DESCRIPTION")}
┃  ➜ ${description}
┃
┃  ⚡ ${fancyFont("USAGE")}
┃  ➜ ${usage}
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  🎀 ${fancyFont("POWERED BY")}
┃  ➜ ${fancyFont("Mohammad Maruf")} ❤️‍🩹
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;


      return message.reply(infoMsg);
    }


    // ==========================================
    // GROUP COMMANDS BY CATEGORY
    // ==========================================

    const categories = {};


    for (const [name, cmd] of allCommands) {

      if (!cmd || !cmd.config) continue;

      const category =
        cleanCategoryName(cmd.config.category);

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push(name);
    }


    // ==========================================
    // COMMAND FORMAT
    // ==========================================

    const formatCommands = (commands) => {

      return commands
        .sort((a, b) =>
          String(a).localeCompare(String(b))
        )
        .map(
          (name, index) =>
            `┃  ${String(index + 1).padStart(2, "0")} ┃ ✦ ${fancyFont(name)}`
        )
        .join("\n");
    };


    // ==========================================
    // VIP HEADER
    // ==========================================

    let msg =
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃
┃      👑 ${fancyFont("MARUF VIP MENU")} 👑
┃
┃   ✦ ${fancyFont("PREMIUM COMMAND CENTER")} ✦
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  ⚡ ${fancyFont("PREFIX")}  : ${prefix}
┃  📦 ${fancyFont("COMMANDS")}: ${allCommands.size}
┃  🔢 ${fancyFont("VERSION")} : ${fancyFont("1.0.0")}
┃  👨‍💻 ${fancyFont("OWNER")}   : ${fancyFont("Mohammad Maruf")}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯

`;


    // ==========================================
    // CATEGORY MENU
    // ==========================================

    const sortedCategories =
      Object.keys(categories).sort();


    for (const category of sortedCategories) {

      const categoryTitle =
        category.toUpperCase();


      msg +=
`╭━━━━━━〔 ✦ ${categoryFont(categoryTitle)} ✦ 〕━━━━━━╮
┃
`;


      msg +=
        formatCommands(
          categories[category]
        );


      msg +=
`
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

`;
    }


    // ==========================================
    // VIP FOOTER
    // ==========================================

    msg +=
`╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃
┃  💡 ${fancyFont("HOW TO USE")}
┃  ➜ ${prefix}help <command>
┃
┃  ✦ ${fancyFont("Example")}
┃  ➜ ${prefix}help font
┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃
┃  👑 ${fancyFont("CREATED BY")}
┃  ➜ ${fancyFont("Mohammad Maruf")}
┃
┃       ❤️‍🩹🎀 ${fancyFont("VIP BOT")} 🎀❤️‍🩹
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;


    // ==========================================
    // VIP IMAGE
    // ==========================================

    const imageURLs = [
      "https://i.ibb.co/ynVJVbQ5/4a85abc3a112.jpg"
    ];


    const randomImageURL =
      imageURLs[
        Math.floor(
          Math.random() * imageURLs.length
        )
      ];


    const cacheFolder =
      path.join(__dirname, "cache");


    if (!fs.existsSync(cacheFolder)) {

      fs.mkdirSync(
        cacheFolder,
        { recursive: true }
      );
    }


    const imageName =
      path.basename(randomImageURL);


    const imagePath =
      path.join(
        cacheFolder,
        imageName
      );


    // ==========================================
    // SEND MENU
    // ==========================================

    try {

      if (!fs.existsSync(imagePath)) {

        await downloadImage(
          randomImageURL,
          imagePath
        );
      }


      return message.reply({
        body: msg,
        attachment:
          fs.createReadStream(imagePath)
      });

    } catch (error) {

      console.error(
        "VIP Help Image Error:",
        error
      );

      // Image কাজ না করলেও menu পাঠাবে
      return message.reply(msg);
    }
  }
};


// ==========================================
// IMAGE DOWNLOADER
// ==========================================

function downloadImage(url, destination) {

  return new Promise(
    (resolve, reject) => {

      const file =
        fs.createWriteStream(
          destination
        );


      https.get(
        url,
        response => {

          if (
            response.statusCode !== 200
          ) {

            file.close();

            fs.unlink(
              destination,
              () => {}
            );

            return reject(
              new Error(
                `HTTP ${response.statusCode}`
              )
            );
          }


          response.pipe(file);


          file.on(
            "finish",
            () => {

              file.close(resolve);
            }
          );
        }
      ).on(
        "error",
        error => {

          file.close();

          fs.unlink(
            destination,
            () => {}
          );

          reject(error);
        }
      );
    }
  );
}