#!/usr/bin/env node
/**
 * Telegram bot controller for local coding CLIs.
 * Run: node scripts/telegram-bot.js
 */

const https = require("https");
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PROJECT_DIR = path.join(__dirname, "..");
const ENV_PATH = path.join(PROJECT_DIR, ".env");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    if (!key || rest.length === 0) {
      continue;
    }

    process.env[key.trim()] = rest.join("=").trim();
  }
}

loadEnvFile(ENV_PATH);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ID;

const CLAUDE_BIN =
  process.env.CLAUDE_BIN ||
  (process.platform === "win32"
    ? path.join(process.env.USERPROFILE || "", ".local", "bin", "claude.exe")
    : "claude");

const CODEX_BIN = process.env.CODEX_BIN || "codex";

const SUPPORTED_ENGINES = new Set(["claude", "codex"]);

function normalizeEngine(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return SUPPORTED_ENGINES.has(normalized) ? normalized : null;
}

function normalizeModel(value) {
  return String(value || "").trim();
}

const state = {
  engine: normalizeEngine(process.env.TELEGRAM_ENGINE) || "claude",
  models: {
    claude: normalizeModel(process.env.CLAUDE_MODEL),
    codex: normalizeModel(process.env.CODEX_MODEL),
  },
  codexCanResume: false,
};

if (!TOKEN || !CHAT_ID) {
  console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
  process.exit(1);
}

console.log(`Using CHAT_ID: ${CHAT_ID}`);

const TEMP_DIR = path.join(PROJECT_DIR, "tmp-telegram");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let offset = 0;
let currentProcess = null;

function getActiveModel(engine = state.engine) {
  return state.models[engine] || "default";
}

function setModel(engine, modelValue) {
  state.models[engine] = modelValue;
}

function markNextAsNewSession(engine) {
  if (engine === "claude") {
    process.env.CLAUDE_NEW_SESSION = "1";
    return;
  }
  if (engine === "codex") {
    process.env.CODEX_NEW_SESSION = "1";
  }
}

function consumeNewSessionFlag(engine) {
  if (engine === "claude") {
    const isNew = process.env.CLAUDE_NEW_SESSION === "1";
    if (isNew) {
      delete process.env.CLAUDE_NEW_SESSION;
    }
    return isNew;
  }

  const isNew = process.env.CODEX_NEW_SESSION === "1";
  if (isNew) {
    delete process.env.CODEX_NEW_SESSION;
  }
  return isNew;
}

function buildPromptWithFiles(prompt, files = []) {
  if (!files.length) {
    return prompt;
  }

  const filePaths = files.map((f) => f.replace(/\\/g, "/")).join(", ");
  return `${prompt}\n\nThe user attached file(s) from Telegram. Read them using your file tools: ${filePaths}`;
}

function buildCommand(fullPrompt) {
  const engine = state.engine;
  const model = state.models[engine];
  const isNewSession = consumeNewSessionFlag(engine);

  if (engine === "claude") {
    const args = ["--print", "--dangerously-skip-permissions"];

    if (model) {
      args.push("--model", model);
    }

    if (!isNewSession) {
      args.push("--continue");
    }

    args.push(fullPrompt);

    return {
      engine,
      bin: CLAUDE_BIN,
      args,
    };
  }

  const useResume = !isNewSession && state.codexCanResume;
  const args = useResume ? ["exec", "resume", "--last"] : ["exec"];

  args.push("--dangerously-bypass-approvals-and-sandbox");

  if (model) {
    args.push("--model", model);
  }

  args.push(fullPrompt);

  return {
    engine,
    bin: CODEX_BIN,
    args,
  };
}

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
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ ok: false, error: "Invalid JSON from Telegram" });
          }
        });
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
    text: text.slice(0, 4096),
    parse_mode: "Markdown",
  });
}

