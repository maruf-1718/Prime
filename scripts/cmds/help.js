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
    longDescription: "Show all available commands in a stylish menu.",

    category: "system",

    guide: {
      en: "{pn}help [command name]"
    }
  },

  onStart: async function ({ message, args, prefix }) {

    const allCommands = global.GoatBot.commands;

    // ==============================
    // MAIN FONT
    // ==============================

    const fancyFont = (str) => {
      const map = {
        A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄",
        F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉",
        K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎",
        P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓",
        U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘",
        Z: "𝐙",

        a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞",
        f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣",
        k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨",
        p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭",
        u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲",
        z: "𝐳"
      };

      return [...String(str)]
        .map(char => map[char] || char)
        .join("");
    };


    // ==============================
    // CATEGORY FONT
    // ==============================

    const categoryFont = (str) => {
      const map = {
        A: "𝙰", B: "𝙱", C: "𝙲", D: "𝙳", E: "𝙴",
        F: "𝙵", G: "𝙶", H: "𝙷", I: "𝙸", J: "𝙹",
        K: "𝙺", L: "𝙻", M: "𝙼", N: "𝙽", O: "𝙾",
        P: "𝙿", Q: "𝚀", R: "𝚁", S: "𝚂", T: "𝚃",
        U: "𝚄", V: "𝚅", W: "𝚆", X: "𝚇", Y: "𝚈",
        Z: "𝚉",

        a: "𝚊", b: "𝚋", c: "𝚌", d: "𝚍", e: "𝚎",
        f: "𝚏", g: "𝚐", h: "𝚑", i: "𝚒", j: "𝚓",
        k: "𝚔", l: "𝚕", m: "𝚖", n: "𝚗", o: "𝚘",
        p: "𝚙", q: "𝚚", r: "𝚛", s: "𝚜", t: "𝚝",
        u: "𝚞", v: "𝚟", w: "𝚠", x: "𝚡", y: "𝚢",
        z: "𝚣"
      };

      return [...String(str)]
        .map(char => map[char] || char)
        .join("");
    };


    // ==============================
    // CATEGORY NAME
    // ==============================

    const cleanCategoryName = (text) => {
      if (!text) return "others";

      return String(text)
        .trim()
        .toLowerCase();
    };


    // ==============================
    // COMMAND INFO
    // ==============================

    if (args[0]) {

      const cmdName = String(args[0]).toLowerCase();

      const cmd =
        allCommands.get(cmdName) ||
        [...allCommands.values()].find(command =>
          Array.isArray(command.config?.aliases) &&
          command.config.aliases.some(
            alias =>
              String(alias).toLowerCase() === cmdName
          )
        );


      if (!cmd) {
        return message.reply(
          `❌ ${fancyFont("Command")} "${cmdName}" ${fancyFont("not found!")}`
        );
      }


      const config = cmd.config || {};


      const aliases =
        Array.isArray(config.aliases)
          ? config.aliases.join(", ")
          : "None";


      const description =
        typeof config.longDescription === "object"
          ? config.longDescription.en ||
            config.shortDescription ||
            "No description"
          : config.longDescription ||
            config.shortDescription ||
            "No description";


      let guide = config.guide || `${prefix}${config.name}`;

      if (typeof guide === "object") {
        guide = guide.en || `${prefix}${config.name}`;
      }


      guide = String(guide)
        .replace(/\{pn\}/g, `${prefix}${config.name}`);


      const infoMsg =
`━━━✧ ${fancyFont("COMMAND INFO")} ✧━━━

✦ ${fancyFont("NAME")}
   ⟡ ${fancyFont(config.name || "Unknown")}

✦ ${fancyFont("ALIASES")}
   ⟡ ${fancyFont(aliases)}

✦ ${fancyFont("CATEGORY")}
   ⟡ ${categoryFont(
      (config.category || "Others").toUpperCase()
   )}

✦ ${fancyFont("VERSION")}
   ⟡ ${fancyFont(config.version || "1.0.0")}

✦ ${fancyFont("AUTHOR")}
   ⟡ ${fancyFont(config.author || "Unknown")}

✦ ${fancyFont("DESCRIPTION")}
   ⟡ ${description}

✦ ${fancyFont("USAGE")}
   ⟡ ${guide}`;


      return message.reply(infoMsg);
    }


    // ==============================
    // GROUP COMMANDS
    // ==============================

    const categories = {};


    for (const [name, command] of allCommands) {

      if (!command || !command.config) continue;

      const category =
        cleanCategoryName(command.config.category);


      if (!categories[category]) {
        categories[category] = [];
      }


      if (!categories[category].includes(name)) {
        categories[category].push(name);
      }
    }


    // ==============================
    // COMMAND FORMAT
    // ==============================

    const formatCommands = (commands) => {

      return commands
        .sort((a, b) =>
          String(a).localeCompare(String(b))
        )
        .map((name, index) => {

          const number =
            String(index + 1).padStart(2, "0");


          return `   ${number} ⟡ ${fancyFont(name)}`;

        })
        .join("\n");
    };


    // ==============================
    // MENU HEADER
    // ==============================

    let msg =
`⚡ ${fancyFont("PREFIX")} › ${prefix}

📦 ${fancyFont("TOTAL")} › ${allCommands.size}

`;


    // ==============================
    // SORT CATEGORIES
    // ==============================

    const categoryOrder = [
      "18+",
      "admin",
      "ai",
      "ai-image",
      "anime",
      "birthday",
      "box",
      "box chat",
      "config",
      "contacts",
      "custom",
      "economy",
      "events",
      "fun",
      "game",
      "group",
      "image",
      "info",
      "information",
      "love",
      "media",
      "music",
      "other",
      "owner",
      "rank",
      "software",
      "supportgc",
      "system",
      "tools",
      "utility",
      "wiki"
    ];


    const sortedCategories =
      Object.keys(categories).sort((a, b) => {

        const indexA =
          categoryOrder.indexOf(a);

        const indexB =
          categoryOrder.indexOf(b);


        if (indexA === -1 && indexB === -1) {
          return a.localeCompare(b);
        }


        if (indexA === -1) return 1;

        if (indexB === -1) return -1;


        return indexA - indexB;
      });


    // ==============================
    // BUILD CATEGORY MENU
    // ==============================

    for (const category of sortedCategories) {

      const title =
        categoryFont(
          category.toUpperCase()
        );


      msg +=
`━━━✧ ${title} ✧━━━

${formatCommands(categories[category])}

`;
    }


    // ==============================
    // FOOTER
    // ==============================

    msg +=
`━━━✧ ${fancyFont("HOW TO USE")} ✧━━━

   ➜  /<command>

   ✦ ${fancyFont("Example")}
   ➜  /owner


       ♡ ${fancyFont("Mohammad Maruf")} ♡`;


    // ==============================
    // IMAGE
    // ==============================

    const imageURL =
      "https://i.ibb.co/ynVJVbQ5/4a85abc3a112.jpg";


    const cacheFolder =
      path.join(__dirname, "cache");


    if (!fs.existsSync(cacheFolder)) {
      fs.mkdirSync(
        cacheFolder,
        { recursive: true }
      );
    }


    const imageName =
      path.basename(imageURL);


    const imagePath =
      path.join(
        cacheFolder,
        imageName
      );


    // ==============================
    // SEND MENU
    // ==============================

    try {

      if (!fs.existsSync(imagePath)) {
        await downloadImage(
          imageURL,
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
// IMAGE DOWNLOADER
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