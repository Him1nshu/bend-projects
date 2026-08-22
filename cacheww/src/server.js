const express=require('express');
const app=express();

const cache={};
const port=process.argv[3];
const origin=process.argv[5]; 



app.use(async (req,res)=>{

    if(cache[req.path]!=null){
        res.set("X-Cache", "HIT");
        res.json(cache[req.path]);
    }
    else{
    res.set("X-Cache", "MISS");
    const response= await fetch(origin+req.path);
    const data= await response.json();
    cache[req.path]=data;
    res.write(data);
    }
})


app.listen(port,()=>{
    console.log("port running");
})