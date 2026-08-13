// ==========================================
// Stylish Font Command
// Author: Mohammad Maruf
// Version: 1.0.0
// ==========================================

module.exports = {
  config: {
    name: "font",
    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 2,
    role: 0,

    shortDescription: "Converts text into stylish fonts ✨",

    longDescription:
      "Use f1 to f30 to convert your text into different stylish Unicode and decorative styles.",

    category: "utility",

    usages:
      "f1 <text>\nf2 <text>\nf3 <text>\n...\nf30 <text>",

    guide:
      "Example: f7 Hello Maruf"
  },

  // ==========================================
  // START
  // ==========================================

  onStart: async function ({ api, event, args, message }) {

    const react = async (emoji) => {
      try {
        if (typeof api.setMessageReaction === "function") {
          await api.setMessageReaction(
            emoji,
            event.messageID,
            () => {}
          );
        }
      } catch (error) {
        console.error("Reaction Error:", error);
      }
    };


    // ==========================================
    // NO TEXT
    // ==========================================

    if (!args.length) {
      await react("❌");

      return message.reply(
        `╭━━━〔 ✨ 𝐅𝐎𝐍𝐓 〕━━━╮
┃
┃ 🔤 𝐅𝟏 → 𝐅𝟑𝟎
┃
┃ 𝐄𝐱𝐚𝐦𝐩𝐥𝐞:
┃ ➤ f1 Hello Maruf
┃ ➤ f7 Hello Maruf
┃ ➤ f15 Hello Maruf
┃ ➤ f30 Hello Maruf
┃
╰━━━━━━━━━━━━━━━━╯
💫 𝐌𝐨𝐡𝐚𝐦𝐦𝐚𝐝 𝐌𝐚𝐫𝐮𝐟 ❤️‍🩹🎀`
      );
    }


    // ==========================================
    // DETECT COMMAND
    // ==========================================

    const commandUsed =
      event.body
        ?.trim()
        .split(/\s+/)[0]
        ?.toLowerCase()
        .replace(/^[^a-z0-9]+/, "") || "";


    let fontNumber;
    let text;


    // f1 - f30
    if (/^f([1-9]|[12][0-9]|30)$/.test(commandUsed)) {

      fontNumber = parseInt(
        commandUsed.substring(1)
      );

      text = args.join(" ");

    } else {

      // font 1 Hello Maruf
      fontNumber = parseInt(args[0]);

      if (
        !Number.isInteger(fontNumber) ||
        fontNumber < 1 ||
        fontNumber > 30
      ) {

        await react("❌");

        return message.reply(
          `╭━━━〔 ❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐅𝐨𝐧𝐭 〕━━━╮
┃
┃ 𝐔𝐬𝐞 𝐅𝟏 → 𝐅𝟑𝟎
┃
┃ 𝐄𝐱𝐚𝐦𝐩𝐥𝐞:
┃ ➤ f7 Hello Maruf
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
        );
      }

      text = args.slice(1).join(" ");
    }


    // ==========================================
    // EMPTY TEXT
    // ==========================================

    if (!text || !text.trim()) {

      await react("❌");

      return message.reply(
        `╭━━━〔 ❌ 𝐄𝐫𝐫𝐨𝐫 〕━━━╮
┃
┃ Please enter some text.
┃
┃ Example:
┃ ➤ f7 Hello Maruf
┃
╰━━━━━━━━━━━━━━━━╯`
      );
    }


    // ==========================================
    // FONT CONVERSION
    // ==========================================

    try {

      const result = convertFont(
        text,
        fontNumber
      );


      if (!result || !result.trim()) {
        await react("❌");

        return message.reply(
          "❌ Font conversion failed."
        );
      }


      // SUCCESS REACTION
      await react("✅");


      // ==========================================
      // RESULT
      // ==========================================

      return message.reply(
        `╭━━━〔 ✨ 𝐅${fontNumber} 〕━━━╮
┃
┃ ${result}
┃
╰━━━━━━━━━━━━━━━━╯`
      );

    } catch (error) {

      console.error(
        "Font Command Error:",
        error
      );

      await react("❌");

      return message.reply(
        "❌ Something went wrong while converting the text."
      );
    }
  }
};


// ==========================================
// FONT CONVERTER
// ==========================================

function convertFont(text, number) {

  switch (number) {

    // F1 — Bold
    case 1:
      return convert(text, 0x1D400, 0x1D41A, 0x1D7CE);


    // F2 — Italic
    case 2:
      return convert(text, 0x1D434, 0x1D44E);


    // F3 — Bold Italic
    case 3:
      return convert(text, 0x1D468, 0x1D482);


    // F4 — Sans
    case 4:
      return convert(text, 0x1D5A0, 0x1D5BA, 0x1D7E2);


    // F5 — Sans Bold
    case 5:
      return convert(text, 0x1D5D4, 0x1D5EE, 0x1D7EC);


    // F6 — Sans Italic
    case 6:
      return convert(text, 0x1D608, 0x1D622);


    // F7 — Sans Bold Italic
    case 7:
      return convert(text, 0x1D63C, 0x1D656);


    // F8 — Monospace
    case 8:
      return convert(text, 0x1D670, 0x1D68A, 0x1D7F6);


    // F9 — Double Struck
    case 9:
      return doubleStruck(text);


    // F10 — Fraktur
    case 10:
      return fraktur(text);


    // F11 — Bold Fraktur
    case 11:
      return convert(text, 0x1D56C, 0x1D586);


    // F12 — Script
    case 12:
      return script(text);


    // F13 — Bold Script
    case 13:
      return convert(text, 0x1D4D0, 0x1D4EA);


    // F14 — Circled
    case 14:
      return circled(text);


    // F15 — Parenthesized
    case 15:
      return parenthesized(text);


    // F16 — Fullwidth
    case 16:
      return fullwidth(text);


    // F17 — Small Caps
    case 17:
      return smallCaps(text);


    // F18 — Superscript
    case 18:
      return superscript(text);


    // F19 — Subscript
    case 19:
      return subscript(text);


    // F20 — Bubble
    case 20:
      return bubble(text);


    // F21 — Square
    case 21:
      return square(text);


    // F22 — Negative Square
    case 22:
      return negativeSquare(text);


    // F23 — Bracket
    case 23:
      return `『${text}』`;


    // F24 — Star
    case 24:
      return `✦ ${text} ✦`;


    // F25 — Flower
    case 25:
      return `꧁༺ ${text} ༻꧂`;


    // F26 — Diamond
    case 26:
      return `◆ ${text} ◆`;


    // F27 — Arrow
    case 27:
      return `➤ ${text} ➤`;


    // F28 — Aesthetic
    case 28:
      return `꧁༺ ${text} ༻꧂`;


    // F29 — Gothic
    case 29:
      return `☠︎ ${fraktur(text)} ☠︎`;


    // F30 — Ultimate
    case 30:
      return `『𓆩 ${convert(text, 0x1D400, 0x1D41A, 0x1D7CE)} 𓆪』`;


    default:
      throw new Error("Invalid font number");
  }
}


// ==========================================
// BASIC UNICODE CONVERTER
// ==========================================

function convert(text, upper, lower, digit) {

  return [...text].map(char => {

    const code = char.codePointAt(0);

    // Uppercase
    if (
      code >= 65 &&
      code <= 90 &&
      upper
    ) {
      return String.fromCodePoint(
        upper + (code - 65)
      );
    }


    // Lowercase
    if (
      code >= 97 &&
      code <= 122 &&
      lower
    ) {
      return String.fromCodePoint(
        lower + (code - 97)
      );
    }


    // Numbers
    if (
      code >= 48 &&
      code <= 57 &&
      digit
    ) {
      return String.fromCodePoint(
        digit + (code - 48)
      );
    }


    return char;

  }).join("");
}


// ==========================================
// F9 — DOUBLE STRUCK
// ==========================================

function doubleStruck(text) {

  const map = {

    A:"𝔸", B:"𝔹", C:"ℂ", D:"𝔻", E:"𝔼",
    F:"𝔽", G:"𝔾", H:"ℍ", I:"𝕀", J:"𝕁",
    K:"𝕂", L:"𝕃", M:"𝕄", N:"ℕ", O:"𝕆",
    P:"ℙ", Q:"ℚ", R:"ℝ", S:"𝕊", T:"𝕋",
    U:"𝕌", V:"𝕍", W:"𝕎", X:"𝕏",
    Y:"𝕐", Z:"ℤ",

    a:"𝕒", b:"𝕓", c:"𝕔", d:"𝕕", e:"𝕖",
    f:"𝕗", g:"𝕘", h:"𝕙", i:"𝕚", j:"𝕛",
    k:"𝕜", l:"𝕝", m:"𝕞", n:"𝕟", o:"𝕠",
    p:"𝕡", q:"𝕢", r:"𝕣", s:"𝕤", t:"𝕥",
    u:"𝕦", v:"𝕧", w:"𝕨", x:"𝕩",
    y:"𝕪", z:"𝕫"
  };

  return [...text]
    .map(c => map[c] || c)
    .join("");
}


// ==========================================
// F10 — FRAKTUR
// ==========================================

function fraktur(text) {

  const map = {

    A:"𝔄", B:"𝔅", C:"ℭ", D:"𝔇", E:"𝔈",
    F:"𝔉", G:"𝔊", H:"ℌ", I:"ℑ", J:"𝔍",
    K:"𝔎", L:"𝔏", M:"𝔐", N:"𝔑", O:"𝔒",
    P:"𝔓", Q:"𝔔", R:"ℜ", S:"𝔖", T:"𝔗",
    U:"𝔘", V:"𝔙", W:"𝔚", X:"𝔛",
    Y:"𝔜", Z:"ℨ",

    a:"𝔞", b:"𝔟", c:"𝔠", d:"𝔡", e:"𝔢",
    f:"𝔣", g:"𝔤", h:"𝔥", i:"𝔦", j:"𝔧",
    k:"𝔨", l:"𝔩", m:"𝔪", n:"𝔫", o:"𝔬",
    p:"𝔭", q:"𝔮", r:"𝔯", s:"𝔰", t:"𝔱",
    u:"𝔲", v:"𝔳", w:"𝔴", x:"𝔵",
    y:"𝔶", z:"𝔷"
  };

  return [...text]
    .map(c => map[c] || c)
    .join("");
}


// ==========================================
// F12 — SCRIPT
// ==========================================

function script(text) {

  const map = {

    A:"𝒜", B:"ℬ", C:"𝒞", D:"𝒟", E:"ℰ",
    F:"ℱ", G:"𝒢", H:"ℋ", I:"ℐ", J:"𝒥",
    K:"𝒦", L:"ℒ", M:"ℳ", N:"𝒩", O:"𝒪",
    P:"𝒫", Q:"𝒬", R:"ℛ", S:"𝒮", T:"𝒯",
    U:"𝒰", V:"𝒱", W:"𝒲", X:"𝒳",
    Y:"𝒴", Z:"𝒵",

    a:"𝒶", b:"𝒷", c:"𝒸", d:"𝒹", e:"ℯ",
    f:"𝒻", g:"ℊ", h:"𝒽", i:"𝒾", j:"𝒿",
    k:"𝓀", l:"𝓁", m:"𝓂", n:"𝓃", o:"ℴ",
    p:"𝓅", q:"𝓆", r:"𝓇", s:"𝓈", t:"𝓉",
    u:"𝓊", v:"𝓋", w:"𝓌", x:"𝓍",
    y:"𝓎", z:"𝓏"
  };

  return [...text]
    .map(c => map[c] || c)
    .join("");
}


// ==========================================
// F14 — CIRCLED
// ==========================================

function circled(text) {

  const nums = [
    "⓪","①","②","③","④",
    "⑤","⑥","⑦","⑧","⑨"
  ];

  return [...text].map(c => {

    const code = c.charCodeAt(0);

    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(
        0x24B6 + code - 65
      );
    }

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(
        0x24D0 + code - 97
      );
    }

    if (code >= 48 && code <= 57) {
      return nums[Number(c)];
    }

    return c;

  }).join("");
}


// ==========================================
// F15 — PARENTHESIZED
// ==========================================

function parenthesized(text) {

  return [...text].map(c => {

    const code =
      c.toLowerCase().charCodeAt(0);

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(
        0x249C + code - 97
      );
    }

    return c;

  }).join("");
}


// ==========================================
// F16 — FULLWIDTH
// ==========================================

function fullwidth(text) {

  return [...text].map(c => {

    const code = c.charCodeAt(0);

    if (code >= 33 && code <= 126) {
      return String.fromCharCode(
        code + 0xFEE0
      );
    }

    if (c === " ") {
      return "　";
    }

    return c;

  }).join("");
}


// ==========================================
// F17 — SMALL CAPS
// ==========================================

function smallCaps(text) {

  const map = {

    a:"ᴀ", b:"ʙ", c:"ᴄ", d:"ᴅ",
    e:"ᴇ", f:"ꜰ", g:"ɢ", h:"ʜ",
    i:"ɪ", j:"ᴊ", k:"ᴋ", l:"ʟ",
    m:"ᴍ", n:"ɴ", o:"ᴏ", p:"ᴘ",
    q:"ǫ", r:"ʀ", s:"ꜱ", t:"ᴛ",
    u:"ᴜ", v:"ᴠ", w:"ᴡ", x:"x",
    y:"ʏ", z:"ᴢ"
  };

  return [...text]
    .map(c =>
      map[c.toLowerCase()] || c
    )
    .join("");
}


// ==========================================
// F18 — SUPERSCRIPT
// ==========================================

function superscript(text) {

  const map = {

    a:"ᵃ", b:"ᵇ", c:"ᶜ", d:"ᵈ",
    e:"ᵉ", f:"ᶠ", g:"ᵍ", h:"ʰ",
    i:"ⁱ", j:"ʲ", k:"ᵏ", l:"ˡ",
    m:"ᵐ", n:"ⁿ", o:"ᵒ", p:"ᵖ",
    r:"ʳ", s:"ˢ", t:"ᵗ", u:"ᵘ",
    v:"ᵛ", w:"ʷ", x:"ˣ", y:"ʸ",
    z:"ᶻ",

    0:"⁰", 1:"¹", 2:"²", 3:"³",
    4:"⁴", 5:"⁵", 6:"⁶", 7:"⁷",
    8:"⁸", 9:"⁹"
  };

  return [...text]
    .map(c =>
      map[c.toLowerCase()] || c
    )
    .join("");
}


// ==========================================
// F19 — SUBSCRIPT
// ==========================================

function subscript(text) {

  const map = {

    a:"ₐ", e:"ₑ", h:"ₕ", i:"ᵢ",
    j:"ⱼ", k:"ₖ", l:"ₗ", m:"ₘ",
    n:"ₙ", o:"ₒ", p:"ₚ", r:"ᵣ",
    s:"ₛ", t:"ₜ", u:"ᵤ", v:"ᵥ",
    x:"ₓ",

    0:"₀", 1:"₁", 2:"₂", 3:"₃",
    4:"₄", 5:"₅", 6:"₆", 7:"₇",
    8:"₈", 9:"₉"
  };

  return [...text]
    .map(c =>
      map[c.toLowerCase()] || c
    )
    .join("");
}


// ==========================================
// F20 — BUBBLE
// ==========================================

function bubble(text) {

  return [...text].map(c => {

    const code = c.charCodeAt(0);

    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(
        0x24B6 + code - 65
      );
    }

    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(
        0x24D0 + code - 97
      );
    }

    return c;

  }).join("");
}


// ==========================================
// F21 — SQUARE
// ==========================================

function square(text) {

  const map = {

    A:"🅰", B:"🅱", C:"🅲", D:"🅳",
    E:"🅴", F:"🅵", G:"🅶", H:"🅷",
    I:"🅸", J:"🅹", K:"🅺", L:"🅻",
    M:"🅼", N:"🅽", O:"🅾", P:"🅿",
    Q:"🆀", R:"🆁", S:"🆂", T:"🆃",
    U:"🆄", V:"🆅", W:"🆆", X:"🆇",
    Y:"🆈", Z:"🆉"
  };

  return [...text]
    .map(c =>
      map[c.toUpperCase()] || c
    )
    .join("");
}


// ==========================================
// F22 — NEGATIVE SQUARE
// ==========================================

function negativeSquare(text) {

  const map = {

    A:"🅐", B:"🅑", C:"🅒", D:"🅓",
    E:"🅔", F:"🅕", G:"🅖", H:"🅗",
    I:"🅘", J:"🅙", K:"🅚", L:"🅛",
    M:"🅜", N:"🅝", O:"🅞", P:"🅟",
    Q:"🅠", R:"🅡", S:"🅢", T:"🅣",
    U:"🅤", V:"🅥", W:"🅦", X:"🅧",
    Y:"🅨", Z:"🅩"
  };

  return [...text]
    .map(c =>
      map[c.toUpperCase()] || c
    )
    .join("");
}