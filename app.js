const express = require("express");
const app = express();
const path = require("path");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { connect, sessionMiddleware } = require("./data/db");
const cron = require("node-cron") // script zamanlama için
const calculate_progress_payment = require("./helpers/calculate_progress_payment");
app.set("view engine", "ejs");
app.use(express.static("node_modules"));
app.use("/static", express.static(path.join(__dirname, "public")));
app.use('/documents', express.static(path.join(__dirname, 'documents')));
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());
require("dotenv").config

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Routes
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");

connect();
app.use(sessionMiddleware);
app.use(require("./middlewares/locals"));

const {auth} = require("./middlewares/auth")
app.use(auth);

app.use(authRoutes);
app.use(adminRoutes);
app.use(userRoutes);
app.use(require("./middlewares/errors"));


// her ayın 1. günü hakediş hesaplama çalışacak
cron.schedule('0 0 0 1 * *', () => {
  calculate_progress_payment();
});




const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Sunucu ${port} portunda başlatıldı.`);
});
