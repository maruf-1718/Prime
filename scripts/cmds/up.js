const { createCanvas, registerFont } = require("canvas");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/* ═══════════════════════════════════════
   🎮 GAMING FONT
═══════════════════════════════════════ */

const fontDir = path.join(__dirname, "fonts");

try {
  registerFont(path.join(fontDir, "CourierPrime-Regular.ttf"), {
    family: "Gaming"
  });

  registerFont(path.join(fontDir, "CourierPrime-Bold.ttf"), {
    family: "Gaming",
    weight: "bold"
  });
} catch (err) {
  console.log("Font loading warning:", err.message);
}

/* ═══════════════════════════════════════
   ⚙️ SYSTEM HELPERS
═══════════════════════════════════════ */

let previousCPU = null;

function getCPU() {
  let idle = 0;
  let total = 0;

  for (const cpu of os.cpus()) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }

    idle += cpu.times.idle;
  }

  const current = { idle, total };

  if (!previousCPU) {
    previousCPU = current;
    return 0;
  }

  const idleDiff = current.idle - previousCPU.idle;
  const totalDiff = current.total - previousCPU.total;

  previousCPU = current;

  if (!totalDiff) return 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - (100 * idleDiff) / totalDiff)
    )
  );
}

function getDisk() {
  try {
    const output = execSync("df -k /").toString();
    const line = output.split("\n")[1];
    const parts = line.split(/\s+/);

    const used = parseInt(parts[2]);
    const total = parseInt(parts[1]);

    if (!used || !total) return 0;

    return Math.min(
      100,
      Math.round((used / total) * 100)
    );
  } catch {
    return 0;
  }
}

function getTemperature() {
  try {
    if (os.platform() === "linux") {
      const temp = execSync(
        "cat /sys/class/thermal/thermal_zone0/temp"
      ).toString().trim();

      return Math.round(parseInt(temp) / 1000);
    }
  } catch {}

  return 45;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];

  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(1)} ${units[index]}`;
}

function getUptime() {
  const seconds = process.uptime();

  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${d}d ${h}h ${m}m ${s}s`;
}

function getStatus(ping) {
  if (ping < 100) return "EXCELLENT";
  if (ping < 250) return "STABLE";
  if (ping < 500) return "GOOD";
  return "HIGH LATENCY";
}

/* ═══════════════════════════════════════
   🎨 GRAPHICS HELPERS
═══════════════════════════════════════ */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();

  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(
    x + w,
    y + h,
    x + w - r,
    y + h
  );

  ctx.lineTo(x + r, y + h);

  ctx.quadraticCurveTo(
    x,
    y + h,
    x,
    y + h - r
  );

  ctx.lineTo(x, y + r);

  ctx.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  );

  ctx.closePath();
}

function glowText(
  ctx,
  text,
  x,
  y,
  color,
  size,
  align = "left"
) {
  ctx.save();

  ctx.font = `bold ${size}px "Gaming"`;
  ctx.textAlign = align;

  ctx.shadowColor = color;
  ctx.shadowBlur = 25;

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  ctx.shadowBlur = 0;

  ctx.restore();
}

function panel(
  ctx,
  x,
  y,
  w,
  h,
  title
) {
  ctx.save();

  ctx.shadowColor =
    "rgba(255,0,30,0.20)";

  ctx.shadowBlur = 25;

  roundRect(
    ctx,
    x,
    y,
    w,
    h,
    18
  );

  ctx.fillStyle =
    "rgba(4,4,5,0.98)";

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    "rgba(255,0,35,0.45)";

  ctx.lineWidth = 2;

  ctx.stroke();

  /* Red top accent */

  ctx.strokeStyle = "#ff003c";
  ctx.lineWidth = 4;

  ctx.beginPath();

  ctx.moveTo(
    x + 20,
    y
  );

  ctx.lineTo(
    x + 180,
    y
  );

  ctx.stroke();

  /* Panel title */

  ctx.font =
    `bold 22px "Gaming"`;

  ctx.fillStyle =
    "#ff1744";

  ctx.textAlign =
    "left";

  ctx.fillText(
    `// ${title}`,
    x + 25,
    y + 36
  );

  ctx.restore();
}

