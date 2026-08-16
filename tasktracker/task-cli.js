const fs = require('fs');

if (!fs.existsSync('tasks.json')) {
    fs.writeFileSync('tasks.json', '[]');
}

const data = fs.readFileSync('tasks.json', 'utf8');
const tasks = JSON.parse(data);

const command = process.argv[2];

if (command === 'add') {
    const description = process.argv[3];

    const task = {
        id: tasks.length + 1,
        description: description,
        status: 'todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    tasks.push(task);

    fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));

    console.log(`Task added successfully (ID: ${task.id})`);
}
else if (command == 'delete') {
    const taskno = process.argv[3];

    const index = tasks.findIndex(task => task.id == taskno);

    if (index != -1) {
        tasks.splice(index, 1);

        fs.writeFileSync(
            "tasks.json",
            JSON.stringify(tasks, null, 2)
        );

        console.log("Task deleted successfully");
    }
    else {
        console.log("Task not found");
    }
}
else if (command == 'update') {
    const taskno = process.argv[3];
    const description = process.argv[4];

    const index = tasks.findIndex(task => task.id == taskno);

    if (index != -1) {
        tasks[index].description = description;
        tasks[index].updatedAt = new Date().toISOString();  
        fs.writeFileSync(
            "tasks.json",
            JSON.stringify(tasks, null, 2)
        );

        console.log("Task updated successfully");
    }
    else {
        console.log("Task not found");
    }
}
else if (command == 'mark-in-progress' || command == 'mark-done') {
    const taskno = process.argv[3];

    const index = tasks.findIndex(task => task.id == taskno);

    if (index != -1) {
        tasks[index].status =
            command == 'mark-done' ? 'done' : 'in-progress';

        tasks[index].updatedAt = new Date().toISOString();

        fs.writeFileSync(
            "tasks.json",
            JSON.stringify(tasks, null, 2)
        );

        console.log("Task status updated");
    }
    else {
        console.log("Task not found");
    }
}
else if(command=='list'){
    const type=process.argv[3];
    tasks.filter(task => task.status == 'done');
    if(tasks.length!=0){
    console.log(tasks);
    }
    else{
        console.log("no tasks found");
    }
}
else{
    console.log("wrong command");
}