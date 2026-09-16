const express = require("express");
const auth = require("../middleware/auth.js");
const scoreController = require("../controllers/scorecontroller.js");

const router = express.Router();
router.post("/", auth, scoreController.submitScore);
router.get("/leaderboard", scoreController.leaderboard);
router.get("/me/ranking", auth, scoreController.myRanking);
router.get("/report", auth, scoreController.topPlayersReport);

module.exports = router;