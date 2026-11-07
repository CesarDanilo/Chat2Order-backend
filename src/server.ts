import "dotenv/config";
import { loadEnv } from "./config/env";
import app from "./app";

const { PORT } = loadEnv();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
