const fs = require("fs-extra");
const path = require("path");
const https = require("https");

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands"],
    version: "1.0.0",
    author: "Mohammad Maruf",

    shortDescription: "Show all commands",
    longDescription: "Show all available commands in a clean box style menu.",

    category: "system",

    guide: {
      en: "{pn}help [command name]"
    }
  },

  onStart: async function ({ message, args, prefix }) {

    const allCommands = global.GoatBot.commands;

    // ==============================
    // Bold Font
    // ==============================

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


    // ==============================
    // Category Font
    // ==============================

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


    // ==============================
    // Category Name
    // ==============================

    const cleanCategoryName = (text) => {

      if (!text) return "others";

      return String(text)
        .trim()
        .toLowerCase();
    };


    // ==============================
    // Specific Command Info
    // ==============================

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
`╭────────〔 ✦ 𝐍𝐎𝐓 𝐅𝐎𝐔𝐍𝐃 ✦ 〕────────╮
│
│  ❌ ${fancyFont("Command")}: ${cmdName}
│  ⚠️ ${fancyFont("Status")}: Not Found
│
╰──────────────────────────────────────`
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


      const usage =
        String(guide)
          .replace(/\{pn\}/g, `${prefix}${config.name}`);


      const infoMsg =
`╭────────〔 ✦ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 ✦ 〕────────╮
│
│  01 │ ✦ ${fancyFont("name")}
│      └─ ${fancyFont(config.name || "Unknown")}
│
│  02 │ ✦ ${fancyFont("aliases")}
│      └─ ${fancyFont(aliases)}
│
│  03 │ ✦ ${fancyFont("category")}
│      └─ ${categoryFont(
          (config.category || "Others").toUpperCase()
        )}
│
│  04 │ ✦ ${fancyFont("version")}
│      └─ ${fancyFont(config.version || "1.0.0")}
│
│  05 │ ✦ ${fancyFont("author")}
│      └─ ${fancyFont(config.author || "Unknown")}
│
│  06 │ ✦ ${fancyFont("description")}
│      └─ ${description}
│
│  07 │ ✦ ${fancyFont("usage")}
│      └─ ${usage}
│
╰──────────────────────────────────────`;

      return message.reply(infoMsg);
    }


    // ==============================
    // Group Commands
    // ==============================

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


    // ==============================
    // Format Commands
    // ==============================

    const formatCommands = (commands) => {

      return commands
        .sort((a, b) =>
          String(a).localeCompare(String(b))
        )
        .map((name, index) => {

          const number =
            String(index + 1).padStart(2, "0");

          return `│  ${number} │ ✦ ${fancyFont(name)}`;

        })
        .join("\n");
    };


    // ==============================
    // Main Header
    // ==============================

    let msg =
`╭──────────〔 ✦ 𝐂𝐎𝐍𝐅𝐈𝐆 ✦ 〕──────────╮
│
│  01 │ ✦ ${fancyFont("prefix")}
│      └─ ${prefix}
│
│  02 │ ✦ ${fancyFont("commands")}
│      └─ ${allCommands.size}
│
│  03 │ ✦ ${fancyFont("version")}
│      └─ ${fancyFont("1.0.0")}
│
╰────────────────────────────────────────

`;


    // ==============================
    // Categories
    // ==============================

    const sortedCategories =
      Object.keys(categories).sort();


    for (const category of sortedCategories) {

      msg +=
`╭────────〔 ✦ ${categoryFont(
        category.toUpperCase()
      )} ✦ 〕────────╮
│
`;


      msg +=
        formatCommands(
          categories[category]
        );


      msg +=
`
│
╰──────────────────────────────────────

`;
    }


    // ==============================
    // Footer
    // ==============================

    msg +=
`╭──────────〔 ✦ 𝐈𝐍𝐅𝐎 ✦ 〕──────────╮
│
│  01 │ ✦ ${fancyFont("use")}
│      └─ ${prefix}help <command>
│
│  02 │ ✦ ${fancyFont("author")}
│      └─ ${fancyFont("Mohammad Maruf")}
│
╰────────────────────────────────────`;


    // ==============================
    // Image
    // ==============================

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


    // ==============================
    // Send
    // ==============================

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
        "Help Image Error:",
        error
      );

      return message.reply(msg);
    }
  }
};


// ==============================
// Image Downloader
// ==============================

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

          if (response.statusCode !== 200) {

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