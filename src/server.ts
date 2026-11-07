import "dotenv/config";
import { loadEnv } from "./app/config/env";
import app from "./app/app";

const { PORT } = loadEnv();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
