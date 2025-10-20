import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { RedisService } from "../src/lib/redisService";

const TEMPLATE_PATH = path.join(__dirname, "output", "backend-format-template.json");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function generateTemplate() {
  try {
    const database = await RedisService.getDatabase();
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(TEMPLATE_PATH, JSON.stringify(database, null, 2), "utf8");

    console.log("Backend format template updated:", TEMPLATE_PATH);
    console.log("Contracts captured:", database.contracts.length);
  } catch (error) {
    console.error("Failed to generate backend template", error);
    process.exit(1);
  }
}

generateTemplate();
