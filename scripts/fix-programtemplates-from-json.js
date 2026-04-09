// scripts/fix-programtemplates-from-json.js
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB || "workout_tracker";
const JSON_PATH = path.join(
  process.cwd(),
  "data",
  "The_Bodybuilding_Transformation_System_-_Intermediate-Advanced - Intermediate-Advanced Program (1).json"
);

function parseWarmupSets(field5) {
  const text = String(field5 || "").trim();
  if (!text) return null;
  const nums = text.match(/\d+/g)?.map(Number).filter(Number.isFinite) || [];
  if (!nums.length) return null;
  return Math.max(...nums); // "2-3" => 3
}

(async () => {
  const raw = fs.readFileSync(JSON_PATH, "utf8");
  const rows = JSON.parse(raw);

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection("programtemplates");

  let currentWeek = null;
  let currentDay = null;

  let matched = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const weekCell = String(
      row["The Bodybuilding Transformation System - Intermediate-Advanced"] || ""
    ).trim();

    // Track week context: "Week 1", "Week 2", etc.
    const weekMatch = weekCell.match(/^Week\s+(\d+)/i);
    if (weekMatch) {
      currentWeek = Number(weekMatch[1]);
      continue;
    }

    // Track day context: row has day label in first column and exercise in field3
    if (weekCell && row.field3) {
      currentDay = weekCell.replace(/\s+/g, " ").trim();
    }

    const exerciseName = String(row.field3 || "").trim();
    if (!exerciseName || !currentWeek || !currentDay) {
      continue;
    }

    // Skip header-ish rows
    if (/^Exercise$/i.test(exerciseName)) continue;

    const reps = String(row.field7 || "").trim();
    const warmupSets = parseWarmupSets(row.field5);

    if (!reps || warmupSets == null) {
      skipped++;
      continue;
    }

    const filter = {
      weekNumber: currentWeek,
      dayKey: currentDay,
      exerciseName
    };

    const result = await col.updateMany(filter, {
      $set: {
        warmupSets,
        reps,
        updatedAt: new Date()
      }
    });

    if (result.matchedCount > 0) matched += result.matchedCount;
    if (result.modifiedCount > 0) updated += result.modifiedCount;
  }

  console.log({ matched, updated, skipped });
  await client.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});