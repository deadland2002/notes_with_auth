const express = require('express')
const mongoose = require('mongoose')
const User = require('./model/user.js')
const bcrypt = require('bcrypt')
const { json, response } = require('express')
const jwt = require('jsonwebtoken')
const http = require('https')

require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET
const key = process.env.KEY
const url = process.env.URL
const pass = process.env.PASSWORD

mongoose.connect('mongodb+srv://satvikshukla453:'+pass+'@cluster0.vzczyof.mongodb.net/test')

const app = express()

app.use(express.static("public"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs")


app.get("/", function (req, res) {
    res.render('home');
})




app.get("/register", function (req, res) {
    res.render('signup');
})

app.get("/login", function (req, res) {
    res.render('login');
})

app.get("/account", function (req, res) {
    res.render('account');
})




app.post("/register", async function (req, res) {
    const { username, password: OrgPass } = req.body;
    const password = await bcrypt.hash(OrgPass, 10);

    if (!username) {
        alert("Enter Username");
        return res.json({ status: "error", error: "User / Password" });
    }
    else if (!password) {
        alert("Enter Password");
        return res.json({ status: "error", error: "User / Password" });
    }
    else if (password.length < 5) {
        alert("Password too small");
        return res.json({ status: "error", error: "User / Password" });
    }


    try {
        const response = await User.create({
            username,
            password
        })
        console.log("User Created");
    }
    catch (err) {
        if (err.code === 11000) {
            console.log("Duplicate User");
            return res.json({ status: "error", error: "11000" })
        }
        else {
            console.log(JSON.stringify(err));
            return res.json({ status: "error", error: "11000" })
        }
    }


    res.json({ status: 'ok' });
})





app.post("/login", async function (req, res) {
    const { username, password } = req.body;

    if (!username) {
        alert("Enter Username");
        return res.json({ status: "error", error: "User / Password" });
    }
    else if (!password) {
        alert("Enter Password");
        return res.json({ status: "error", error: "User / Password" });
    }
    else if (password.length < 5) {
        alert("Password too small");
        return res.json({ status: "error", error: "User / Password" });
    }


    try {
        const response = await User.findOne({
            username,
        }).lean()

        if (!response) {
            console.log("invalid username");
            return res.json({ status: 'error', error: "Invalid Username / Password" });
        }
        else if (await bcrypt.compare(password, response.password)) {
            const token = jwt.sign({
                id: response._id,
                username: response.username
            }, JWT_SECRET)

            console.log("ok");

            return res.json({ status: 'ok', data: token });
        }
        else {
            console.log("org pass : ", password);
            console.log(response.password);
        }
    }
    catch (err) {
        console.log(err);
    }


    return res.json({ status: 'error', error: "Invalid Username / Password" });
})





app.post("/account", async function (req, res) {



    const { username, token } = req.body;

    try {
        const verify = jwt.verify(token, JWT_SECRET);
    }
    catch (err) {
        console.log("Invalid Token");
        return res.json({ status: 'error', error: "Token invalid" });
    }
    const arr = []
    try {
        const response = await User.findOne({ username }).lean();
        const list = response.list;
        if (list)
            list.forEach(element => {
                arr.push(element);
            })

    } catch (err) {
        console.log(err);
    }
    return res.json({ status: 'ok', data: "Token valid", list: arr });

})






app.post("/account/add", async function (req, res) {
    // console.log(req.body);
    const { username, title_str, inp_str } = req.body;

    var temp = [title_str, inp_str];

    try {
        const response = await User.updateOne({ "username": username }, { $push: { list: temp } }).lean();
        // console.log(response);
    }
    catch (err) {
        console.log(err);
    }

    return res.json({ status: 'ok', data: "Token valid" });
})






app.post("/account/delete", async function (req, res) {
    // console.log(req.body);
    const { username, title: title_str, inp: inp_str } = req.body;

    var temp = [title_str, inp_str];

    try {
        const response = await User.updateOne({ "username": username }, { $pull: { list: temp } }).lean();
        // console.log(response);
    }
    catch (err) {
        console.log(err);
    }

    return res.json({ status: 'ok', data: "Token valid" });
})



app.post("/account/deleteaccount", async function (req, res) {
    // console.log(req.body);
    const { username } = req.body;

    try {
        const response = await User.deleteOne({ "username": username }).lean();
        // console.log(response);
    }
    catch (err) {
        console.log(err);
    }

    return res.json({ status: 'ok', data: "Token valid" });
})



app.post("/weather", async function (req, res) {
    const { username } = req.body;
    const URL = url + 'Kanpur' + ",208020&units=metric&appid=" + key;

    var description;
    var temperature;
    var country;

    

   http.get(URL, async function (response) {
        response.on('data', async function (chunk) {
            const data = JSON.parse(chunk);
            if(data.cod == '200'){
                country = data.sys.country ;
                description = data.weather[0].description;
                temperature =  data.main.temp;
                return res.json({ status: 'ok', 'country':country , 'description':description ,temperature });
            }
            else if(data.cod == '404'){
                return res.json({ status: 'err' , error:"Not Found"});
            }
            else{
                console.log(data.cod);
                return res.json({ status: 'err' , error:"Unknown"});
            }
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
        return res.json({ status: 'err' });
    });

    
})







app.listen(2000, function (err) {
    if (err) {
        console.log(err)
    }
    else {
        console.log("Server running on port 2000")
        console.log("localhost:2000")
    }
});