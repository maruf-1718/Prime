exports.config = {
  name: "fork",
  version: "1.0.0",
  author: "Mohammad Maruf",
  countDown: 0,
  role: 0,
  shortDescription: "Fork Link",
  longDescription: "Responds with GitHub repo link when 'fork' or 'repository' is mentioned. Cooldown: 10 seconds.",
  category: "system",
  guide: {
    en: "Type 'fork' or 'repository'"
  }
};

const last = {};
const cool = 10000;

exports.onStart = async function(){};

exports.onChat = async function({event: z, api: y}){
  const t = z.threadID;
  const n = Date.now();
  if(last[t] && n - last[t] < cool) return;
  const m = (z.body || "").toLowerCase().trim();
  if(!m) return;
  const fork = m.includes("fork") || m.includes("repository");
  if(fork){
    y.sendMessage("╭━━━━━━━━━━━━━━━━━━━━━╮
┃ 🤖 𝐁𝐨𝐭 : 𝐌𝐚𝐫𝐮𝐟'𝐬 𝐁𝐨𝐭
┃ 🔐 𝐅𝐨𝐫𝐤   : 𝐏𝐫𝐢𝐯𝐚𝐭𝐞
┃ 👑 𝐎𝐰𝐧𝐞𝐫 : 𝐌𝐨𝐡𝐚𝐦𝐦𝐚𝐝 𝐌𝐚𝐫𝐮𝐟
╰━━━━━━━━━━━━━━━━━━━━━╯", t, z.messageID);
    last[t] = n;
  }
};
