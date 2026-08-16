const fs = require("fs");
const path = require("path");
const axios = require("axios");

const API_BASE = "https://store-xdi.vercel.app";
const userSeenNoti = new Map();
const AUTOSYNC_CACHE_PATH = path.join(process.cwd(), "goatstore_sync_cache.json");
const DIR_CACHE_PATH = path.join(process.cwd(), "goatstore_dircache.json");

let _updateCheckCache = null;
const UPDATE_CHECK_INTERVAL = 1000 * 60 * 30;

// --- Pagination edit-limit ------------------------------------------------
const MAX_EDITS_PER_MESSAGE = 5;

// --- Prefix detection ---------------------------------------------------
function getPrefix(threadData) {
  try {
    if (threadData?.data?.prefix) return threadData.data.prefix;
    if (global.GoatBot?.config?.prefix) return global.GoatBot.config.prefix;
  } catch (_) {}
  return "!";
}

function loadSyncCache() {
  try { return JSON.parse(fs.readFileSync(AUTOSYNC_CACHE_PATH, "utf8")); }
  catch { return {}; }
}

function saveSyncCache(cache) {
  try { fs.writeFileSync(AUTOSYNC_CACHE_PATH, JSON.stringify(cache, null, 2)); }
  catch (_) {}
}

// --- Autoupdate: always on, fully silent in the background ---------------
let _autoupdateInFlight = false;

function hashContent(content) {
  let h = 0;
  for (let i = 0; i < content.length; i++) h = (h * 31 + content.charCodeAt(i)) | 0;
  return h.toString(16);
}

// --- Shared version comparison -------------------------------------------
function parseVer(v) {
  return String(v).split(".").map(n => parseInt(n) || 0);
}

