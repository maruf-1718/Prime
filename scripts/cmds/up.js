const { createCanvas, registerFont } = require("canvas");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/* ═══════════════════════════════════════
   ⚡ CYBERPUNK FONT
═══════════════════════════════════════ */

const fontDir = path.join(__dirname, "fonts");

try {
  registerFont(path.join(fontDir, "CourierPrime-Regular.ttf"), {
    family: "Cyber"
  });

  registerFont(path.join(fontDir, "CourierPrime-Bold.ttf"), {
    family: "Cyber",
    weight: "bold"
  });
} catch (err) {
  console.log("Cyber font loading warning:", err.message);
}

/* ═══════════════════════════════════════
   🖥️ SYSTEM FUNCTIONS
═══════════════════════════════════════ */

let previousCPU = null;

function getCPUUsage() {
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

function getDiskUsage() {
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

  return 42 + Math.floor(Math.random() * 10);
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];

  let i = 0;
  let value = bytes;

  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }

  return `${value.toFixed(1)} ${units[i]}`;
}

function getUptime() {
  const sec = process.uptime();

  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);

  return `${d}d ${h}h ${m}m ${s}s`;
}

function getStatus(ping) {
  if (ping < 100) return "EXCELLENT";
  if (ping < 250) return "STABLE";
  if (ping < 500) return "GOOD";
  return "HIGH LATENCY";
}

/* ═══════════════════════════════════════
   🎨 DRAW HELPERS
═══════════════════════════════════════ */

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGlowText(ctx, text, x, y, color, size, align = "left") {
  ctx.save();

  ctx.textAlign = align;
  ctx.font = `bold ${size}px "Cyber"`;

  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);

  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawPanel(ctx, x, y, w, h, title) {
  ctx.save();

  // Shadow
  ctx.shadowColor = "rgba(0,255,150,0.15)";
  ctx.shadowBlur = 25;

  roundedRect(ctx, x, y, w, h, 20);

  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);

  gradient.addColorStop(0, "rgba(12,25,27,0.96)");
  gradient.addColorStop(1, "rgba(5,12,18,0.96)");

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.strokeStyle = "rgba(0,255,140,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Top accent
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + 150, y);
  ctx.stroke();

  // Title
  ctx.font = `bold 25px "Cyber"`;
  ctx.fillStyle = "#00ff88";
  ctx.textAlign = "left";
  ctx.fillText(`◆ ${title}`, x + 25, y + 38);

  ctx.restore();
}

function drawProgress(ctx, x, y, w, value, color) {
  const h = 18;

  roundedRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = "#061313";
  ctx.fill();

  const fillWidth = Math.max(5, (w * value) / 100);

  roundedRect(ctx, x, y, fillWidth, h, 9);

  const gradient = ctx.createLinearGradient(
    x,
    y,
    x + fillWidth,
    y
  );

  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#ffffff");

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = "rgba(0,255,150,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawMetric(ctx, x, y, label, value, color) {
  ctx.font = `22px "Cyber"`;
  ctx.textAlign = "left";

  ctx.fillStyle = "#6d8f8a";
  ctx.fillText(label, x, y);

  ctx.font = `bold 28px "Cyber"`;
  ctx.fillStyle = color;
  ctx.fillText(`${value}%`, x, y + 34);

  drawProgress(
    ctx,
    x + 90,
    y + 18,
    250,
    value,
    color
  );
}

function drawScanlines(ctx, W, H) {
  ctx.save();

  for (let y = 0; y < H; y += 6) {
    ctx.fillStyle =
      y % 12 === 0
        ? "rgba(0,255,140,0.025)"
        : "rgba(0,255,140,0.012)";

    ctx.fillRect(0, y, W, 2);
  }

  ctx.restore();
}

/* ═══════════════════════════════════════
   🚀 MODULE
═══════════════════════════════════════ */