function runTask(prompt, files = []) {
  if (currentProcess) {
    sendMessage("Already running a task. Send /stop to cancel it first.");
    return;
  }

  const fullPrompt = buildPromptWithFiles(prompt, files);
  const command = buildCommand(fullPrompt);

  sendMessage(
    `Starting task on ${command.engine} (model: ${getActiveModel(command.engine)}).`
  );

  const proc = spawn(command.bin, command.args, {
    cwd: PROJECT_DIR,
    shell: false,
    env: process.env,
    windowsHide: true,
  });

  currentProcess = proc;
  let chunkBuffer = "";

  const flushChunk = () => {
    const text = chunkBuffer.trim();
    if (!text) {
      return;
    }
    sendMessage(text);
    chunkBuffer = "";
  };

  proc.stdout.on("data", (data) => {
    const text = data.toString();
    chunkBuffer += text;
    if (chunkBuffer.length > 800) {
      flushChunk();
    }
  });

  proc.stderr.on("data", (data) => {
    const err = data.toString().trim();
    if (!err) {
      return;
    }
    if (err.toLowerCase().includes("error")) {
      sendMessage(`Error: ${err}`);
    }
  });

  proc.on("close", (code) => {
    currentProcess = null;
    flushChunk();

    if (command.engine === "codex") {
      state.codexCanResume = true;
    }

    if (code === 0) {
      sendMessage("Task complete.");
    } else {
      sendMessage(`Task failed (exit code ${code}).`);
    }
  });

  proc.on("error", (err) => {
    currentProcess = null;
    sendMessage(`Failed to start ${command.engine}: ${err.message}`);
  });
}

async function downloadFile(filePath) {
  return new Promise((resolve, reject) => {
    https
      .get(`https://api.telegram.org/file/bot${TOKEN}/${filePath}`, (res) => {
        const name = path.basename(filePath);
        const dest = path.join(TEMP_DIR, name);
        const ws = fs.createWriteStream(dest);

        res.pipe(ws);
        ws.on("finish", () => {
          ws.close();
          resolve(dest);
        });
        ws.on("error", reject);
      })
      .on("error", reject);
  });
}

async function getFileFromMessage(msg) {
  let fileId = null;
  let caption = msg.caption || "";

  if (msg.photo) {
    fileId = msg.photo[msg.photo.length - 1].file_id;
  } else if (msg.document) {
    fileId = msg.document.file_id;
    caption = caption || msg.document.file_name || "";
  }

  if (!fileId) {
    return null;
  }

  const fileInfo = await apiCall("getFile", { file_id: fileId });
  if (!fileInfo.ok) {
    return null;
  }

  const localPath = await downloadFile(fileInfo.result.file_path);
  return { localPath, caption };
}

function getStatusText() {
  let branch = "unknown";
  let files = "unknown";

  try {
    branch = execSync("git branch --show-current", { cwd: PROJECT_DIR }).toString().trim() || "detached";
    files = execSync("git status --short", { cwd: PROJECT_DIR }).toString().trim() || "clean";
  } catch {
    // ignore git errors
  }

  return [
    "*Status*",
    `Branch: ${branch}`,
    `Files: ${files}`,
    `Running: ${currentProcess ? "yes" : "no"}`,
    `Engine: ${state.engine}`,
    `Model: ${getActiveModel()}`,
  ].join("\n");
}

function getHelpText() {
  return [
    "*Bot Commands*",
    "",
    "Send any message -> run task",
    "/status -> repo status + current engine/model",
    "/stop -> stop current task",
    "/new -> next task starts a fresh session for current engine",
    "/engine -> show current engine",
    "/engine <claude|codex> -> switch engine",
    "/model -> show active model",
    "/model <name> -> set model for current engine",
    "/model <claude|codex> <name> -> set model for specific engine",
    "/model default -> clear current engine model override",
    "/help -> this message",
  ].join("\n");
}

function parseModelCommand(text) {
  const parts = text.trim().split(/\s+/);

  if (parts.length === 1) {
    return { showOnly: true };
  }

  const maybeEngine = normalizeEngine(parts[1]);
  if (maybeEngine && parts.length >= 3) {
    return {
      targetEngine: maybeEngine,
      model: text.trim().slice((`/model ${parts[1]} `).length).trim(),
      showOnly: false,
    };
  }

  return {
    targetEngine: state.engine,
    model: text.trim().slice("/model ".length).trim(),
    showOnly: false,
  };
}

