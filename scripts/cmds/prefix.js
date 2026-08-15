const fs = require("fs-extra");
const { utils } = global;
const axios = require("axios");
const path = require("path");

module.exports = {
    config: {
        name: "prefix",
        version: "1.0.0",
        author: "Mohammad Maruf",
        countDown: 5,
        role: 0,

        description: {
            en: "Show and change the bot prefix."
        },

        category: "config",

        guide: {
            en:
                "{pn}\n" +
                "{pn} <new prefix>\n" +
                "Example: {pn} .\n\n" +
                "{pn} <new prefix> -g\n" +
                "Example: {pn} . -g\n\n" +
                "{pn} reset\n\n" +
                "Type 'prefix' to view current prefix information."
        }
    },

    langs: {
        en: {
            reset:
                "✅ 𝗣𝗿𝗲𝗳𝗶𝘅 𝗥𝗲𝘀𝗲𝘁\n\n" +
                "🎟️ 𝗚𝗿𝗼𝘂𝗽 : %1\n" +
                "🔹 𝗡𝗲𝘄 𝗣𝗿𝗲𝗳𝗶𝘅 : %2",

            onlyAdmin:
                "❌ 𝗔𝗰𝗰𝗲𝘀𝘀 𝗗𝗲𝗻𝗶𝗲𝗱\n\n" +
                "🎛️ Only bot administrators can change the system prefix.",

            confirmGlobal:
                "⚠️ 𝗚𝗹𝗼𝗯𝗮𝗹 𝗣𝗿𝗲𝗳𝗶𝘅 𝗖𝗵𝗮𝗻𝗴𝗲\n\n" +
                "📡 𝗢𝗹𝗱 𝗣𝗿𝗲𝗳𝗶𝘅 : %1\n" +
                "🔹 𝗡𝗲𝘄 𝗣𝗿𝗲𝗳𝗶𝘅 : %2\n\n" +
                "💎 React to this message to confirm.",

            confirmThisThread:
                "⚠️ 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅 𝗖𝗵𝗮𝗻𝗴𝗲\n\n" +
                "🎟️ 𝗚𝗿𝗼𝘂𝗽 : %1\n" +
                "🔹 𝗡𝗲𝘄 𝗣𝗿𝗲𝗳𝗶𝘅 : %2\n\n" +
                "💎 React to this message to confirm.",

            successGlobal:
                "✅ 𝗦𝘆𝘀𝘁𝗲𝗺 𝗣𝗿𝗲𝗳𝗶𝘅 𝗨𝗽𝗱𝗮𝘁𝗲𝗱\n\n" +
                "📡 𝗡𝗲𝘄 𝗣𝗿𝗲𝗳𝗶𝘅 : %1",

            successThisThread:
                "✅ 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅 𝗨𝗽𝗱𝗮𝘁𝗲𝗱\n\n" +
                "🎟️ 𝗚𝗿𝗼𝘂𝗽 : %1\n" +
                "🔹 𝗡𝗲𝘄 𝗣𝗿𝗲𝗳𝗶𝘅 : %2"
        }
    },

    /* =========================================
       COMMAND HANDLER
    ========================================= */

    onStart: async function ({
        message,
        role,
        args,
        commandName,
        event,
        threadsData,
        getLang
    }) {

        /*
         * /prefix
         *
         * No argument = Prefix Info
         */

        if (!args[0]) {
            return sendPrefixInfo({
                message,
                event
            });
        }

        /* =====================================
           RESET
        ===================================== */

        if (
            args[0].toLowerCase() === "reset"
        ) {

            await threadsData.set(
                event.threadID,
                null,
                "data.prefix"
            );

            let groupName = "This Group";

            try {
                groupName =
                    await getThreadName(
                        event.threadID
                    );
            } catch (_) {}

            return message.reply(
                getLang(
                    "reset",
                    groupName,
                    global.GoatBot.config.prefix
                )
            );
        }

        /* =====================================
           NEW PREFIX
        ===================================== */

        const newPrefix = args[0];

        const formSet = {
            commandName,
            author: event.senderID,
            newPrefix,
            messageID: null,
            setGlobal: false
        };

        /* =====================================
           GLOBAL PREFIX
        ===================================== */

        if (
            args[1] &&
            args[1].toLowerCase() === "-g"
        ) {

            if (role < 2) {
                return message.reply(
                    getLang("onlyAdmin")
                );
            }

            formSet.setGlobal = true;

            return message.reply(
                getLang(
                    "confirmGlobal",
                    global.GoatBot.config.prefix,
                    newPrefix
                ),
                (err, info) => {

                    if (err || !info)
                        return;

                    formSet.messageID =
                        info.messageID;

                    global.GoatBot.onReaction.set(
                        info.messageID,
                        formSet
                    );
                }
            );
        }

        /* =====================================
           GROUP PREFIX
        ===================================== */

        let groupName = "This Group";

        try {
            groupName =
                await getThreadName(
                    event.threadID
                );
        } catch (_) {}

        return message.reply(
            getLang(
                "confirmThisThread",
                groupName,
                newPrefix
            ),
            (err, info) => {

                if (err || !info)
                    return;

                formSet.messageID =
                    info.messageID;

                global.GoatBot.onReaction.set(
                    info.messageID,
                    formSet
                );
            }
        );
    },

    /* =========================================
       REACTION CONFIRMATION
    ========================================= */

    onReaction: async function ({
        message,
        threadsData,
        event,
        Reaction,
        getLang
    }) {

        if (!Reaction)
            return;

        const {
            author,
            newPrefix,
            setGlobal
        } = Reaction;

        /* Only original user can confirm */

        if (
            event.userID !== author
        ) {
            return;
        }

        /* =====================================
           GLOBAL PREFIX
        ===================================== */

        if (setGlobal) {

            global.GoatBot.config.prefix =
                newPrefix;

            try {

                fs.writeFileSync(
                    global.client.dirConfig,
                    JSON.stringify(
                        global.GoatBot.config,
                        null,
                        2
                    )
                );

            } catch (err) {

                console.error(
                    "Failed to save global prefix:",
                    err
                );
            }

            return message.reply(
                getLang(
                    "successGlobal",
                    newPrefix
                )
            );
        }

        /* =====================================
           GROUP PREFIX
        ===================================== */

        await threadsData.set(
            event.threadID,
            newPrefix,
            "data.prefix"
        );

        let groupName = "This Group";

        try {

            groupName =
                await getThreadName(
                    event.threadID
                );

        } catch (_) {}

        return message.reply(
            getLang(
                "successThisThread",
                groupName,
                newPrefix
            )
        );
    },

    /* =========================================
       PLAIN "prefix" HANDLER
       
       IMPORTANT:
       This handles only:
       
       prefix
       
       It does NOT handle:
       
       /prefix
       
       Therefore duplicate response হবে না।
    ========================================= */

    onChat: async function ({
        event,
        message
    }) {

        if (!event.body)
            return;

        const text =
            event.body.trim().toLowerCase();

        /*
         * Only exact "prefix"
         */

        if (text !== "prefix")
            return;

        /*
         * Small guard.
         *
         * If this message has already been
         * processed as a command, don't reply.
         */

        if (
            event.messageReply ||
            event.attachments?.length
        ) {
            return;
        }

        return sendPrefixInfo({
            message,
            event
        });
    }
};


