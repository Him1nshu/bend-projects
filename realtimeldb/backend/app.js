const express = require("express");
const pool = require("./db/postgress.js");
cont authrouter=require()

const app = express();

app.use(express.json());

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