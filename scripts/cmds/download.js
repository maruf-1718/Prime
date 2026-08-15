const axios = require("axios");
const fs = require("fs");
const path = require("path");

const TEMP_DIR = path.join(__dirname, "download_tmp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/* =========================================================
   HELPERS
========================================================= */

function getExtension(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase();

    if (ext && ext.length <= 6) {
      return ext;
    }
  } catch {}

  return ".mp4";
}

function isTikTok(url) {
  return /(^|\.)tiktok\.com$/i.test(
    new URL(url).hostname.replace(/^www\./, "")
  ) || /(^|\.)vt\.tiktok\.com$/i.test(
    new URL(url).hostname
  );
}

function isDirectMedia(url) {
  return /\.(mp4|mp3|m4a|jpg|jpeg|png|gif|webm)(\?.*)?$/i.test(url);
}

/* =========================================================
   AZBRY TIKTOK
========================================================= */

async function getTikTok(url) {
  const apiUrl =
    "https://api.azbry.com/api/download/tiktok";

  const response = await axios.get(apiUrl, {
    params: { url },
    timeout: 20000,
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  const data = response.data;

  if (!data || data.status !== true) {
    throw new Error(
      data?.message || "TikTok download failed"
    );
  }

  const download = data.download || {};

  const videoUrl =
    download.nowm ||
    download.url ||
    download.video ||
    download.play;

  if (!videoUrl) {
    throw new Error(
      "No downloadable video URL returned."
    );
  }

  return {
    url: videoUrl,
    ext: ".mp4"
  };
}

/* =========================================================
   DOWNLOAD FILE
========================================================= */

async function downloadFile(url, filePath) {
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: 60000,
    maxRedirects: 5,
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "*/*"
    }
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", resolve);
    writer.on("error", reject);

    response.data.on("error", reject);
  });

  return filePath;
}

/* =========================================================
   MODULE
========================================================= */

module.exports = {
  config: {
    name: "download",
    version: "2.0",
    author: "Mohammad Maruf",
    countDown: 5,
    role: 0,

    shortDescription: {
      en: "Download supported social videos"
    },

    longDescription: {
      en: "Download TikTok videos from a public URL"
    },

    category: "media",

    guide: {
      en: "{pn} <video-link>"
    }
  },

  onStart: async function ({
    api,
    event,
    args
  }) {

    const input = args[0];

    /* =====================================================
       NO URL
    ===================================================== */

    if (!input) {
      return api.sendMessage(
        "🎀 Please send a video link.\n\nExample:\n/download https://www.tiktok.com/...",
        event.threadID,
        event.messageID
      );
    }

    let parsed;

    try {
      parsed = new URL(input);
    } catch {
      return api.sendMessage(
        "😩 Invalid video link.",
        event.threadID,
        event.messageID
      );
    }

    const url = parsed.href;

    /* =====================================================
       LOADING
    ===================================================== */

    let loading;

    try {
      loading = await api.sendMessage(
        "🎀 Downloading video...\nPlease wait.",
        event.threadID
      );
    } catch {}

    let filePath = null;

    try {

      /* ===================================================
         TIKTOK
      =================================================== */

      if (isTikTok(url)) {

        const result =
          await getTikTok(url);

        const fileName =
          `tiktok_${Date.now()}.mp4`;

        filePath =
          path.join(
            TEMP_DIR,
            fileName
          );

        await downloadFile(
          result.url,
          filePath
        );

      }

      /* ===================================================
         DIRECT MEDIA URL
      =================================================== */

      else if (isDirectMedia(url)) {

        const ext =
          getExtension(url);

        const fileName =
          `media_${Date.now()}${ext}`;

        filePath =
          path.join(
            TEMP_DIR,
            fileName
          );

        await downloadFile(
          url,
          filePath
        );

      }

      /* ===================================================
         UNSUPPORTED
      =================================================== */

      else {

        if (loading?.messageID) {
          try {
            await api.unsendMessage(
              loading.messageID
            );
          } catch {}
        }

        return api.sendMessage(
          "😩 এই platform এখনো এই command-এ supported নয়.\n\nবর্তমানে supported:\n• TikTok\n• Direct media link",
          event.threadID,
          event.messageID
        );
      }

      /* ===================================================
         REMOVE LOADING
      =================================================== */

      if (loading?.messageID) {
        try {
          await api.unsendMessage(
            loading.messageID
          );
        } catch {}
      }

      /* ===================================================
         SEND FILE
      =================================================== */

      return api.sendMessage(
        {
          body:
            "🪽 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲!\n\n🎬 Your video is ready.",
          attachment:
            fs.createReadStream(filePath)
        },
        event.threadID,
        () => {

          /* ===============================================
             CLEAN TEMP FILE
          =============================================== */

          if (filePath) {
            fs.unlink(
              filePath,
              () => {}
            );
          }
        },
        event.messageID
      );

    } catch (error) {

      console.error(
        "[DOWNLOAD ERROR]",
        error.response?.data ||
        error.message
      );

      /* ===================================================
         REMOVE LOADING
      =================================================== */

      if (loading?.messageID) {
        try {
          await api.unsendMessage(
            loading.messageID
          );
        } catch {}
      }

      /* ===================================================
         CLEAN FAILED FILE
      =================================================== */

      if (filePath) {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch {}
      }

      let errorText =
        "😩 Download failed.";

      if (
        error.response?.status === 429
      ) {
        errorText =
          "😩 Downloader API rate limit reached.\nকিছুক্ষণ পরে আবার চেষ্টা করো.";
      }

      return api.sendMessage(
        errorText,
        event.threadID,
        event.messageID
      );
    }
  }
};