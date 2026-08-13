const fs = require("fs");
const path = require("path");
const axios = require("axios");

const API_BASE = "https://mirai-store.vercel.app";
const PASTE_API_BASE = "https://pastebin-raw.vercel.app";
const userSeenNoti = new Map();
const AUTOSYNC_CACHE_PATH = path.join(process.cwd(), "goatstore_sync_cache.json");

let _updateCheckCache = null;
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 30;

function loadSyncCache() {
  try { return JSON.parse(fs.readFileSync(AUTOSYNC_CACHE_PATH, "utf8")); }
  catch { return {}; }
}

function saveSyncCache(cache) {
  try { fs.writeFileSync(AUTOSYNC_CACHE_PATH, JSON.stringify(cache, null, 2)); }
  catch (_) {}
}

function hashContent(content) {
  let h = 0;
  for (let i = 0; i < content.length; i++) h = (h * 31 + content.charCodeAt(i)) | 0;
  return h.toString(16);
}

function detectFramework(code) {
  // Primary check: GoatBot config e author + role dutai thake,
  // Mirai config e credits + hasPermission (function) dutai thake.
  const hasAuthorRole = /\bauthor\s*:/.test(code) && /\brole\s*:/.test(code);
  const hasCreditsPermission = /\bcredits\s*:/.test(code) && /\bhasPermission\s*[:(]/.test(code);

  if (hasAuthorRole && !hasCreditsPermission) return "goat";
  if (hasCreditsPermission && !hasAuthorRole) return "mirai";

  // Ambiguous hole (dutai match korle ba kono ta match na korle) structural check e fallback
  const isGoatStructure =
    /module\.exports\s*=\s*\{/.test(code) &&
    /onStart\s*[:(]|onChat\s*[:(]|onLoad\s*[:(]/.test(code);
  const isMiraiStructure =
    /module\.exports\.config\s*=/.test(code) ||
    /module\.exports\.run\s*=/.test(code);

  return (isGoatStructure && !isMiraiStructure) ? "goat" : "mirai";
}

/**
 * Uploads code to the pastebin service and returns a guaranteed non-empty
 * rawUrl string, or throws. The MiraiStore /miraistore/upload endpoint now
 * hard-requires rawUrl on every call (returns { error: "rawUrl required" }
 * if it's missing), so this must always run BEFORE building the upload
 * payload — every caller below does that, and aborts (never calls
 * /miraistore/upload) if this throws.
 */
async function pasteCode(content) {
  const res = await axios.post(`${PASTE_API_BASE}/api/paste`, { code: content });
  if (!res.data?.id) throw new Error("Paste API theke id pawa jayni.");
  const rawUrl = res.data.url || `${PASTE_API_BASE}/raw/${res.data.id}`;
  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    // Defensive: guarantee callers never receive an empty/falsy rawUrl,
    // since the server now rejects the upload outright without one.
    throw new Error("Paste API theke valid rawUrl toiri kora gelo na.");
  }
  return { id: res.data.id, rawUrl };
}

async function checkSelfUpdate() {
  const now = Date.now();
  if (_updateCheckCache && (now - _updateCheckCache.checkedAt) < UPDATE_CHECK_INTERVAL)
    return _updateCheckCache.result;
  try {
    const res = await axios.get(`${API_BASE}/miraistore/search?q=goatstore&limit=10&type=goat-command`);
    const cmds = Array.isArray(res.data?.commands) ? res.data.commands : [];
    const match =
      cmds.find(c => c.name?.toLowerCase() === "goatstore" && c.author === module.exports.config.author) ||
      cmds.find(c => c.name?.toLowerCase() === "goatstore");
    if (!match) { _updateCheckCache = { checkedAt: now, result: null }; return null; }
    const parseVer = v => String(v).split(".").map(n => parseInt(n) || 0);
    const cmp = (a, b) => {
      const pa = parseVer(a), pb = parseVer(b);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const d = (pa[i] || 0) - (pb[i] || 0);
        if (d !== 0) return d;
      }
      return 0;
    };
    const current = module.exports.config.version;
    const latest = match.version || "N/A";
    const result = { hasUpdate: cmp(latest, current) > 0, currentVersion: current, latestVersion: latest, latestId: match.id };
    _updateCheckCache = { checkedAt: now, result };
    return result;
  } catch (_) { return null; }
}

async function getTodayUpdates() {
  try {
    const [c, e] = await Promise.all([
      axios.get(`${API_BASE}/miraistore/list?limit=50&type=goat-command`),
      axios.get(`${API_BASE}/miraistore/list?limit=50&type=goat-event`)
    ]);
    const today = new Date().toDateString();
    return [...(c.data.commands || []), ...(e.data.commands || [])]
      .filter(cmd => new Date(cmd.uploadDate).toDateString() === today);
  } catch (_) { return []; }
}

async function runAutoSync() {
  const baseDir = process.cwd();
  const folders = [
    { dir: path.join(baseDir, "scripts", "cmds"), kind: "command" },
    { dir: path.join(baseDir, "scripts", "events"), kind: "event" }
  ].filter(f => fs.existsSync(f.dir));

  if (!folders.length) return;

  const cache = loadSyncCache();

  for (const { dir, kind } of folders) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const cacheKey = `${kind}:${file}`;
      let content;
      try { content = fs.readFileSync(fullPath, "utf8"); } catch (_) { continue; }

      const hash = hashContent(content);
      if (cache[cacheKey] === hash) continue;

      try { new Function(content); } catch (_) { continue; }
      if (detectFramework(content) !== "goat") continue;

      // rawUrl MUST be generated first — the server now rejects the upload
      // entirely (error: "rawUrl required") if it's missing. pasteCode()
      // throws if it can't produce a valid non-empty URL, so on failure we
      // skip this file for this sync pass (it'll be retried next sync,
      // since the cache is only updated on a successful upload response).
      let rawUrl;
      try {
        const result = await pasteCode(content);
        rawUrl = result.rawUrl;
      } catch (err) {
        console.error(`[goatstore-sync] Paste failed for ${file}:`, err.response?.data?.error || err.message);
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      try {
        const author = content.match(/author\s*:\s*["'`](.*?)["'`]/)?.[1]
                    || content.match(/credits\s*:\s*["'`](.*?)["'`]/)?.[1]
                    || "Unknown";
        const category = content.match(/category\s*:\s*["'`](.*?)["'`]/)?.[1] || "Uncategorized";
        const res = await axios.post(`${API_BASE}/miraistore/upload`, { rawUrl, rawCode: content, framework: "goat", kind, author, category });
        if (res.data?.error) {
          // Includes the server's "rawUrl required" case if it were ever hit
          // (shouldn't happen given the guard above, but surfaced clearly
          // either way instead of a silent/generic failure).
          console.error(`[goatstore-sync] Paste hoyeche (${rawUrl}) kintu store API error for ${file}:`, res.data.error);
        } else if (res.data?.olderVersion) {
          console.log(`[goatstore-sync] ${file}: older version — stored as separate new entry (ID: ${res.data.id}).`);
          cache[cacheKey] = hash;
        } else if (res.data?.updated) {
          console.log(`[goatstore-sync] ${file}: updated existing entry (ID: ${res.data.id}) to v${res.data.version}.`);
          cache[cacheKey] = hash;
        } else {
          console.log(`[goatstore-sync] ${file}: uploaded as new entry (ID: ${res.data.id}).`);
          cache[cacheKey] = hash;
        }
      } catch (err) {
        console.error(`[goatstore-sync] Paste hoyeche (${rawUrl}) kintu store API call fail for ${file}:`, err.response?.data?.error || err.message);
      }

      await new Promise(r => setTimeout(r, 500));
    }
  }

  saveSyncCache(cache);
}

const buildBar = pct => "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
const frames = ["◖", "◕", "◔", "◓", "◒", "◑", "◐"];

async function animateInstall(api, threadID, name) {
  const steps = [
    { label: "Downloading source",  pct: 30,  delay: 600 },
    { label: "Verifying integrity", pct: 60,  delay: 900 },
    { label: "Writing to disk",     pct: 85,  delay: 700 },
    { label: "Registering command", pct: 100, delay: 600 }
  ];
  const info = await api.sendMessage(`📦 Installing ${name}...\n\n◖ Fetching package info...\n[░░░░░░░░░░] 0%`, threadID);
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, steps[i].delay));
    await api.editMessage(`📦 Installing ${name}...\n\n${frames[i]} ${steps[i].label}...\n[${buildBar(steps[i].pct)}] ${steps[i].pct}%`, info.messageID);
  }
  return info.messageID;
}

async function animateUpload(api, threadID, name) {
  const steps = [
    { label: "Reading file",         pct: 25,  delay: 500 },
    { label: "Uploading to paste",   pct: 55,  delay: 900 },
    { label: "Registering to store", pct: 85,  delay: 700 },
    { label: "Finalizing",           pct: 100, delay: 500 }
  ];
  const info = await api.sendMessage(`📤 Uploading ${name}...\n\n◖ Preparing upload...\n[░░░░░░░░░░] 0%`, threadID);
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, steps[i].delay));
    await api.editMessage(`📤 Uploading ${name}...\n\n${frames[i]} ${steps[i].label}...\n[${buildBar(steps[i].pct)}] ${steps[i].pct}%`, info.messageID);
  }
  return info.messageID;
}

function autoloadCommand(filePath) {
  try {
    delete require.cache[require.resolve(filePath)];
    const cmd = require(filePath);
    if (cmd?.config?.name) {
      const name = cmd.config.name.toLowerCase();
      global.GoatBot.commands.set(name, cmd);
      if (Array.isArray(cmd.config.aliases))
        cmd.config.aliases.forEach(a => global.GoatBot.commands.set(a.toLowerCase(), cmd));
      if (typeof cmd.onLoad === "function") cmd.onLoad({});
      return { success: true, name };
    }
    return { success: false, reason: "Missing config.name." };
  } catch (err) {
    return { success: false, reason: err.message };
  }
}

async function doInstall(api, threadID, id, forceKind = null) {
  let cmdData = null;
  try {
    const res = await axios.get(`${API_BASE}/miraistore/search?q=${encodeURIComponent(id)}`);
    const data = res.data;
    if (!isNaN(id) && data?.rawCode && !Array.isArray(data)) cmdData = data;
    else if (Array.isArray(data?.commands)) cmdData = data.commands.find(c => String(c.id) === String(id));
    if (!cmdData?.rawCode) return api.sendMessage("❌ Command not found or rawCode missing.", threadID);
  } catch (_) { return api.sendMessage("❌ Failed to fetch command info.", threadID); }

  if (!String(cmdData.type || "").startsWith("goat-"))
    return api.sendMessage(
      `❌ This is not a GoatBot file!\n` +
      `├‣ Type : ${cmdData.type || "unknown"}\n` +
      `╰────────────◊\n` +
      `⚠️ Only goat-command and goat-event can be installed here.`,
      threadID
    );

  try { new Function(cmdData.rawCode); }
  catch (err) { return api.sendMessage(`❌ Syntax error in remote code.\n${err.message}`, threadID); }

  const displayName = cmdData.name || `gs_${id}`;
  const isEvent = forceKind === "event" ? true : forceKind === "command" ? false : String(cmdData.type).endsWith("-event");

  let pid;
  try { pid = await animateInstall(api, threadID, displayName); } catch (_) {}

  const fileName = displayName.replace(/\s+/g, "_") + ".js";
  const baseDir = process.cwd();
  const installDir = isEvent ? path.join(baseDir, "scripts", "events") : path.join(baseDir, "scripts", "cmds");
  const filePath = path.join(installDir, fileName);
  const locLabel = isEvent ? `scripts/events/${fileName}` : `scripts/cmds/${fileName}`;

  try {
    if (!fs.existsSync(installDir)) fs.mkdirSync(installDir, { recursive: true });
    fs.writeFileSync(filePath, cmdData.rawCode, "utf-8");
  } catch (err) {
    if (pid) api.unsendMessage(pid);
    return api.sendMessage(`❌ Failed to write file:\n${err.message}`, threadID);
  }

  try { await axios.post(`${API_BASE}/miraistore/install/${cmdData.id}`); } catch (_) {}

  const load = isEvent ? { success: false } : autoloadCommand(filePath);

  const msg =
    `✅ Installed Successfully!\n` +
    `╭─‣ Name : ${cmdData.name || "Unknown"}\n` +
    `├‣ Type : ${cmdData.type || "N/A"}\n` +
    `├‣ Author : ${cmdData.author || "Unknown"}\n` +
    `├‣ Version : ${cmdData.version || "N/A"}\n` +
    `├‣ Category : ${cmdData.category || "N/A"}\n` +
    `├‣ ID : ${id}\n` +
    `├‣ Location : ${locLabel}\n` +
    `╰────────────◊\n` +
    (load.success ? `🚀 "${load.name}" is now live! No restart needed.`
      : isEvent ? `⚠️ Event saved. Restart bot to apply.`
      : `⚠️ Autoload failed: ${load.reason}`);

  if (pid) {
    try { await api.editMessage(msg, pid); setTimeout(() => api.unsendMessage(pid).catch(() => {}), 5000); }
    catch (_) { api.sendMessage(msg, threadID); }
  } else api.sendMessage(msg, threadID);
}

async function sendListPage(api, threadID, senderID, type, page, limit = 10) {
  const offset = (page - 1) * limit;
  try {
    const res = await axios.get(`${API_BASE}/miraistore/list?limit=${limit}&offset=${offset}&type=${type}`);
    const data = res.data;
    if (!Array.isArray(data.commands) || !data.commands.length)
      return api.sendMessage("❌ No results found for this page.", threadID);

    const totalPages = Math.ceil(data.total / limit);
    const label = type === "goat-event" ? "GoatBot Events" : "GoatBot Commands";
    let msg = `📂 ${label} — Page ${page}/${totalPages} (${data.total} total)\n\n`;
    data.commands.forEach(cmd => {
      msg += `╭─‣ ${cmd.name} 〄\n`;
      msg += `├‣ ID : ${cmd.id}\n`;
      msg += `├‣ Author : ${cmd.author}\n`;
      msg += `├‣ Category : ${cmd.category}\n`;
      msg += `╰────────────◊\n`;
      msg += ` ✰ Upload : ${new Date(cmd.uploadDate || Date.now()).toDateString()}\n\n`;
    });
    if (totalPages > 1) msg += `Reply "page <number>" or react to go next page.`;

    const sent = await api.sendMessage(msg.trim(), threadID);
    if (totalPages > 1) {
      const h = { commandName: "goatstore", messageID: sent.messageID, listType: type, page, totalPages, limit, mode: "list", senderID };
      global.GoatBot.onReply.set(sent.messageID, h);
      global.GoatBot.onReaction.set(sent.messageID, h);
    }
  } catch (_) { api.sendMessage("❌ List API error.", threadID); }
}

async function sendSearchPage(api, threadID, senderID, query, page, limit = 5) {
  const offset = (page - 1) * limit;
  try {
    const [cr, er] = await Promise.all([
      axios.get(`${API_BASE}/miraistore/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&type=goat-command`),
      axios.get(`${API_BASE}/miraistore/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&type=goat-event`)
    ]);
    const all = [...(cr.data.commands || []), ...(er.data.commands || [])];
    const total = (cr.data.total || 0) + (er.data.total || 0);
    if (!all.length) return api.sendMessage(`❌ No GoatBot results found for "${query}".`, threadID);

    const totalPages = Math.max(1, Math.ceil(total / (limit * 2)));
    let msg = `🔍 Search: "${query}" (${total} found)\n\n`;
    all.forEach(cmd => {
      msg += `╭─‣ ${cmd.name} 〄\n`;
      msg += `├‣ ID : ${cmd.id}\n`;
      msg += `├‣ Type : ${cmd.type === "goat-event" ? "🎯 Event" : "⚡ Command"}\n`;
      msg += `├‣ Author : ${cmd.author}\n`;
      msg += `├‣ Category : ${cmd.category}\n`;
      msg += `╰────────────◊\n`;
      msg += ` ✰ Upload : ${new Date(cmd.uploadDate || Date.now()).toDateString()}\n\n`;
    });
    if (totalPages > 1) msg += `Page ${page}/${totalPages}\nReact to go next page.`;

    const sent = await api.sendMessage(msg.trim(), threadID);
    if (totalPages > 1) {
      const h = { commandName: "goatstore", messageID: sent.messageID, query, page, totalPages, limit, mode: "search", senderID };
      global.GoatBot.onReply.set(sent.messageID, h);
      global.GoatBot.onReaction.set(sent.messageID, h);
    }
  } catch (_) { api.sendMessage("❌ Search API error.", threadID); }
}

async function uploadFile(api, threadID, filePath, kind) {
  let data;
  try { data = fs.readFileSync(filePath, "utf8"); }
  catch (err) { return api.sendMessage(`❌ Read failed:\n${err.message}`, threadID); }

  try { new Function(data); }
  catch (err) { return api.sendMessage(`❌ Syntax Error:\n${err.message}`, threadID); }

  const displayName = data.match(/name\s*:\s*["'`](.*?)["'`]/)?.[1] || path.basename(filePath);
  if (detectFramework(data) !== "goat")
    return api.sendMessage(`❌ Only GoatBot files can be uploaded here.`, threadID);

  let pid;
  try { pid = await animateUpload(api, threadID, displayName); } catch (_) {}

  // rawUrl MUST be generated and confirmed valid BEFORE calling
  // /miraistore/upload — the server now hard-requires it and returns
  // { error: "rawUrl required" } otherwise. pasteCode() throws on any
  // failure (paste API error OR empty/invalid URL), so this whole block
  // aborts cleanly (with a clear message) before ever reaching the store call.
  let rawUrl;
  try {
    const result = await pasteCode(data);
    rawUrl = result.rawUrl;
  } catch (err) {
    if (pid) api.unsendMessage(pid);
    return api.sendMessage(
      `❌ Paste Upload Failed!\n` +
      `╭─‣ Step : Code -> Pastebin\n` +
      `├‣ Error : ${err.response?.data?.error || err.message}\n` +
      `╰────────────◊\n` +
      `💡 Eta bot side er problem — pastebin e code ta e upload hoyni, tai rawUrl toiri hoyni.`,
      threadID
    );
  }

  try {
    const res = await axios.post(`${API_BASE}/miraistore/upload`, { rawUrl, rawCode: data, framework: "goat", kind });

    // "Already exists" (same name+author+type+version) and protected-name
    // blocks come back as res.data.error — but they aren't really paste/API
    // failures, so give them their own clear message instead of the generic
    // "Store API Error" wording below.
    if (res.data?.error === "Already exists" || res.data?.error === "Not allowed") {
      if (pid) api.unsendMessage(pid);
      return api.sendMessage(
        `⚠️ ${res.data.error === "Not allowed" ? "Upload Blocked!" : "Already Exists in Store!"}\n` +
        `╭─‣ Name : ${displayName}\n` +
        (res.data.id ? `├‣ ID : ${res.data.id}\n` : "") +
        `╰────────────◊\n` +
        `💡 ${res.data.message}`,
        threadID
      );
    }

    // Server hard-requires rawUrl now — give this its own clear message too
    // instead of falling through to the generic "Store API Error" wording,
    // since this specific case means the payload itself was incomplete.
    if (res.data?.error === "rawUrl required") {
      if (pid) api.unsendMessage(pid);
      return api.sendMessage(
        `⚠️ rawUrl Missing!\n` +
        `╭─‣ Name : ${displayName}\n` +
        `╰────────────◊\n` +
        `💡 Store API ke rawUrl pathano hoyni. Eta bot side er bug — report koro.`,
        threadID
      );
    }

    if (res.data?.error) {
      if (pid) api.unsendMessage(pid);
      return api.sendMessage(
        `⚠️ Paste Hoyeche, Kintu Store API Error!\n` +
        `╭─‣ Paste Link : ${rawUrl}\n` +
        `├‣ Error : ${res.data.error}\n` +
        `╰────────────◊\n` +
        `💡 Code ta pastebin e successfully upload hoyeche (link kaj korbe), kintu MiraiStore backend register korte parenai. Backend/API side check koro.`,
        threadID
      );
    }

    const author  = data.match(/author\s*:\s*["'`](.*?)["'`]/)?.[1]
                 || data.match(/credits\s*:\s*["'`](.*?)["'`]/)?.[1]
                 || "Unknown";
    const version = data.match(/version\s*:\s*["'`](.*?)["'`]/)?.[1] || "N/A";
    const category = data.match(/category\s*:\s*["'`](.*?)["'`]/)?.[1] || "Uncategorized";

    // Distinguish: brand new entry vs overwritten (newer version) entry vs
    // stored-separately (older version) entry — each gets its own header
    // and surfaces the server's message so the user knows exactly what happened.
    let header = "✅ Upload Successful!";
    let note = "";
    if (res.data.olderVersion) {
      header = "⚠️ Older Version — Stored As New Entry!";
      note = `💡 ${res.data.message}\n`;
    } else if (r