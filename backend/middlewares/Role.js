const User=require("../models/User")
const role=(req,res,next)=>{
    const Users= new User.find({role:1})
    const role=req.body 
    if(role==="admon"){

    }
}