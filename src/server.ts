import "dotenv/config";
import { loadEnv } from "./app/config/env";
import app from "./app/app";
import { log } from "./shared/logger";

const { PORT } = loadEnv();

app.listen(PORT, () => {
  log("info", "server_started", { port: PORT });
});
