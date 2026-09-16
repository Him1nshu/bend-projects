require("dotenv").config();

const app = require("./backend/app");
const pool = require("./backend/db/postgress.js");
const redis = require("./backend/db/redis.js");

const PORT = 3000;

const start = async () => {
    await pool.initializeDatabase();
    await redis.connect();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start().catch((error) => {
    console.error("Could not start server:", error.message);
    process.exit(1);
});