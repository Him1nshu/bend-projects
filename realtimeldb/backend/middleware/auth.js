const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "authentication required" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || "development-secret");
        next();
    } catch {
        res.status(401).json({ error: "invalid or expired token" });
    }
};