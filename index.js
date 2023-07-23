import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import bodyParser from 'body-parser';
import bcrypt from "bcrypt";

const app = express();
mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName:"mock_app"}
).then((resp)=>
console.log("successfully connected!!")
).catch((err)=>{
    console.log("error is", err)
})

const Schema = new mongoose.Schema(
    {
    name:String,
    email:String,
    password: String
    }
);

const Messages = mongoose.model("Messages",Schema);

app.set("view engine", "ejs")
app.use(express.urlencoded({extended:true}));
app.use(express.static(`${path.resolve()}/public`));
app.use(cookieParser());
app.use(bodyParser.json());

const userAuth = async(req,res,next)=>{
    const {token} = req.cookies;
    if(token){
    const decoded = jwt.verify(token,"mai_sabse_bada_bhosdiwala");
    req.user = await Messages.findById(decoded._id)
      next()
    }
    else{

        res.redirect(`/login`);
    }
 
    //   res.render("logout.ejs");
}

app.get("/", userAuth, (req,res)=>{
res.render("logout.ejs");
console.log('req.user',req.user);

});

app.post('/login',async(req,res)=>{
    const {email,password} = req.body;
     let user = await Messages.findOne({email});
    if(!user){
        return res.redirect("/register");
    }
    const isPresent = await bcrypt.compare(password,user.password);
    if(!isPresent){
        return res.render("login", {email,message:"wrong password or username"})
    }
    const token = jwt.sign({_id:user._id},"mai_sabse_bada_bhosdiwala")
    // console.log("token",token)
   res.cookie("token", token,{
       httpOnly:true,
       expires: new Date(Date.now()+100*100)
   })
   res.redirect('/');
})

app.post('/register',async(req,res)=>{
    let{name,email,password}  = req.body;
    let user = await Messages.findOne({email});

    if(user){
       return res.redirect("/login");
    }

    const hashedPass = await bcrypt.hash(password,10);
     
    user = await Messages.create({
         name:req.body.name,
         email:req.body.email,
         password:hashedPass,
     })
     
     const token = jwt.sign({_id:user._id},"mai_sabse_bada_bhosdiwala")
     console.log("token",token)
    res.cookie("token", token,{
        httpOnly:true,
        expires: new Date(Date.now()+100*100)
    })
    res.redirect('/')
})

app.get('/logout',(req,res)=>{
    res.cookie("token", null,{
        httpOnly:true,
        expires: new Date(Date.now())
    })
    res.redirect('/')
})

app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})

app.listen(5000,()=>{
    console.log("server is working!!!")
});