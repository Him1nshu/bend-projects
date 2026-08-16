import { Octokit } from "octokit";

const octokit = new Octokit({
    auth: process.env.GITHUB_API
});

const username = process.argv[2];

const response = await octokit.request(
    "GET /users/{username}/events",
    {
        username: username
    }
);

const data = response.data;

console.log(data);