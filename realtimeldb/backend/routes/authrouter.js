const express=require("express");
const router=express.router();
const authcontroller=require("..controllers/authcontroller.js");

router.post("/register",authcontroller.register);


module.exports=router;