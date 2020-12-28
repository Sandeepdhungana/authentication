require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")


const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(session({
    secret: "Thisismysecretkeyword. ",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())





mongoose.connect("mongodb://localhost:27017/userDB",{useUnifiedTopology: true,useNewUrlParser: true})
mongoose.set("useCreateIndex", true)

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())



app.get("/",loginn, function(req, res) {
    res.render("home");
})

app.get("/login", function(req, res) {
    res.render("login");
})

app.get("/register", function(req, res) {
    res.render("register");
})

app.get("/secrets", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})
app.post("/register", function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req,res, function() {
                res.redirect("secrets")
            })
        }
    })

})

app.post("/login", function(req, res,next) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })   
    
    passport.authenticate("local", function(err, user,info) {
        if(err) {
            return next(err)
        }
        if(!user) {
            return res.redirect("/login")
        }
        req.logIn(user, function(err) {
            if(err) {
                return next(err)
            }
            return res.redirect("/secrets")
        })
    }) (req, res, next)
})

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/")
})


app.listen("3000", function() {
    console.log("Listening on port 3000");
})

function loginn(req, res,next) {
    if(req.isAuthenticated()) {
       return res.redirect("/secrets")
    }
    next();
}