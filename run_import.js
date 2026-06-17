import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import { anyApi } from "convex/server";

const url = process.env.VITE_CONVEX_URL;
if (!url) {
  console.error("VITE_CONVEX_URL missing");
  process.exit(1);
}

const client = new ConvexHttpClient(url);

const events = JSON.parse(fs.readFileSync("events.json", "utf-8"));
const branches = JSON.parse(fs.readFileSync("branches.json", "utf-8"));
const attendanceLogs = JSON.parse(fs.readFileSync("attendance_logs.json", "utf-8"));

async function main() {
  console.log("Starting import...");
  const result = await client.mutation(anyApi.importData.importAll, {
    events,
    branches,
    attendanceLogs,
  });
  console.log("Import result:", result);
}

main().catch(console.error);
