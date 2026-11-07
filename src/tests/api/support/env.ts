import { randomBytes } from "node:crypto";
import { getTestDatabaseUrl } from "./test-database";

export const TEST_EXTENSION_ORIGIN = "chrome-extension://abcdefghijklmnopabcdefghijklmnop";

process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.EXTENSION_ORIGINS = TEST_EXTENSION_ORIGIN;
process.env.JWT_SECRET = randomBytes(32).toString("hex");
