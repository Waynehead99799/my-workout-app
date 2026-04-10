/**
 * Cloudflare Worker — Telegram Webhook → GitHub Actions bridge
 *
 * Deploy this to Cloudflare Workers (free tier).
 * It receives Telegram messages and triggers a GitHub Actions workflow.
 *
 * Required environment variables (set in Cloudflare dashboard):
 *   TELEGRAM_BOT_TOKEN  - your Telegram bot token
 *   TELEGRAM_CHAT_ID    - your Telegram chat ID
 *   GITHUB_TOKEN        - GitHub personal access token (with repo scope)
 *   GITHUB_REPO         - e.g. "Waynehead99799/my-workout-app"
 *   WEBHOOK_SECRET      - random string for verifying requests (optional)
 */

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    try {
      const update = await request.json();
      const msg = update.message;

      if (!msg) {
        return new Response("No message", { status: 200 });
      }

      // Security: only respond to your chat
      if (String(msg.chat.id) !== String(env.TELEGRAM_CHAT_ID)) {
        return new Response("Ignored", { status: 200 });
      }

      const text = msg.text?.trim();
      if (!text) {
        return new Response("No text", { status: 200 });
      }

      // Handle /status locally (no need for GitHub Action)
      if (text === "/help") {
        await sendTelegram(env, [
          "*Cloud Bot Commands*",
          "",
          "Send any message → triggers Claude on GitHub Actions",
          "/help → this message",
          "",
          "Note: tasks run on GitHub servers, not your PC.",
          "Changes are pushed to the `claude` branch.",
        ].join("\n"));
        return new Response("OK", { status: 200 });
      }

      // Trigger GitHub Actions workflow
      const [owner, repo] = env.GITHUB_REPO.split("/");
      const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/dispatches`;

      const ghResponse = await fetch(dispatchUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "telegram-claude-bot",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "telegram-task",
          client_payload: {
            prompt: text,
            chat_id: String(msg.chat.id),
          },
        }),
      });

      if (ghResponse.ok || ghResponse.status === 204) {
        await sendTelegram(env, "⏳ Task queued on GitHub Actions. You'll get results in 2-5 minutes.");
      } else {
        const err = await ghResponse.text();
        await sendTelegram(env, `❌ Failed to trigger GitHub Action: ${ghResponse.status}`);
        console.error("GitHub dispatch error:", err);
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Worker error:", err);
      return new Response("Error", { status: 500 });
    }
  },
};

async function sendTelegram(env, text) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: text.slice(0, 4096),
      parse_mode: "Markdown",
    }),
  });
}
