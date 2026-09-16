const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/postgress.js");

const createToken = (user) => jwt.sign(
	{ id: user.id, username: user.username },
	process.env.JWT_SECRET || "development-secret",
	{ expiresIn: "7d" }
);

const register = async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password || password.length < 6) {
		return res.status(400).json({
			error: "username, email and a password of at least 6 characters are required"
		});
	}

	try {
		const passwordHash = await bcrypt.hash(password, 12);
		const result = await pool.query(
			"INSERT INTO users (username, email, password_hash) VALUES ($1, LOWER($2), $3) RETURNING id, username, email",
			[username.trim(), email.trim(), passwordHash]
		);
		const user = result.rows[0];
		res.status(201).json({ user, token: createToken(user) });
	} catch (error) {
		if (error.code === "23505") {
			return res.status(409).json({ error: "username or email already exists" });
		}
		console.error(error);
		res.status(500).json({ error: "registration failed" });
	}
};

const login = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({ error: "email and password are required" });
	}

	try {
		const result = await pool.query("SELECT * FROM users WHERE email = LOWER($1)", [email.trim()]);
		const user = result.rows[0];
		if (!user || !(await bcrypt.compare(password, user.password_hash))) {
			return res.status(401).json({ error: "invalid email or password" });
		}
		res.json({
			user: { id: user.id, username: user.username, email: user.email },
			token: createToken(user)
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "login failed" });
	}
};

module.exports = { register, login };
