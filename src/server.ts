import app from "./app";
import "dotenv/config";

console.log("=================================");
console.log("SERVER FILE EXECUTED");
console.log("=================================");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});