I have a good understanding of how to create a real-time leaderboard system that updates scores in real-time. 
I also gained experience working with Redis sorted sets and implementing user authentication and score submission features.

https://roadmap.sh/projects/realtime-leaderboard-system

## db->postgress.js
# pool:
Instead of creating a brand-new database connection for every request,
a connection pool keeps several connections available,
When a request needs PostgreSQL, it borrows one.



## server.js
1.always require("dotenv").config() at the top
2.always borrow app.js here
3.listen to the port

## routes
1.always reuqire express and its router