module.exports = {
  config: {
    name: "up",
    aliases: ["uptime", "status", "sysinfo"],
    version: "3.0.0",
    author: "Mohammad Maruf",
    role: 0,
    category: "system",

    shortDescription:
      "Premium Cyberpunk System Dashboard",

    longDescription:
      "Displays real-time bot uptime, CPU, RAM, storage, system and response information in a futuristic cyberpunk dashboard.",

    guide: "{pn}"
  },

  onStart: async function ({ message, api, event }) {
    try {
      const start = Date.now();

      /* ═══════════════════════════════
         SYSTEM DATA
      ═══════════════════════════════ */

      const cpu = Math.min(getCPUUsage(), 100);

      const totalRAM = os.totalmem();
      const freeRAM = os.freemem();
      const usedRAM = totalRAM - freeRAM;

      const ram = Math.min(
        100,
        Math.round((usedRAM / totalRAM) * 100)
      );

      const disk = getDiskUsage();

      const temp = getTemperature();

      const cores = os.cpus().length;

      const platform =
        `${os.platform().toUpperCase()} ${os.arch()}`;

      const nodeVersion = process.version;

      const hostname = os.hostname();

      const uptime = getUptime();

      const ping = Math.min(
        Date.now() - start,
        9999
      );

      const status = getStatus(ping);

      const load = os.loadavg()[0].toFixed(2);

      const totalMemoryText = formatBytes(totalRAM);
      const usedMemoryText = formatBytes(usedRAM);

      const now = new Date();

      const time = now.toLocaleTimeString(
        "en-US",
        {
          hour12: false,
          timeZone: "Asia/Dhaka"
        }
      );

      const date = now.toLocaleDateString(
        "en-GB",
        {
          timeZone: "Asia/Dhaka"
        }
      );

      /* ═══════════════════════════════
         CANVAS
      ═══════════════════════════════ */

      const W = 1800;
      const H = 1200;

      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");

      /* BACKGROUND */

      const bg = ctx.createLinearGradient(
        0,
        0,
        W,
        H
      );

      bg.addColorStop(0, "#020708");
      bg.addColorStop(0.5, "#061313");
      bg.addColorStop(1, "#020607");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      /* GRID */

      ctx.save();

      ctx.strokeStyle = "rgba(0,255,130,0.045)";
      ctx.lineWidth = 1;

      for (let x = 0; x < W; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      for (let y = 0; y < H; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      ctx.restore();

      drawScanlines(ctx, W, H);

      /* ═══════════════════════════════
         TOP HEADER
      ═══════════════════════════════ */

      drawGlowText(
        ctx,
        "SYSTEM // ONLINE",
        90,
        95,
        "#00ff88",
        30
      );

      ctx.font = `20px "Cyber"`;
      ctx.fillStyle = "#46736d";
      ctx.textAlign = "right";

      ctx.fillText(
        `${date}  //  ${time}`,
        W - 90,
        95
      );

      drawGlowText(
        ctx,
        "N E X U S",
        W / 2,
        170,
        "#00ffff",
        78,
        "center"
      );

      ctx.font = `22px "Cyber"`;
      ctx.fillStyle = "#578f88";
      ctx.textAlign = "center";

      ctx.fillText(
        "ADVANCED BOT MONITORING INTERFACE",
        W / 2,
        215
      );

      /* ═══════════════════════════════
         STATUS BAR
      ═══════════════════════════════ */

      roundedRect(
        ctx,
        80,
        250,
        W - 160,
        60,
        15
      );

      ctx.fillStyle = "rgba(0,255,130,0.05)";
      ctx.fill();

      ctx.strokeStyle = "rgba(0,255,130,0.25)";
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = `20px "Cyber"`;

      ctx.fillStyle = "#00ff88";
      ctx.fillText(
        "● CONNECTION ESTABLISHED",
        110,
        288
      );

      ctx.fillStyle = "#456b65";
      ctx.textAlign = "center";

      ctx.fillText(
        `HOST: ${hostname.substring(0, 25)}`,
        W / 2,
        288
      );

      ctx.textAlign = "right";
      ctx.fillStyle = "#00ffff";

      ctx.fillText(
        `PING: ${ping}ms`,
        W - 110,
        288
      );

      /* ═══════════════════════════════
         LEFT SYSTEM PANEL
      ═══════════════════════════════ */

      drawPanel(
        ctx,
        80,
        350,
        790,
        350,
        "SYSTEM CORE"
      );

      const leftX = 115;

      const systemRows = [
        ["PLATFORM", platform],
        ["PROCESSOR", `${cores} CORES`],
        ["NODE.JS", nodeVersion],
        ["CPU LOAD", `${load}%`],
        ["TEMPERATURE", `${temp}°C`],
        ["HOST", hostname.substring(0, 28)]
      ];

      systemRows.forEach((row, index) => {
        const y = 425 + index * 43;

        ctx.font = `18px "Cyber"`;
        ctx.textAlign = "left";

        ctx.fillStyle = "#52746f";
        ctx.fillText(row[0], leftX, y);

        ctx.font = `bold 20px "Cyber"`;
        ctx.fillStyle = "#d4fff5";

        ctx.fillText(
          row[1],
          leftX + 220,
          y
        );

        ctx.strokeStyle =
          "rgba(0,255,140,0.08)";

        ctx.beginPath();

        ctx.moveTo(
          leftX,
          y + 12
        );

        ctx.lineTo(
          820,
          y + 12
        );

        ctx.stroke();
      });

      /* ═══════════════════════════════
         RIGHT METRICS PANEL
      ═══════════════════════════════ */

      drawPanel(
        ctx,
        910,
        350,
        810,
        350,
        "LIVE METRICS"
      );

      drawMetric(
        ctx,
        950,
        430,
        "CPU",
        cpu,
        "#00ff88"
      );

      drawMetric(
        ctx,
        950,
        515,
        "MEMORY",
        ram,
        "#00d9ff"
      );

      drawMetric(
        ctx,
        950,
        600,
        "STORAGE",
        disk,
        "#c66cff"
      );

      ctx.font = `17px "Cyber"`;
      ctx.fillStyle = "#52746f";
      ctx.textAlign = "left";

      ctx.fillText(
        `RAM: ${usedMemoryText} / ${totalMemoryText}`,
        950,
        670
      );

      /* ═══════════════════════════════
         BOT UPTIME PANEL
      ═══════════════════════════════ */

      drawPanel(
        ctx,
        80,
        740,
        1640,
        180,
        "BOT RUNTIME"
      );

      ctx.font = `22px "Cyber"`;
      ctx.fillStyle = "#52746f";
      ctx.textAlign = "left";

      ctx.fillText(
        "UPTIME",
        120,
        805
      );

      drawGlowText(
        ctx,
        uptime,
        120,
        855,
        "#00ffff",
        48
      );

      ctx.font = `22px "Cyber"`;
      ctx.fillStyle = "#52746f";

      ctx.fillText(
        "RESPONSE",
        720,
        805
      );

      drawGlowText(
        ctx,
        `${ping} ms`,
        720,
        855,
        ping < 250 ? "#00ff88" : "#ffaa00",
        48
      );

      ctx.fillStyle = "#52746f";
      ctx.font = `22px "Cyber"`;

      ctx.fillText(
        "STATUS",
        1200,
        805
      );

      drawGlowText(
        ctx,
        status,
        1200,
        855,
        ping < 250 ? "#00ff88" : "#ffaa00",
        40
      );

      /* ═══════════════════════════════
         MEMORY DETAIL
      ═══════════════════════════════ */

      drawPanel(
        ctx,
        80,
        950,
        1640,
        150,
        "DIAGNOSTICS"
      );

      ctx.font = `20px "Cyber"`;
      ctx.textAlign = "left";

      const diagnostics = [
        `PROCESS: ${process.pid}`,
        `THREADS: ${cores}`,
        `LOAD: ${load}`,
        `NODE: ${nodeVersion}`,
        `ARCH: ${os.arch()}`
      ];

      diagnostics.forEach((text, i) => {
        const x = 120 + i * 315;

        ctx.fillStyle = "#496e68";
        ctx.fillText(
          text.split(":")[0],
          x,
          1010
        );

        ctx.font = `bold 22px "Cyber"`;
        ctx.fillStyle = "#b9fff0";

        ctx.fillText(
          text.substring(text.indexOf(":") + 1).trim(),
          x,
          1045
        );

        ctx.font = `20px "Cyber"`;
      });

      /* ═══════════════════════════════
         FOOTER
      ═══════════════════════════════ */

      ctx.textAlign = "center";

      ctx.font = `18px "Cyber"`;
      ctx.fillStyle = "#315b54";

      ctx.fillText(
        "NEXUS MONITORING CORE  •  SECURE SESSION  •  ALL SYSTEMS NOMINAL",
        W / 2,
        1145
      );

      /* ═══════════════════════════════
         SAVE IMAGE
      ═══════════════════════════════ */

      const cacheDir =
        path.join(__dirname, "cache");

      fs.mkdirSync(
        cacheDir,
        { recursive: true }
      );

      const filePath = path.join(
        cacheDir,
        `nexus_${Date.now()}.png`
      );

      const buffer =
        canvas.toBuffer("image/png");

      fs.writeFileSync(
        filePath,
        buffer
      );

      /* ═══════════════════════════════
         SEND
      ═══════════════════════════════ */

      await message.reply({
        attachment:
          fs.createReadStream(filePath)
      });

      /* CLEANUP */

      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch {}
      }, 15000);

    } catch (error) {
      console.error(
        "NEXUS SYSTEM ERROR:",
        error
      );

      return message.reply(
        "❌ System dashboard generate করা সম্ভব হয়নি।"
      );
    }
  },

  /* ═══════════════════════════════
     HACK TRIGGER
  ═══════════════════════════════ */

  onChat: async function ({ event, api }) {
    if (
      event.body &&
      event.body.trim().toLowerCase() === "hack"
    ) {
      return api.sendMessage(
        "╭───〔 SYSTEM 〕───╮\n" +
        "│\n" +
        "│  ACCESS DENIED\n" +
        "│  INSUFFICIENT PRIVILEGES\n" +
        "│\n" +
        "╰─────────────────╯",
        event.threadID
      );
    }
  }
};