function normalizeModelInput(model) {
  const value = String(model || "").trim();
  if (!value) {
    return "";
  }

  const lowered = value.toLowerCase();
  if (lowered === "default" || lowered === "clear" || lowered === "none") {
    return "";
  }

  return value;
}

async function getUpdates() {
  try {
    const result = await apiCall("getUpdates", {
      offset,
      timeout: 30,
      allowed_updates: ["message"],
    });

    if (!result.ok) {
      return;
    }

    for (const update of result.result) {
      offset = update.update_id + 1;
      const msg = update.message;
      if (!msg) {
        continue;
      }

      if (String(msg.chat.id) !== String(CHAT_ID)) {
        console.log(`Ignored message from unknown chat: ${msg.chat.id}`);
        continue;
      }

      if (msg.photo || msg.document) {
        const file = await getFileFromMessage(msg);
        if (file) {
          const prompt = file.caption || "Look at this file and explain issues and fixes.";
          runTask(prompt, [file.localPath]);
        } else {
          sendMessage("Could not download the file.");
        }
        continue;
      }

      if (!msg.text) {
        continue;
      }

      const text = msg.text.trim();

      if (text === "/stop") {
        if (currentProcess) {
          currentProcess.kill();
          currentProcess = null;
          sendMessage("Task stopped.");
        } else {
          sendMessage("Nothing is running.");
        }
        continue;
      }

      if (text === "/status") {
        sendMessage(getStatusText());
        continue;
      }

      if (text === "/new") {
        markNextAsNewSession(state.engine);
        sendMessage(`Next ${state.engine} task will start a fresh session.`);
        continue;
      }

      if (text === "/engine") {
        sendMessage(`Current engine: ${state.engine}\nModel: ${getActiveModel()}`);
        continue;
      }

      if (text.startsWith("/engine ")) {
        const parts = text.split(/\s+/);
        const nextEngine = normalizeEngine(parts[1]);

        if (!nextEngine) {
          sendMessage("Unknown engine. Use /engine claude or /engine codex.");
          continue;
        }

        state.engine = nextEngine;
        markNextAsNewSession(nextEngine);

        if (parts.length > 2) {
          const modelInput = text.trim().slice((`/engine ${parts[1]} `).length).trim();
          setModel(nextEngine, normalizeModelInput(modelInput));
        }

        sendMessage(`Switched engine to ${state.engine} (model: ${getActiveModel()}).`);
        continue;
      }

      if (text === "/model" || text.startsWith("/model ")) {
        const parsed = parseModelCommand(text);

        if (parsed.showOnly) {
          sendMessage(
            [
              `Active engine: ${state.engine}`,
              `Active model: ${getActiveModel()}`,
              `Claude model: ${getActiveModel("claude")}`,
              `Codex model: ${getActiveModel("codex")}`,
            ].join("\n")
          );
          continue;
        }

        const targetEngine = parsed.targetEngine;
        if (!targetEngine) {
          sendMessage("Could not parse /model command.");
          continue;
        }

        const normalized = normalizeModelInput(parsed.model);
        setModel(targetEngine, normalized);

        sendMessage(
          `Model for ${targetEngine} set to ${getActiveModel(targetEngine)}.`
        );
        continue;
      }

      if (text === "/help") {
        sendMessage(getHelpText());
        continue;
      }

      runTask(text);
    }
  } catch (err) {
    console.error("Poll error:", err && err.message ? err.message : err);
  }
}

async function main() {
  console.log("Telegram bot started. Waiting for messages...");
  await sendMessage(
    `Bot is online.\nEngine: ${state.engine}\nModel: ${getActiveModel()}\nUse /help for commands.`
  );

  while (true) {
    await getUpdates();
  }
}

main();
