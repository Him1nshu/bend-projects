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

for (const event of data){
    if(event.type=="PushEvent"){
        console.log("Pushed commits to " + event.repo.name);
    }
}