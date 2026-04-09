#!/usr/bin/env node
const { execSync } = require("child_process");

try {
  execSync("git add -A");
  // Check if anything staged
  try { execSync("git diff --cached --quiet"); process.exit(0); } catch {}

  const files = execSync("git diff --cached --name-only").toString().trim().split("\n");
  const names = files.map((f) => f.split("/").pop().replace(/\.[^.]+$/, "")).slice(0, 3);
  const suffix = files.length > 3 ? ` +${files.length - 3} more` : "";
  const msg = `${names.join(", ")}${suffix}: update`;

  execSync(`git commit -m "${msg}"`);
} catch (e) {
  process.exit(1);
}
