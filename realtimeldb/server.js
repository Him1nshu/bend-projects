require("dotenv").config();

const app = require("./backend/app");

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});