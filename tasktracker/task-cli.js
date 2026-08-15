const fs=require('fs');
const tasks=[];
if(!fs.existsSync('tasks.json')){
    fs.writeFileSync('tasks.json',JSON.stringify(tasks));
}
else{
    
    const desc=process.argv[1];
    const status=process.argv[2];
    const date=new Date().toISOString();
    const temp=[desc,status,date];
    tasks.push(temp);
    fs.writeFileSync('tasks.json',JSON.stringify(tasks));
    const tasks=fs.readFileSync("tasks.json","utf-8");
    const arr=JSON.parse(tasks);
    console.log(tasks);
}
