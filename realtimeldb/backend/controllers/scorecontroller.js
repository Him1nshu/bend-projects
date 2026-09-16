const pool = require("../db/postgress.js");
const redis = require("../db/redis.js");

const globalKey = "leaderboard:global";
const gameKey = (game) => `leaderboard:game:${game}`;

const submitScore = async (req, res) => {
    const { game, score } = req.body;
    const numericScore = Number(score);
    if (!game || !Number.isInteger(numericScore) || numericScore < 0) {
        return res.status(400).json({ error: "game and a non-negative integer score are required" });
    }
    try {
        await pool.query("INSERT INTO scores (user_id, game, score) VALUES ($1, $2, $3)", [req.user.id, game.trim(), numericScore]);
        await redis.zIncrBy(globalKey, numericScore, String(req.user.id));
        await redis.zIncrBy(gameKey(game.trim()), numericScore, String(req.user.id));
        res.status(201).json({ message: "score submitted", game: game.trim(), score: numericScore });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "score submission failed" });
    }
};

const leaderboard = async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const key = req.query.game ? gameKey(req.query.game.trim()) : globalKey;
    try {
        const entries = await redis.zRangeWithScores(key, 0, limit - 1, { REV: true });
        const userIds = entries.map((entry) => Number(entry.value));
        const users = userIds.length ? await pool.query("SELECT id, username FROM users WHERE id = ANY($1)", [userIds]) : { rows: [] };
        const names = new Map(users.rows.map((user) => [user.id, user.username]));
        res.json({ leaderboard: entries.map((entry, index) => ({ rank: index + 1, userId: Number(entry.value), username: names.get(Number(entry.value)) || "unknown", score: Number(entry.score) })) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "could not load leaderboard" });
    }
};

const myRanking = async (req, res) => {
    const key = req.query.game ? gameKey(req.query.game.trim()) : globalKey;
    try {
        const rank = await redis.zRevRank(key, String(req.user.id));
        const score = await redis.zScore(key, String(req.user.id));
        res.json({ rank: rank === null ? null : rank + 1, score: score === null ? 0 : Number(score) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "could not load ranking" });
    }
};

const topPlayersReport = async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 365);
    const gameFilter = req.query.game ? "AND s.game = $2" : "";
    const values = req.query.game ? [days, req.query.game.trim()] : [days];
    try {
        const result = await pool.query(`
            SELECT u.id AS "userId", u.username, SUM(s.score)::INTEGER AS score, COUNT(s.id)::INTEGER AS "submissions"
            FROM scores s JOIN users u ON u.id = s.user_id
            WHERE s.created_at >= NOW() - ($1 * INTERVAL '1 day') ${gameFilter}
            GROUP BY u.id, u.username ORDER BY score DESC LIMIT 10
        `, values);
        res.json({ periodDays: days, game: req.query.game || "all", players: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "could not generate report" });
    }
};

module.exports = { submitScore, leaderboard, myRanking, topPlayersReport };