/* =========================================
   PREFIX INFO FUNCTION
========================================= */

async function sendPrefixInfo({
    message,
    event
}) {

    try {

        let groupName = "This Group";

        try {

            groupName =
                await getThreadName(
                    event.threadID
                );

        } catch (_) {}

        const systemPrefix =
            global.GoatBot.config.prefix;

        const groupPrefix =
            utils.getPrefix(
                event.threadID
            );

        const type =
            groupPrefix === systemPrefix
                ? "Default"
                : "Custom";

        /* Bangladesh Time */

        const time =
            new Date().toLocaleTimeString(
                "en-US",
                {
                    timeZone: "Asia/Dhaka",
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );

        const msg =
`🛠️ 𝗣𝗥𝗘𝗙𝗜𝗫 𝗜𝗡𝗙𝗢

🎟️ 𝗚𝗿𝗼𝘂𝗽       : ${groupName}
📡 𝗦𝘆𝘀𝘁𝗲𝗺      : ${systemPrefix}
🔹 𝗧𝗵𝗶𝘀 𝗚𝗿𝗼𝘂𝗽 : ${groupPrefix}
🎛️ 𝗧𝘆𝗽𝗲       : ${type}
⏱️ 𝗧𝗶𝗺𝗲        : ${time}

💎 𝗧𝘆𝗽𝗲
➤ ${groupPrefix}help`;

        /* =====================================
           IMAGE
        ===================================== */

        const imageURL =
            "https://i.ibb.co/LXxrL0Xz/c40358933642.jpg";

        const cacheDir =
            path.join(
                __dirname,
                "cache"
            );

        await fs.ensureDir(
            cacheDir
        );

        const imagePath =
            path.join(
                cacheDir,
                `prefix_${Date.now()}.jpg`
            );

        try {

            const response =
                await axios.get(
                    imageURL,
                    {
                        responseType:
                            "arraybuffer",
                        timeout: 15000
                    }
                );

            await fs.writeFile(
                imagePath,
                response.data
            );

            await message.reply({
                body: msg,
                attachment:
                    fs.createReadStream(
                        imagePath
                    )
            });

            /* Delete cached image */

            setTimeout(() => {

                try {

                    if (
                        fs.existsSync(
                            imagePath
                        )
                    ) {
                        fs.unlinkSync(
                            imagePath
                        );
                    }

                } catch (_) {}

            }, 15000);

        } catch (imageError) {

            console.error(
                "PREFIX IMAGE ERROR:",
                imageError.message
            );

            return message.reply(
                msg
            );
        }

    } catch (error) {

        console.error(
            "PREFIX INFO ERROR:",
            error
        );

        const currentPrefix =
            global.GoatBot.config.prefix;

        let groupPrefix = currentPrefix;

        try {

            groupPrefix =
                utils.getPrefix(
                    event.threadID
                );

        } catch (_) {}

        return message.reply(
`🛠️ 𝗣𝗥𝗘𝗙𝗜𝗫 𝗜𝗡𝗙𝗢

📡 𝗦𝘆𝘀𝘁𝗲𝗺      : ${currentPrefix}
🔹 𝗧𝗵𝗶𝘀 𝗚𝗿𝗼𝘂𝗽 : ${groupPrefix}
🎛️ 𝗧𝘆𝗽𝗲       : ${
    groupPrefix === currentPrefix
        ? "Default"
        : "Custom"
}

💎 𝗧𝘆𝗽𝗲
➤ ${groupPrefix}help`
        );
    }
}


/* =========================================
   GET GROUP NAME
========================================= */

async function getThreadName(
    threadID
) {

    try {

        const threadInfo =
            await global.GoatBot.fcaApi.getThreadInfo(
                threadID
            );

        return (
            threadInfo?.name ||
            "This Group"
        );

    } catch (_) {

        return "This Group";
    }
}