function cmpVer(a, b) {
  const pa = parseVer(a), pb = parseVer(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function detectFramework(code) {
  const hasAuthorRole = /\bauthor\s*:/.test(code) && /\brole\s*:/.test(code);
  const hasCreditsPermission = /\bcredits\s*:/.test(code) && /\bhasPermission\s*[:(]/.test(code);

  if (hasAuthorRole && !hasCreditsPermission) return "goat";
  if (hasCreditsPermission && !hasAuthorRole) return "mirai";

  const isGoatStructure =
    /module\.exports\s*=\s*\{/.test(code) &&
    /onStart\s*[:(]|onChat\s*[:(]|onLoad\s*[:(]/.test(code);
  const isMiraiStructure =
    /module\.exports\.config\s*=/.test(code) ||
    /module\.exports\.run\s*=/.test(code);

  return (isGoatStructure && !isMiraiStructure) ? "goat" : "mirai";
}

// --- Auto-detect commands/events folders -----------------------------
// goatstore.js itself is a command file, so it always lives INSIDE the
// real commands folder alongside every other command — no need to guess
// paths from cwd for that. __dirname IS the commands dir.
// For the events dir, we look for a sibling folder (same parent as cmds)
// whose name matches known event-folder patterns, since bots almost always
// keep cmds/events side by side.
const EVENTS_NAME_PATTERNS = ["events", "event"];
const SCAN_SKIP_DIRS = new Set(["node_modules", ".git", ".cache", ".github", "dist", "build"]);

function loadDirCache() {
  try { return JSON.parse(fs.readFileSync(DIR_CACHE_PATH, "utf8")); }
  catch { return {}; }
}

function saveDirCache(cache) {
  try { fs.writeFileSync(DIR_CACHE_PATH, JSON.stringify(cache, null, 2)); }
  catch (_) {}
}

let _dirCache = loadDirCache();

// Bounded breadth-first scan for a folder whose name matches one of the
// given patterns, starting from `startDir` (used to find the events folder
// as a sibling/nearby folder relative to where goatstore.js itself lives).
function scanForDir(startDir, namePatterns, maxDepth = 2) {
  const queue = [{ dir: startDir, depth: 0 }];
  while (queue.length) {
    const { dir, depth } = queue.shift();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { continue; }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (SCAN_SKIP_DIRS.has(ent.name)) continue;
      if (ent.name.startsWith(".")) continue;
      const lower = ent.name.toLowerCase();
      const full = path.join(dir, ent.name);
      if (namePatterns.includes(lower)) return full;
      if (depth < maxDepth) queue.push({ dir: full, depth: depth + 1 });
    }
  }
  return null;
}

function getCmdsDir(forceRescan = false) {
  if (!forceRescan && _dirCache.cmdsDir && fs.existsSync(_dirCache.cmdsDir)) return _dirCache.cmdsDir;
  // goatstore.js's own folder — it's a command file sitting right next to
  // every other command, so this is always correct without guessing.
  const dir = __dirname;
  _dirCache.cmdsDir = dir;
  saveDirCache(_dirCache);
  return dir;
}

function getEventsDir(forceRescan = false) {
  if (!forceRescan && _dirCache.eventsDir && fs.existsSync(_dirCache.eventsDir)) return _dirCache.eventsDir;
  const cmdsDir = getCmdsDir(forceRescan);
  const parent = path.dirname(cmdsDir);
  // Look for a sibling folder named events/event next to the cmds folder,
  // then fall back to scanning a couple levels up/around if not found.
  const dir =
    scanForDir(parent, EVENTS_NAME_PATTERNS, 2) ||
    path.join(parent, "events");
  _dirCache.eventsDir = dir;
  saveDirCache(_dirCache);
  return dir;
}

async function checkSelfUpdate() {
  const now = Date.now();
  if (_updateCheckCache && (now - _updateCheckCache.checkedAt) < UPDATE_CHECK_INTERVAL)
    return _updateCheckCache.result;
  try {
    const res = await axios.get(`${API_BASE}/miraistore/search?q=goatstore&limit=10&framework=goat&kind=command`);
    const cmds = Array.isArray(res.data?.commands) ? res.data.commands : [];
    const match =
      cmds.find(c => c.name?.toLowerCase() === "goatstore" && c.author === module.exports.config.author) ||
      cmds.find(c => c.name?.toLowerCase() === "goatstore");
    if (!match) { _updateCheckCache = { checkedAt: now, result: null }; return null; }
    const current = module.exports.config.version;
    const latest = match.version || "N/A";
    const result = {
      hasUpdate: cmpVer(latest, current) > 0,
      currentVersion: current,
      latestVersion: latest,
      latestId: match.id,
      description: match.description || match.changelog || ""
    };
    _updateCheckCache = { checkedAt: now, result };
    return result;
  } catch (_) { return null; }
}

async function getTodayUpdates() {
  try {
    const res = await axios.get(`${API_BASE}/miraistore/list?limit=50&framework=goat`);
    const today = new Date().toDateString();
    return (res.data.commands || [])
      .filter(cmd => new Date(cmd.uploadDate).toDateString() === today);
  } catch (_) { return []; }
}

async function runAutoSync() {
  const folders = [
    { dir: getCmdsDir(), kind: "command" },
    { dir: getEventsDir(), kind: "event" }
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
      if (cache[cacheKey]?.hash === hash) continue;

      try { new Function(content); } catch (_) { continue; }
      if (detectFramework(content) !== "goat") continue;

      try {
        const author = content.match(/author\s*:\s*["'`](.*?)["'`]/)?.[1]
                    || content.match(/credits\s*:\s*["'`](.*?)["'`]/)?.[1]
                    || "Unknown";
        const category = content.match(/category\s*:\s*["'`](.*?)["'`]/)?.[1] || "Uncategorized";
        const res = await axios.post(`${API_BASE}/miraistore/upload`, { rawCode: content, framework: "goat", kind, author, category });
        if (res.data?.error) {
          console.error(`[goatstore-sync] Upload skipped for ${file}: ${res.data.message || res.data.error}`);
        } else if (res.data?.updated) {
          console.log(`[goatstore-sync] ${file}: updated existing entry (ID: ${res.data.id}) to v${res.data.version}.`);
          cache[cacheKey] = { hash, id: res.data.id, secret: res.data.secret || cache[cacheKey]?.secret || null };
        } else {
          console.log(`[goatstore-sync] ${file}: uploaded as new entry (ID: ${res.data.id}).`);
          cache[cacheKey] = { hash, id: res.data.id, secret: res.data.secret || null };
        }
      } catch (err) {
        console.error(`[goatstore-sync] Upload request fail for ${file}:`, err.response?.data?.error || err.message);
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
    { label: "Reading file",         pct: 30,  delay: 500 },
    { label: "Uploading directly",   pct: 70,  delay: 900 },
    { label: "Finalizing registration", pct: 100, delay: 500 }
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

// Framework badge shown across listings/install/search results. For
// "other" the backend resolves a live sub-type label per code shape
// (e.g. "Other Type A") — falls back to a generic "Other" if absent.
function typeBadge(cmd) {
  const fw =
    cmd.framework === "mirai" ? "🌌 Mirai"
    : cmd.framework === "other" ? `📦 ${cmd.otherType || "Other"}`
    : "🐐 Goat";
  const kd = cmd.kind === "event" ? " Event" : cmd.kind === "command" ? " Command" : "";
  return fw + kd;
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

  if (cmdData.framework !== "goat")
    return api.sendMessage(
      `❌ This is not a GoatBot file!\n` +
      `├‣ Category : ${cmdData.framework || "unknown"}\n` +
      `╰────────────◊\n` +
      `⚠️ Only goat-framework commands/events can be installed here.`,
      threadID
    );

  try { new Function(cmdData.rawCode); }
  catch (err) { return api.sendMessage(`❌ Syntax error in remote code.\n${err.message}`, threadID); }

  const displayName = cmdData.name || `gs_${id}`;
  const isEvent = forceKind === "event" ? true : forceKind === "command" ? false : cmdData.kind === "event";

  let pid;
  try { pid = await animateInstall(api, threadID, displayName); } catch (_) {}

  const fileName = displayName.replace(/\s+/g, "_") + ".js";
  const baseDir = process.cwd();
  const installDir = isEvent ? getEventsDir() : getCmdsDir();
  const filePath = path.join(installDir, fileName);
  const locLabel = path.relative(baseDir, filePath);

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
    `├‣ Type : ${typeBadge(cmdData)}\n` +
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

async function doSelfUpdateSilent(api, threadID, selfUpdate) {
  let cmdData = null;
  try {
    const res = await axios.get(`${API_BASE}/miraistore/search?q=${encodeURIComponent(selfUpdate.latestId)}`);
    const data = res.data;
    if (!isNaN(selfUpdate.latestId) && data?.rawCode && !Array.isArray(data)) cmdData = data;
    else if (Array.isArray(data?.commands)) cmdData = data.commands.find(c => String(c.id) === String(selfUpdate.latestId));
    if (!cmdData?.rawCode) return false;
  } catch (_) { return false; }

  try { new Function(cmdData.rawCode); }
  catch (_) { return false; }

  try {
    fs.writeFileSync(__filename, cmdData.rawCode, "utf-8");
  } catch (_) { return false; }

  try { await axios.post(`${API_BASE}/miraistore/install/${cmdData.id}`); } catch (_) {}

  const changelog = (cmdData.description || cmdData.changelog || "No changelog provided.").trim();
  const load = autoloadCommand(__filename);

  if (api && threadID) {
    const msg =
      `♻️ Auto-Updated GoatStore!\n` +
      `╭─‣ Version : v${cmdData.version || selfUpdate.latestVersion}\n` +
      `├‣ ID : ${cmdData.id}\n` +
      `╰────────────◊\n` +
      `📝 Changelog:\n${changelog}\n\n` +
      (load.success ? `🚀 Live now! No restart needed.` : `⚠️ Reload failed (${load.reason}) — restart bot to apply.`);
    api.sendMessage(msg, threadID).catch(() => {});
  }
  return true;
}

async function maybeAutoUpdate(api, threadID) {
  if (_autoupdateInFlight) return;
  const selfUpdate = await checkSelfUpdate();
  if (!selfUpdate?.hasUpdate) return;
  _autoupdateInFlight = true;
  try {
    await doSelfUpdateSilent(api, threadID, selfUpdate);
  } finally {
    _autoupdateInFlight = false;
  }
}

async function sendListPage(api, threadID, senderID, kind, page, limit = 10, prefix = "!") {
  const offset = (page - 1) * limit;
  try {
    const res = await axios.get(`${API_BASE}/miraistore/list?limit=${limit}&offset=${offset}&framework=goat&kind=${kind}`);
    const data = res.data;
    if (!Array.isArray(data.commands) || !data.commands.length)
      return api.sendMessage("❌ No results found for this page.", threadID);

    const totalPages = Math.ceil(data.total / limit);
    const label = kind === "event" ? "GoatBot Events" : "GoatBot Commands";
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

    const finalMsg = msg.trim();
    const sent = await api.sendMessage(finalMsg, threadID);
    if (totalPages > 1) {
      const h = { commandName: "goatstore", messageID: sent.messageID, listType: kind, page, totalPages, limit, mode: "list", senderID, editCount: 0 };
      global.GoatBot.onReply.set(sent.messageID, h);
      global.GoatBot.onReaction.set(sent.messageID, h);
    }
  } catch (_) { api.sendMessage("❌ List API error.", threadID); }
}

// Universal search — no framework filter unless filterOpts.framework is
// given, and can search by author instead of name via filterOpts.author.
// Results come back from the backend already grouped goat → mirai → other,
// most recent first within each group.
async function sendSearchPage(api, threadID, senderID, query, page, limit = 5, prefix = "!", filterOpts = {}) {
  const offset = (page - 1) * limit;
  try {
    let url = `${API_BASE}/miraistore/search?limit=${limit}&offset=${offset}`;
    if (filterOpts.author) url += `&author=${encodeURIComponent(filterOpts.author)}`;
    else url += `&q=${encodeURIComponent(query || "")}`;
    if (filterOpts.framework) url += `&framework=${filterOpts.framework}`;

    const res = await axios.get(url);
    const data = res.data;
    if (!Array.isArray(data.commands) || !data.commands.length)
      return api.sendMessage(`❌ No results found${query ? ` for "${query}"` : ""}.`, threadID);

    const total = data.total || data.commands.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const title = filterOpts.author
      ? `👤 Author: ${filterOpts.author}`
      : (filterOpts.framework && !query ? `📂 Category: ${filterOpts.framework}` : `🔍 Search: "${query}"`);

    let msg = `${title} (${total} found)\n\n`;
    data.commands.forEach(cmd => {
      msg += `╭─‣ ${cmd.name} 〄\n`;
      msg += `├‣ ID : ${cmd.id}\n`;
      msg += `├‣ Type : ${typeBadge(cmd)}\n`;
      msg += `├‣ Author : ${cmd.author}\n`;
      msg += `├‣ Category : ${cmd.category}\n`;
      msg += `╰────────────◊\n`;
      msg += ` ✰ Upload : ${new Date(cmd.uploadDate || Date.now()).toDateString()}\n\n`;
    });
    if (totalPages > 1) msg += `Page ${page}/${totalPages}\nReply "page <number>" or react to go next page.\n`;
    msg += `💬 Reply "delete <id> <secret>" to remove one of your uploads.`;

    const finalMsg = msg.trim();
    const sent = await api.sendMessage(finalMsg, threadID);
    const h = {
      commandName: "goatstore", messageID: sent.messageID, query,
      authorQuery: filterOpts.author || null, framework: filterOpts.framework || null,
      page, totalPages, limit, mode: "search", senderID, editCount: 0
    };
    global.GoatBot.onReply.set(sent.messageID, h);
    if (totalPages > 1) global.GoatBot.onReaction.set(sent.messageID, h);
  } catch (_) { api.sendMessage("❌ Search API error.", threadID); }
}

async function renderListPageInto(messageID, kind, page, limit) {
  const offset = (page - 1) * limit;
  const res = await axios.get(`${API_BASE}/miraistore/list?limit=${limit}&offset=${offset}&framework=goat&kind=${kind}`);
  const data = res.data;
  if (!Array.isArray(data.commands) || !data.commands.length) return null;

  const totalPages = Math.ce