function progressBar(
  ctx,
  x,
  y,
  width,
  value
) {
  const height = 16;

  /* Background */

  roundRect(
    ctx,
    x,
    y,
    width,
    height,
    8
  );

  ctx.fillStyle =
    "#120205";

  ctx.fill();

  /* Progress */

  const fill =
    Math.max(
      4,
      width * value / 100
    );

  roundRect(
    ctx,
    x,
    y,
    fill,
    height,
    8
  );

  const gradient =
    ctx.createLinearGradient(
      x,
      y,
      x + fill,
      y
    );

  gradient.addColorStop(
    0,
    "#70000f"
  );

  gradient.addColorStop(
    0.5,
    "#ff003c"
  );

  gradient.addColorStop(
    1,
    "#ff5577"
  );

  ctx.fillStyle =
    gradient;

  ctx.fill();

  ctx.strokeStyle =
    "rgba(255,0,50,0.35)";

  ctx.lineWidth = 1;

  ctx.stroke();
}

function metric(
  ctx,
  x,
  y,
  label,
  value
) {
  ctx.font =
    `18px "Gaming"`;

  ctx.fillStyle =
    "#77333e";

  ctx.textAlign =
    "left";

  ctx.fillText(
    label,
    x,
    y
  );

  ctx.font =
    `bold 28px "Gaming"`;

  ctx.fillStyle =
    "#ff1744";

  ctx.fillText(
    `${value}%`,
    x,
    y + 32
  );

  progressBar(
    ctx,
    x + 85,
    y + 10,
    300,
    value
  );
}

/* ═══════════════════════════════════════
   🚀 MODULE
═══════════════════════════════════════ */

