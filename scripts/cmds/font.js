module.exports = {
  config: {
    name: "font",

    aliases: [
      "f1", "f2", "f3", "f4", "f5",
      "f6", "f7", "f8", "f9", "f10",
      "f11", "f12", "f13", "f14", "f15",
      "f16", "f17", "f18", "f19", "f20",
      "f21", "f22", "f23", "f24", "f25",
      "f26", "f27", "f28", "f29", "f30"
    ],

    version: "1.0.0",
    author: "Mohammad Maruf",
    countDown: 2,
    role: 0,

    shortDescription: "Stylish Font Converter",

    longDescription:
      "Convert text into 30 different stylish font styles.",

    category: "utility",

    guide: {
      en: "f1 <text> - f30 <text>\nExample: f7 Hello Maruf"
    }
  },

  onStart: async function ({ api, event, args, message }) {

    // ==============================
    // Reaction
    // ==============================
    const react = async (emoji) => {
      try {
        await api.setMessageReaction(
          emoji,
          event.messageID,
          () => {}
        );
      } catch (e) {
        console.error("Reaction Error:", e);
      }
    };

    // ==============================
    // Detect f1 - f30
    // ==============================

    const body = String(event.body || "").trim();

    const match = body.match(
      /^(?:f)([1-9]|[12][0-9]|30)\b/i
    );

    let fontNumber;
    let text;

    // f1 Hello / f7 Maruf
    if (match) {

      fontNumber = parseInt(match[1]);

      text = body
        .replace(
          /^(?:f)([1-9]|[12][0-9]|30)\b/i,
          ""
        )
        .trim();

    }

    // font 1 Hello
    else if (
      args[0] &&
      args[0].toLowerCase() === "font"
    ) {

      fontNumber = parseInt(args[1]);

      text = args
        .slice(2)
        .join(" ")
        .trim();

    }

    else {

      await react("❌");

      return message.reply(
        `╭━━━〔 ❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 〕━━━╮
┃
┃ Use: f1 - f30
┃
┃ Example:
┃ ➤ f7 Hello Maruf
┃
╰━━━━━━━━━━━━━━━━╯`
      );
    }

    // ==============================
    // Check Font Number
    // ==============================

    if (
      !Number.isInteger(fontNumber) ||
      fontNumber < 1 ||
      fontNumber > 30
    ) {

      await react("❌");

      return message.reply(
        `❌ Invalid font number!

Available fonts:
f1 - f30`
      );
    }

    // ==============================
    // Check Text
    // ==============================

    if (!text) {

      await react("❌");

      return message.reply(
        `❌ Text দিতে হবে!

Example:
f${fontNumber} Hello Maruf`
      );
    }

    // ==============================
    // Convert
    // ==============================

    try {

      const result = convertFont(
        text,
        fontNumber
      );

      if (!result) {
        throw new Error("Conversion failed");
      }

      // SUCCESS REACTION
      await react("🔰");

      return message.reply(result);
      );

    } catch (error) {

      console.error(
        "Font Conversion Error:",
        error
      );

      await react("⚠️");

      return message.reply(
        "❌ Font conversion failed!"
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
      return unicodeFont(
        text,
        0x1D400,
        0x1D41A,
        0x1D7CE
      );

    // F2 — Italic
    case 2:
      return unicodeFont(
        text,
        0x1D434,
        0x1D44E
      );

    // F3 — Bold Italic
    case 3:
      return unicodeFont(
        text,
        0x1D468,
        0x1D482
      );

    // F4 — Sans
    case 4:
      return unicodeFont(
        text,
        0x1D5A0,
        0x1D5BA,
        0x1D7E2
      );

    // F5 — Sans Bold
    case 5:
      return unicodeFont(
        text,
        0x1D5D4,
        0x1D5EE,
        0x1D7EC
      );

    // F6 — Sans Italic
    case 6:
      return unicodeFont(
        text,
        0x1D608,
        0x1D622
      );

    // F7 — Sans Bold Italic
    case 7:
      return unicodeFont(
        text,
        0x1D63C,
        0x1D656
      );

    // F8 — Monospace
    case 8:
      return unicodeFont(
        text,
        0x1D670,
        0x1D68A,
        0x1D7F6
      );

    // F9 — Double Struck
    case 9:
      return doubleStruck(text);

    // F10 — Fraktur
    case 10:
      return fraktur(text);

    // F11
    case 11:
      return `𝕭𝖔𝖑𝖉 ${fraktur(text)}`;

    // F12 — Script
    case 12:
      return script(text);

    // F13
    case 13:
      return script(text);

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
      return circled(text);

    // F21 — Square
    case 21:
      return square(text);

    // F22 — Negative Square
    case 22:
      return negativeSquare(text);

    // F23
    case 23:
      return `『${text}』`;

    // F24
    case 24:
      return `✦ ${text} ✦`;

    // F25
    case 25:
      return `꧁༺ ${text} ༻꧂`;

    // F26
    case 26:
      return `◆ ${text} ◆`;

    // F27
    case 27:
      return `➤ ${text} ➤`;

    // F28
    case 28:
      return `༺ ${text} ༻`;

    // F29
    case 29:
      return `☠︎ ${fraktur(text)} ☠︎`;

    // F30
    case 30:
      return `『𓆩 ${unicodeFont(
        text,
        0x1D400,
        0x1D41A,
        0x1D7CE
      )} 𓆪』`;

    default:
      return null;
  }
}


// ==========================================
// Unicode Font
// ==========================================

function unicodeFont(text, upper, lower, digit) {

  return [...text].map(char => {

    const code = char.codePointAt(0);

    if (
      upper &&
      code >= 65 &&
      code <= 90
    ) {
      return String.fromCodePoint(
        upper + code - 65
      );
    }

    if (
      lower &&
      code >= 97 &&
      code <= 122
    ) {
      return String.fromCodePoint(
        lower + code - 97
      );
    }

    if (
      digit &&
      code >= 48 &&
      code <= 57
    ) {
      return String.fromCodePoint(
        digit + code - 48
      );
    }

    return char;

  }).join("");
}


// ==========================================
// F9 — Double Struck
// ==========================================

function doubleStruck(text) {

  const map = {
    A:"𝔸",B:"𝔹",C:"ℂ",D:"𝔻",E:"𝔼",
    F:"𝔽",G:"𝔾",H:"ℍ",I:"𝕀",J:"𝕁",
    K:"𝕂",L:"𝕃",M:"𝕄",N:"ℕ",O:"𝕆",
    P:"ℙ",Q:"ℚ",R:"ℝ",S:"𝕊",T:"𝕋",
    U:"𝕌",V:"𝕍",W:"𝕎",X:"𝕏",
    Y:"𝕐",Z:"ℤ",

    a:"𝕒",b:"𝕓",c:"𝕔",d:"𝕕",e:"𝕖",
    f:"𝕗",g:"𝕘",h:"𝕙",i:"𝕚",j:"𝕛",
    k:"𝕜",l:"𝕝",m:"𝕞",n:"𝕟",o:"𝕠",
    p:"𝕡",q:"𝕢",r:"𝕣",s:"𝕤",t:"𝕥",
    u:"𝕦",v:"𝕧",w:"𝕨",x:"𝕩",
    y:"𝕪",z:"𝕫"
  };

  return [...text]
    .map(c => map[c] || c)
    .join("");
}


// ==========================================
// F10/F29 — Fraktur
// ==========================================

function fraktur(text) {

  const map = {
    A:"𝔄",B:"𝔅",C:"ℭ",D:"𝔇",E:"𝔈",
    F:"𝔉",G:"𝔊",H:"ℌ",I:"ℑ",J:"𝔍",
    K:"𝔎",L:"𝔏",M:"𝔐",N:"𝔑",O:"𝔒",
    P:"𝔓",Q:"𝔔",R:"ℜ",S:"𝔖",T:"𝔗",
    U:"𝔘",V:"𝔙",W:"𝔚",X:"𝔛",
    Y:"𝔜",Z:"ℨ",

    a:"𝔞",b:"𝔟",c:"𝔠",d:"𝔡",e:"𝔢",
    f:"𝔣",g:"𝔤",h:"𝔥",i:"𝔦",j:"𝔧",
    k:"𝔨",l:"𝔩",m:"𝔪",n:"𝔫",o:"𝔬",
    p:"𝔭",q:"𝔮",r:"𝔯",s:"𝔰",t:"𝔱",
    u:"𝔲",v:"𝔳",w:"𝔴",x:"𝔵",
    y:"𝔶",z:"𝔷"
  };

  return [...text]
    .map(c => map[c] || c)
    .join("");
}


// ==========================================
// F12 — Script
// ==========================================

function script(text) {

  const map = {
    A:"𝒜",B:"ℬ",C:"𝒞",D:"𝒟",E:"ℰ",
    F:"ℱ",G:"𝒢",H:"ℋ",I:"ℐ",J:"𝒥",
    K:"𝒦",L:"ℒ",M:"ℳ",N:"𝒩",O:"𝒪",
    P:"𝒫",Q:"𝒬",R:"ℛ",S:"𝒮",T:"𝒯",
    U:"𝒰",V:"𝒱",W:"𝒲",X:"𝒳",
    Y:"𝒴",Z:"𝒵",

    a:"𝒶",b:"𝒷",c:"𝒸",d:"𝒹",e:"ℯ",
    f:"𝒻",g:"ℊ",h:"𝒽",i:"𝒾",j:"𝒿",
    k:"𝓀",l:"𝓁",m:"𝓂",n:"𝓃",o:"ℴ",
    p:"𝓅",q:"𝓆",r:"𝓇",s:"𝓈",t:"𝓉",
    u:"𝓊",v:"𝓋",w:"𝓌",x:"𝓍",
    y:"𝓎",z:"𝓏"
  };

  return [...text]
    .map(c => map[c] || c)
    .join("");
}


// ==========================================
// F14 — Circled
// ==========================================

function circled(text) {

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
// F15 — Parenthesized
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
// F16 — Fullwidth
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
// F17 — Small Caps
// ==========================================

function smallCaps(text) {

  const map = {
    a:"ᴀ",b:"ʙ",c:"ᴄ",d:"ᴅ",e:"ᴇ",
    f:"ꜰ",g:"ɢ",h:"ʜ",i:"ɪ",j:"ᴊ",
    k:"ᴋ",l:"ʟ",m:"ᴍ",n:"ɴ",o:"ᴏ",
    p:"ᴘ",q:"ǫ",r:"ʀ",s:"ꜱ",t:"ᴛ",
    u:"ᴜ",v:"ᴠ",w:"ᴡ",x:"x",y:"ʏ",
    z:"ᴢ"
  };

  return [...text]
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}


// ==========================================
// F18 — Superscript
// ==========================================

function superscript(text) {

  const map = {
    a:"ᵃ",b:"ᵇ",c:"ᶜ",d:"ᵈ",e:"ᵉ",
    f:"ᶠ",g:"ᵍ",h:"ʰ",i:"ⁱ",j:"ʲ",
    k:"ᵏ",l:"ˡ",m:"ᵐ",n:"ⁿ",o:"ᵒ",
    p:"ᵖ",r:"ʳ",s:"ˢ",t:"ᵗ",u:"ᵘ",
    v:"ᵛ",w:"ʷ",x:"ˣ",y:"ʸ",z:"ᶻ",
    0:"⁰",1:"¹",2:"²",3:"³",4:"⁴",
    5:"⁵",6:"⁶",7:"⁷",8:"⁸",9:"⁹"
  };

  return [...text]
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}


// ==========================================
// F19 — Subscript
// ==========================================

function subscript(text) {

  const map = {
    a:"ₐ",e:"ₑ",h:"ₕ",i:"ᵢ",j:"ⱼ",
    k:"ₖ",l:"ₗ",m:"ₘ",n:"ₙ",o:"ₒ",
    p:"ₚ",r:"ᵣ",s:"ₛ",t:"ₜ",u:"ᵤ",
    v:"ᵥ",x:"ₓ",
    0:"₀",1:"₁",2:"₂",3:"₃",4:"₄",
    5:"₅",6:"₆",7:"₇",8:"₈",9:"₉"
  };

  return [...text]
    .map(c => map[c.toLowerCase()] || c)
    .join("");
}


// ==========================================
// F21 — Square
// ==========================================

function square(text) {

  const map = {
    A:"🅰",B:"🅱",C:"🅲",D:"🅳",E:"🅴",
    F:"🅵",G:"🅶",H:"🅷",I:"🅸",J:"🅹",
    K:"🅺",L:"🅻",M:"🅼",N:"🅽",O:"🅾",
    P:"🅿",Q:"🆀",R:"🆁",S:"🆂",T:"🆃",
    U:"🆄",V:"🆅",W:"🆆",X:"🆇",
    Y:"🆈",Z:"🆉"
  };

  return [...text]
    .map(c => map[c.toUpperCase()] || c)
    .join("");
}


// ==========================================
// F22 — Negative Square
// ==========================================

function negativeSquare(text) {

  const map = {
    A:"🅐",B:"🅑",C:"🅒",D:"🅓",E:"🅔",
    F:"🅕",G:"🅖",H:"🅗",I:"🅘",J:"🅙",
    K:"🅚",L:"🅛",M:"🅜",N:"🅝",O:"🅞",
    P:"🅟",Q:"🅠",R:"🅡",S:"🅢",T:"🅣",
    U:"🅤",V:"🅥",W:"🅦",X:"🅧",
    Y:"🅨",Z:"🅩"
  };

  return [...text]
    .map(c => map[c.toUpperCase()] || c)
    .join("");
}