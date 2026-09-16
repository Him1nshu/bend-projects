const express = require("express");
const pool = require("./db/postgress.js");
const authRouter = require("./routes/authrouter.js");
const scoreRouter = require("./routes/scorerouter.js");

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/scores", scoreRouter);

app.get("/", async (req, res) => {
    try {
        const result = await pool.query("SELECT current_database()");
        
        res.json({
            message: "Realtime Leaderboard API",
            database: result.rows[0].current_database
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Database connection failed"
        });
    }
});

module.exports = app;