import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { RedisService } from "../src/lib/redisService";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  try {
    const database = await RedisService.getDatabase();
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputFile = path.join(outputDir, `redis-database-${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(database, null, 2), "utf-8");

    console.log("Redis database snapshot saved:", outputFile);
    console.log("Contracts detected:", database.contracts.length);
  } catch (error) {
    console.error("Failed to fetch Redis database", error);
    process.exit(1);
  }
}

run();