module.exports = {

  config: {
    name: "up",
    aliases: [
      "uptime",
      "status",
      "sysinfo"
    ],
    version: "3.1.0",
    author: "Mohammad Maruf",
    role: 0,
    category: "system",

    shortDescription:
      "Gaming style system dashboard",

    longDescription:
      "Premium AMOLED gaming dashboard with real-time system information.",

    guide: "{pn}"
  },

  onStart: async function ({
    message,
    api,
    event
  }) {

    try {

      const start =
        Date.now();

      /* ═══════════════════════
         SYSTEM DATA
      ═══════════════════════ */

      const cpu =
        getCPU();

      const totalRAM =
        os.totalmem();

      const freeRAM =
        os.freemem();

      const usedRAM =
        totalRAM - freeRAM;

      const ram =
        Math.min(
          100,
          Math.round(
            usedRAM /
            totalRAM *
            100
          )
        );

      const disk =
        getDisk();

      const temperature =
        getTemperature();

      const cores =
        os.cpus().length;

      const platform =
        `${os.platform().toUpperCase()} ${os.arch()}`;

      const node =
        process.version;

      const hostname =
        os.hostname();

      const load =
        os.loadavg()[0]
          .toFixed(2);

      const uptime =
        getUptime();

      const ping =
        Math.min(
          Date.now() - start,
          9999
        );

      const status =
        getStatus(ping);

      const usedMemory =
        formatBytes(usedRAM);

      const totalMemory =
        formatBytes(totalRAM);

      const now =
        new Date();

      const time =
        now.toLocaleTimeString(
          "en-US",
          {
            hour12: false,
            timeZone:
              "Asia/Dhaka"
          }
        );

      const date =
        now.toLocaleDateString(
          "en-GB",
          {
            timeZone:
              "Asia/Dhaka"
          }
        );

      /* ═══════════════════════
         CANVAS
      ═══════════════════════ */

      const W = 1800;
      const H = 1200;

      const canvas =
        createCanvas(W, H);

      const ctx =
        canvas.getContext("2d");

      /* PURE AMOLED BLACK */

      ctx.fillStyle =
        "#000000";

      ctx.fillRect(
        0,
        0,
        W,
        H
      );

      /* ═══════════════════════
         GAMING GRID
      ═══════════════════════ */

      ctx.save();

      ctx.strokeStyle =
        "rgba(255,0,40,0.035)";

      ctx.lineWidth = 1;

      for (
        let x = 0;
        x < W;
        x += 45
      ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);

        ctx.stroke();
      }

      for (
        let y = 0;
        y < H;
        y += 45
      ) {

        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(W, y);

        ctx.stroke();
      }

      ctx.restore();

      /* ═══════════════════════
         TOP CORNERS
      ═══════════════════════ */

      ctx.fillStyle =
        "#ff003c";

      ctx.fillRect(
        60,
        55,
        8,
        100
      );

      ctx.fillRect(
        60,
        55,
        120,
        8
      );

      ctx.fillRect(
        W - 68,
        55,
        8,
        100
      );

      ctx.fillRect(
        W - 180,
        55,
        120,
        8
      );

      /* ═══════════════════════
         BIG NAME
      ═══════════════════════ */

      glowText(
        ctx,
        "MOHAMMAD MARUF",
        W / 2,
        125,
        "#ff003c",
        82,
        "center"
      );

      ctx.font =
        `bold 22px "Gaming"`;

      ctx.fillStyle =
        "#8f152a";

      ctx.textAlign =
        "center";

      ctx.fillText(
        "◢  MARUF GAMING CORE  ◣",
        W / 2,
        165
      );

      /* ═══════════════════════
         TOP STATUS
      ═══════════════════════ */

      roundRect(
        ctx,
        80,
        205,
        W - 160,
        58,
        14
      );

      ctx.fillStyle =
        "#050000";

      ctx.fill();

      ctx.strokeStyle =
        "rgba(255,0,45,0.35)";

      ctx.stroke();

      ctx.font =
        `bold 18px "Gaming"`;

      ctx.textAlign =
        "left";

      ctx.fillStyle =
        "#ff1744";

      ctx.fillText(
        "● SYSTEM ONLINE",
        110,
        241
      );

      ctx.textAlign =
        "center";

      ctx.fillStyle =
        "#702431";

      ctx.fillText(
        `HOST // ${hostname.substring(0, 25)}`,
        W / 2,
        241
      );

      ctx.textAlign =
        "right";

      ctx.fillStyle =
        "#ff1744";

      ctx.fillText(
        `${date} // ${time}`,
        W - 110,
        241
      );

      /* ═══════════════════════
         CORE PANEL
      ═══════════════════════ */

      panel(
        ctx,
        80,
        300,
        800,
        360,
        "SYSTEM CORE"
      );

      const systemInfo = [
        ["PLATFORM", platform],
        ["PROCESSOR", `${cores} CORES`],
        ["NODE.JS", node],
        ["CPU LOAD", `${load}%`],
        ["TEMPERATURE", `${temperature}°C`],
        ["HOSTNAME", hostname.substring(0, 25)]
      ];

      systemInfo.forEach(
        (item, index) => {

          const y =
            375 +
            index * 45;

          ctx.font =
            `17px "Gaming"`;

          ctx.fillStyle =
            "#702431";

          ctx.textAlign =
            "left";

          ctx.fillText(
            item[0],
            120,
            y
          );

          ctx.font =
            `bold 20px "Gaming"`;

          ctx.fillStyle =
            "#eeeeee";

          ctx.fillText(
            item[1],
            320,
            y
          );

          ctx.strokeStyle =
            "rgba(255,0,40,0.08)";

          ctx.beginPath();

          ctx.moveTo(
            120,
            y + 12
          );

          ctx.lineTo(
            840,
            y + 12
          );

          ctx.stroke();
        }
      );

      /* ═══════════════════════
         LIVE METRICS
      ═══════════════════════ */

      panel(
        ctx,
        920,
        300,
        800,
        360,
        "LIVE PERFORMANCE"
      );

      metric(
        ctx,
        960,
        385,
        "CPU",
        cpu
      );

      metric(
        ctx,
        960,
        470,
        "MEMORY",
        ram
      );

      metric(
        ctx,
        960,
        555,
        "STORAGE",
        disk
      );

      ctx.font =
        `17px "Gaming"`;

      ctx.fillStyle =
        "#6d303b";

      ctx.fillText(
        `RAM ${usedMemory} / ${totalMemory}`,
        960,
        630
      );

      /* ═══════════════════════
         BOT STATUS
      ═══════════════════════ */

      panel(
        ctx,
        80,
        700,
        1640,
        180,
        "BOT PERFORMANCE"
      );

      ctx.font =
        `17px "Gaming"`;

      ctx.fillStyle =
        "#6d303b";

      ctx.textAlign =
        "left";

      ctx.fillText(
        "BOT UPTIME",
        125,
        755
      );

      glowText(
        ctx,
        uptime,
        125,
        815,
        "#ff1744",
        42
      );

      ctx.fillStyle =
        "#6d303b";

      ctx.font =
        `17px "Gaming"`;

      ctx.fillText(
        "RESPONSE",
        650,
        755
      );

      glowText(
        ctx,
        `${ping} ms`,
        650,
        815,
        "#ff1744",
        42
      );

      ctx.fillStyle =
        "#6d303b";

      ctx.font =
        `17px "Gaming"`;

      ctx.fillText(
        "STATUS",
        1160,
        755
      );

      glowText(
        ctx,
        status,
        1160,
        815,
        ping < 250
          ? "#ff1744"
          : "#ff8800",
        38
      );

      /* ═══════════════════════
         GAMING DIAGNOSTICS
      ═══════════════════════ */

      panel(
        ctx,
        80,
        920,
        1640,
        155,
        "DIAGNOSTICS"
      );

      const diagnostics = [
        ["PID", process.pid],
        ["CORES", cores],
        ["LOAD", load],
        ["ARCH", os.arch()],
        ["NODE", node]
      ];

      diagnostics.forEach(
        (item, index) => {

          const x =
            125 +
            index * 315;

          ctx.font =
            `16px "Gaming"`;

          ctx.fillStyle =
            "#702431";

          ctx.fillText(
            item[0],
            x,
            975
          );

          ctx.font =
            `bold 21px "Gaming"`;

          ctx.fillStyle =
            "#eeeeee";

          ctx.fillText(
            String(item[1]),
            x,
            1015
          );
        }
      );

      /* ═══════════════════════
         FOOTER
      ═══════════════════════ */

      ctx.textAlign =
        "center";

      ctx.font =
        `bold 19px "Gaming"`;

      ctx.fillStyle =
        "#7a2031";

      ctx.fillText(
        "⚡ MARUF CORE // GAMING SYSTEM // ALL SYSTEMS OPERATIONAL ⚡",
        W / 2,
        1135
      );

      /* ═══════════════════════
         SAVE
      ═══════════════════════ */

      const cacheDir =
        path.join(
          __dirname,
          "cache"
        );

      fs.mkdirSync(
        cacheDir,
        {
          recursive: true
        }
      );

      const filePath =
        path.join(
          cacheDir,
          `maruf_up_${Date.now()}.png`
        );

      fs.writeFileSync(
        filePath,
        canvas.toBuffer("image/png")
      );

      /* ═══════════════════════
         SEND
      ═══════════════════════ */

      await message.reply({
        attachment:
          fs.createReadStream(
            filePath
          )
      });

      /* CLEAN CACHE */

      setTimeout(() => {

        try {

          if (
            fs.existsSync(
              filePath
            )
          ) {
            fs.unlinkSync(
              filePath
            );
          }

        } catch {}

      }, 15000);

    } catch (error) {

      console.error(
        "MARUF UP ERROR:",
        error
      );

      return message.reply(
        "❌ Gaming system dashboard তৈরি করা যায়নি।"
      );
    }
  },

  /* ═══════════════════════════════
     HACK TRIGGER
  ═══════════════════════════════ */

  onChat: async function ({
    event,
    api
  }) {

    if (
      event.body &&
      event.body
        .trim()
        .toLowerCase() === "hack"
    ) {

      return api.sendMessage(
        "╭──────〔 ⚠ SECURITY 〕──────╮\n" +
        "│\n" +
        "│   ACCESS DENIED\n" +
        "│   INSUFFICIENT PRIVILEGES\n" +
        "│\n" +
        "╰────────────────────────────╯",
        event.threadID
      );
    }
  }
};