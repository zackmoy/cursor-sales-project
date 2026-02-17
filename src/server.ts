import { app } from "./app.js";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
