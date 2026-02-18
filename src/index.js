import { app, ensureDatabaseSetup } from "./app.js";

const PORT = process.env.PORT || 3000;

ensureDatabaseSetup().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
