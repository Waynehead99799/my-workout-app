#!/usr/bin/env node
/**
 * Telegram bot — controls Claude Code from your phone.
 * Run: node scripts/telegram-bot.js
 *
 * Commands you can send from Telegram:
 *   Any text  → runs: claude --print "your message" in project dir
 *   /status   → replies with current working directory + git status
 *   /stop     → gracefully kills any running claude process
 */

const https = require("https");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Load .env
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
    });
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ID;
const PROJECT_DIR = path.join(__dirname, "..");

if (!TOKEN || !CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
  process.exit(1);
}

console.log(`Using CHAT_ID: ${CHAT_ID}`);

let offset = 0;
let currentProcess = null;

function apiCall(method, params = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(params);
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${TOKEN}/${method}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sendMessage(text) {
  return apiCall("sendMessage", {
    chat_id: CHAT_ID,
    text: text.slice(0, 4096), // Telegram message limit
    parse_mode: "Markdown",
  });
}

function runClaude(prompt) {
  if (currentProcess) {
    sendMessage("⚠️ Already running a task. Send /stop to cancel it first.");
    return;
  }

  sendMessage(`🚀 *Starting task...*\n\`${prompt.slice(0, 200)}\``);

  const proc = spawn(
    "claude",
    ["--print", "--dangerously-skip-permissions", prompt],
    {
      cwd: PROJECT_DIR,
      shell: true,
      env: process.env,
    }
  );

  currentProcess = proc;
  let output = "";
  let chunkBuffer = "";

  const flushChunk = () => {
    if (chunkBuffer.trim()) {
      sendMessage(`📝 ${chunkBuffer.trim()}`);
      chunkBuffer = "";
    }
  };

  proc.stdout.on("data", (data) => {
    const text = data.toString();
    output += text;
    chunkBuffer += text;
    // Send updates every ~800 chars to avoid spam
    if (chunkBuffer.length > 800) {
      flushChunk();
    }
  });

  proc.stderr.on("data", (data) => {
    // Suppress noise, only send actual errors
    const err = data.toString();
    if (err.includes("Error") || err.includes("error")) {
      sendMessage(`⚠️ ${err.trim()}`);
    }
  });

  proc.on("close", (code) => {
    currentProcess = null;
    flushChunk();
    if (code === 0) {
      sendMessage(`✅ *Task complete!*`);
    } else {
      sendMessage(`❌ *Task failed* (exit code ${code})`);
    }
  });

  proc.on("error", (err) => {
    currentProcess = null;
    sendMessage(`❌ Failed to start Claude: ${err.message}`);
  });
}

async function getUpdates() {
  try {
    const result = await apiCall("getUpdates", {
      offset,
      timeout: 30,
      allowed_updates: ["message"],
    });

    if (!result.ok) return;

    for (const update of result.result) {
      offset = update.update_id + 1;
      const msg = update.message;
      if (!msg || !msg.text) continue;

      // Only respond to your chat ID (security)
      if (String(msg.chat.id) !== String(CHAT_ID)) {
        console.log(`Ignored message from unknown chat: ${msg.chat.id}`);
        continue;
      }

      const text = msg.text.trim();

      if (text === "/stop") {
        if (currentProcess) {
          currentProcess.kill();
          currentProcess = null;
          sendMessage("🛑 Task stopped.");
        } else {
          sendMessage("Nothing is running.");
        }
      } else if (text === "/status") {
        const { execSync } = require("child_process");
        try {
          const branch = execSync("git branch --show-current", { cwd: PROJECT_DIR }).toString().trim();
          const status = execSync("git status --short", { cwd: PROJECT_DIR }).toString().trim() || "clean";
          sendMessage(`📊 *Status*\nBranch: \`${branch}\`\nFiles: \`${status}\`\nRunning: ${currentProcess ? "yes" : "no"}`);
        } catch {
          sendMessage("Could not get git status.");
        }
      } else if (text === "/help") {
        sendMessage(
          `*Claude Bot Commands*\n\nSend any message → runs it as a Claude task\n/status → git status\n/stop → kill current task\n/help → this message`
        );
      } else {
        runClaude(text);
      }
    }
  } catch (err) {
    console.error("Poll error:", err.message);
  }
}

async function main() {
  console.log("✅ Telegram bot started. Waiting for messages...");
  await sendMessage("🤖 *Claude bot is online!*\nSend me a task or /help for commands.");

  // Long-poll loop
  while (true) {
    await getUpdates();
  }
}

main();
