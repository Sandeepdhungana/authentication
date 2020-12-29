require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const findOrCreate = require("mongoose-findorcreate")
const FacebookStrategy = require("passport-facebook")
const GoogleStrategy = require( "passport-google-oauth20").Strategy;

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
    password: String,
    googleId: String,
    facebookId: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",loginn, function(req, res) {
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope:
      ['profile' ] }
));
app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));


app.get('/auth/facebook',
passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  

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