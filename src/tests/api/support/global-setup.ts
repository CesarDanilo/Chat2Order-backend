import { execSync } from "node:child_process";
import { Client } from "pg";
import { getTestDatabaseUrl } from "./test-database";

async function ensureDatabaseExists(testUrl: string) {
  const target = new URL(testUrl);
  const databaseName = target.pathname.slice(1);

  const maintenanceUrl = new URL(testUrl);
  maintenanceUrl.pathname = "/postgres";

  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();

  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (!rowCount) {
      await client.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
}

async function clearData(testUrl: string) {
  const client = new Client({ connectionString: testUrl });
  await client.connect();

  try {
    await client.query(
      'TRUNCATE "OrderItem", "OrderStatusHistory", "AILog", "Order", "Product", "User", "RevokedToken" CASCADE',
    );
  } finally {
    await client.end();
  }
}

export default async function globalSetup() {
  const testUrl = getTestDatabaseUrl();

  await ensureDatabaseExists(testUrl);

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: "pipe",
  });

  await clearData(testUrl);
}
