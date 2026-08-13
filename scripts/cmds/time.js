const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "time",
  version: "12.0.0",
  author: "Mohammad Maruf",
  countDown: 5,
  role: 0,
  shortDescription: "Premium futuristic time card",
  category: "fun",
  guide: { en: "{p}time" }
};

module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // ═════════════════════════════════════
    // 🇧🇩 DHAKA TIME — GMT+6
    // ═════════════════════════════════════

    const now = new Date();

    const dhakaTime = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka"
      })
    );

    const year = dhakaTime.getFullYear();
    const month = dhakaTime.getMonth();
    const date = dhakaTime.getDate();
    const day = dhakaTime.getDay();

    let hours = dhakaTime.getHours();
    const minutes = dhakaTime.getMinutes();
    const seconds = dhakaTime.getSeconds();

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours || 12;

    const timeStr =
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`;

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    const dayName = days[day];
    const monthName = months[month];

    // ═════════════════════════════════════
    // 🎨 GENERATE CARD
    // ═════════════════════════════════════

    const filePath = await generateTimeCard({
      year,
      month,
      date,
      dayName,
      monthName,
      timeStr,
      ampm
    });

    await api.sendMessage(
      {
        body:
          `✦ ${dayName}, ${date} ${monthName} ${year}\n` +
          `◈ ${timeStr} ${ampm}\n` +
          `🇧🇩 Bangladesh Standard Time • GMT+6`,
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      messageID
    );

    // Cleanup
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    }, 15000);

  } catch (error) {
    console.error("TIME COMMAND ERROR:", error);
    return api.sendMessage(
      "❌ Time card generate করা যায়নি।",
      threadID,
      messageID
    );
  }
};


// ═══════════════════════════════════════
// 🕒 FUTURISTIC TIME CARD
// ═══════════════════════════════════════

async function generateTimeCard(data) {

  const width = 1000;
  const height = 1150;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // ═════════════════════════════════════
  // AMOLED BLACK BACKGROUND
  // ═════════════════════════════════════

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // Subtle red radial glow
  const glow = ctx.createRadialGradient(
    width / 2,
    180,
    20,
    width / 2,
    180,
    600
  );

  glow.addColorStop(
    0,
    "rgba(255,0,55,0.15)"
  );

  glow.addColorStop(
    0.5,
    "rgba(255,0,55,0.04)"
  );

  glow.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, 600);

  // ═════════════════════════════════════
  // FUTURISTIC GRID
  // ═════════════════════════════════════

  ctx.strokeStyle =
    "rgba(255,0,50,0.025)";

  ctx.lineWidth = 1;

  for (let x = 0; x < width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // ═════════════════════════════════════
  // CORNER DECORATIONS
  // ═════════════════════════════════════

  ctx.strokeStyle = "#ff1744";
  ctx.lineWidth = 5;

  // Top left
  ctx.beginPath();
  ctx.moveTo(55, 95);
  ctx.lineTo(55, 45);
  ctx.lineTo(155, 45);
  ctx.stroke();

  // Top right
  ctx.beginPath();
  ctx.moveTo(width - 55, 95);
  ctx.lineTo(width - 55, 45);
  ctx.lineTo(width - 155, 45);
  ctx.stroke();

  // Bottom left
  ctx.beginPath();
  ctx.moveTo(55, height - 95);
  ctx.lineTo(55, height - 45);
  ctx.lineTo(155, height - 45);
  ctx.stroke();

  // Bottom right
  ctx.beginPath();
  ctx.moveTo(width - 55, height - 95);
  ctx.lineTo(width - 55, height - 45);
  ctx.lineTo(width - 155, height - 45);
  ctx.stroke();

  // ═════════════════════════════════════
  // TOP LABEL
  // ═════════════════════════════════════

  ctx.textAlign = "center";

  ctx.font =
    'bold 25px "Courier New"';

  ctx.fillStyle = "#ff1744";

  ctx.fillText(
    "◢  DHAKA • BANGLADESH  ◣",
    width / 2,
    105
  );

  ctx.font =
    '18px "Courier New"';

  ctx.fillStyle =
    "rgba(255,255,255,0.35)";

  ctx.fillText(
    "LOCAL TIME SYSTEM",
    width / 2,
    140
  );

  // ═════════════════════════════════════
  // BIG DIGITAL CLOCK
  // ═════════════════════════════════════

  ctx.save();

  ctx.shadowColor =
    "#ff003c";

  ctx.shadowBlur = 45;

  ctx.font =
    'bold 108px "Courier New"';

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    data.timeStr,
    width / 2,
    270
  );

  ctx.restore();

  // AM / PM

  ctx.font =
    'bold 35px "Courier New"';

  ctx.fillStyle =
    "#ff1744";

  ctx.fillText(
    data.ampm,
    width / 2,
    320
  );

  // ═════════════════════════════════════
  // DAY
  // ═════════════════════════════════════

  ctx.font =
    'bold 58px "Arial"';

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    data.dayName.toUpperCase(),
    width / 2,
    405
  );

  // Accent line

  ctx.strokeStyle =
    "#ff1744";

  ctx.lineWidth = 4;

  ctx.beginPath();

  ctx.moveTo(350, 430);
  ctx.lineTo(650, 430);

  ctx.stroke();

  // DATE

  ctx.font =
    '28px "Arial"';

  ctx.fillStyle =
    "rgba(255,255,255,0.55)";

  ctx.fillText(
    `${data.date} ${data.monthName} ${data.year}`,
    width / 2,
    475
  );

  // ═════════════════════════════════════
  // CALENDAR PANEL
  // ═════════════════════════════════════

  const panelX = 65;
  const panelY = 525;
  const panelW = width - 130;
  const panelH = 470;

  // Panel background

  roundRect(
    ctx,
    panelX,
    panelY,
    panelW,
    panelH,
    28
  );

  ctx.fillStyle =
    "rgba(8,2,4,0.98)";

  ctx.fill();

  // Panel border

  ctx.strokeStyle =
    "rgba(255,23,68,0.45)";

  ctx.lineWidth = 2;

  ctx.stroke();

  // Panel top accent

  ctx.strokeStyle =
    "#ff1744";

  ctx.lineWidth = 4;

  ctx.beginPath();

  ctx.moveTo(
    panelX + 30,
    panelY
  );

  ctx.lineTo(
    panelX + 260,
    panelY
  );

  ctx.stroke();

  // Month title

  ctx.font =
    'bold 30px "Arial"';

  ctx.fillStyle =
    "#ff1744";

  ctx.fillText(
    `${data.monthName.toUpperCase()} ${data.year}`,
    width / 2,
    panelY + 55
  );

  // ═════════════════════════════════════
  // WEEK DAYS
  // ═════════════════════════════════════

  const weekDays = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT"
  ];

  const cellW = 118;
  const startX =
    (width - cellW * 7) / 2 + cellW / 2;

  const headerY =
    panelY + 105;

  ctx.font =
    'bold 20px "Arial"';

  weekDays.forEach((day, i) => {

    ctx.fillStyle =
      i === 0 || i === 6
        ? "#ff405f"
        : "#777777";

    ctx.fillText(
      day,
      startX + i * cellW,
      headerY
    );
  });

  // ═════════════════════════════════════
  // CALENDAR GRID
  // ═════════════════════════════════════

  const firstDay =
    new Date(
      data.year,
      data.month,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      data.year,
      data.month + 1,
      0
    ).getDate();

  const gridY =
    panelY + 155;

  const rowHeight = 62;

  let dayNumber = 1;

  for (let row = 0; row < 6; row++) {

    for (let col = 0; col < 7; col++) {

      const index =
        row * 7 + col;

      if (index < firstDay)
        continue;

      if (dayNumber > daysInMonth)
        break;

      const x =
        startX + col * cellW;

      const y =
        gridY + row * rowHeight;

      // Current day circle

      if (dayNumber === data.date) {

        ctx.save();

        ctx.shadowColor =
          "#ff1744";

        ctx.shadowBlur = 28;

        ctx.beginPath();

        ctx.arc(
          x,
          y - 8,
          25,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "#ff1744";

        ctx.fill();

        ctx.restore();

        ctx.font =
          'bold 22px "Arial"';

        ctx.fillStyle =
          "#000000";

      } else {

        ctx.font =
          'bold 21px "Arial"';

        ctx.fillStyle =
          col === 0 || col === 6
            ? "#c9344d"
            : "#777777";
      }

      ctx.fillText(
        String(dayNumber),
        x,
        y
      );

      dayNumber++;
    }

    if (dayNumber > daysInMonth)
      break;
  }

  // ═════════════════════════════════════
  // FOOTER
  // ═════════════════════════════════════

  ctx.strokeStyle =
    "rgba(255,23,68,0.25)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(150, 1035);
  ctx.lineTo(850, 1035);

  ctx.stroke();

  ctx.font =
    'bold 25px "Arial"';

  ctx.fillStyle =
    "#ff1744";

  ctx.fillText(
    "MOHAMMAD MARUF",
    width / 2,
    1080
  );

  ctx.font =
    '16px "Courier New"';

  ctx.fillStyle =
    "rgba(255,255,255,0.3)";

  ctx.fillText(
    "BDT  •  GMT+6  •  LIVE",
    width / 2,
    1110
  );

  // ═════════════════════════════════════
  // SAVE IMAGE
  // ═════════════════════════════════════

  const cacheDir =
    path.join(
      __dirname,
      "cache"
    );

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(
      cacheDir,
      { recursive: true }
    );
  }

  const filePath =
    path.join(
      cacheDir,
      `time_${Date.now()}.png`
    );

  fs.writeFileSync(
    filePath,
    canvas.toBuffer("image/png")
  );

  return filePath;
}


// ═══════════════════════════════════════
// ROUND RECTANGLE
// ═══════════════════════════════════════

function roundRect(
  ctx,
  x,
  y,
  w,
  h,
  r
) {

  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.lineTo(
    x + w - r,
    y
  );

  ctx.quadraticCurveTo(
    x + w,
    y,
    x + w,
    y + r
  );

  ctx.lineTo(
    x + w,
    y + h - r
  );

  ctx.quadraticCurveTo(
    x + w,
    y + h,
    x + w - r,
    y + h
  );

  ctx.lineTo(
    x + r,
    y + h
  );

  ctx.quadraticCurveTo(
    x,
    y + h,
    x,
    y + h - r
  );

  ctx.lineTo(
    x,
    y + r
  );

  ctx.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  );

  ctx.closePath();
}