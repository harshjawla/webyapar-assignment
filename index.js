import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import multer from "multer";
import  path from "path";
import ejs from "ejs";
import { Console } from "console";
import fs from "fs";
const __dirname = dirname(fileURLToPath(import.meta.url));
 

const app=express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
const PORT=3000;

await mongoose.connect("mongodb://127.0.0.1:27017/webyapar");

const AdminSchema = new mongoose.Schema({
    username : String,
    password : String,
});

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        default: null,
    },
    username : String,
    password : String,
    userId: {
        type: Number,
        default: 5000,
    },
    filename: {
        type: String,
        default: null,
    },
    originalname: {
        type: String,
        default: null,
    },
    mimetype: {
        type: String,
        default: null,
    },
    size: {
        type: Number,
        default: null,
    },
    path: {
        type: String,
        default: null,
    },
    flag: {
        type: Number,
        default: -1,
    }
});

const upload = multer({ dest: 'uploads/' })

const Admin = new mongoose.model("Admin", AdminSchema); 
const User = new mongoose.model("User", UserSchema); 

const users = await User.find();
var idGen=5000;
if(users.length>0){
    idGen=users[users.length-1].userId+1;
}

app.get("/", (req,res)=>{
    res.sendFile(__dirname + "/public/login.html");
});

app.get("/admin", (req,res)=>{
    res.sendFile(__dirname + "/public/admin-login.html");
});

app.post("/createadmin",async (req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    const adminExists = await Admin.findOne({username});
    if(adminExists){
        const passwordCheck = await Admin.findOne({
            username: username,
            password: password,
        });
        if(passwordCheck){
            res.redirect("/createuser");
        } else{
            res.send("Wrong Password");
        }
    } else{
        res.send("Admin not found, check your username");
    }
});

app.get("/createuser",async (req,res) => {
    const users = await User.find();
    res.render("create-user", {users : users});
});

app.post("/createuser",async (req,res)=>{
    const username=req.body.username;
    const password= req.body.password;

    const alreadyRegistered = await User.findOne({username});

    if(alreadyRegistered){
        res.send("User Already registered");
    } else{
        const createdUser = await User.create({
            username: username,
            password: password,
            userId: idGen,
        });
        idGen++;
        if(createdUser){
            res.send("Success");
        } else{
            res.send("Fail");
        }
    }
})

app.post("/userlogin",async (req,res)=>{
    const username=req.body.username;
    const password=req.body.password;
    const userExist= await User.findOne({username});
    if(userExist){
        const passwordCheck = await User.findOne({
            username: username,
            password: password,
        });
        if(passwordCheck){
            res.render("user-login", {username: username});
        } else{
            res.send("Wrong Password");
        }
    } else{
        res.send("Username not created or deleted, please contact admin");
    }
});

app.post("/saveuser/:userid",  upload.single('picture'), async (req, res) => {
    const path = req.file.path;
    const newPath = path + ".webp";
    fs.renameSync(path, newPath);
    try {
        const username = req.params.userid;
        await User.updateOne({username: username}, {$set :{
            name: req.body.name,
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            flag: 0,
        }});
        res.send('File uploaded and saved to MongoDB.');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get("/viewuser/:userid",async (req,res)=>{
    const username = req.params.userid;
    const user = await User.findOne({username});
    const fileName = user.filename;
    res.render("user-login-view" , {filename : fileName, username: username, name:user.name, flag:user.flag});
});

app.get("/uploads/:file",async (req,res)=>{
    const file = req.params.file;
    const fileName = "uploads/" + file + ".webp";
    res.sendFile(path.join(__dirname, fileName));
});

app.get("/secret/:userId", (req,res)=>{
    const username = req.params.userId;
    res.render("user-login", {username: username});
});

app.get("/view",async (req,res)=>{
    const users = await User.find();
    res.render("table", {users : users});
});

app.get("/done/:userId",async (req,res)=>{
    const username = req.params.userId;
    await User.updateOne({username: username}, {$set :{
        flag: 1,
    }});
    const users = await User.find();
    res.render("table", {users : users});
});

app.get("/delete/:userId",async (req,res)=>{
    const username = req.params.userId;
    await User.deleteOne({ username: username });
    const users = await User.find();
    res.render("table", {users : users});
});

app.listen(PORT, ()=>{
    console.log(`Server is running on PORT: ${PORT}`);
});