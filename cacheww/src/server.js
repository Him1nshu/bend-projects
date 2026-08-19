const express=require('express');
const app=express();

const cache={};

app.get("/",(req,res)=>{
    res.end("ehllo");

})

app.get("/products", async (req,res)=>{

    if(cache["/products"]!=null){
        res.json(cache["/products"]);
    }
    else{
    const response= await fetch("https://dummyjson.com/products");
    const data= await response.json();
    cache["/products"]=data;
    res.json(data);
    }
})


app.listen(3000,()=>{
    console.log("port running");
})