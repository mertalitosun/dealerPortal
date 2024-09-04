const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const MemoryStore = require('memorystore')(session);
const initializeDatabase = require("./initializeDatabase");

const url = "mongodb://localhost:27017/dealerPortal"
const connect = async () => {
  try {
    await mongoose.connect(url);
    console.log("MongoDB ile veritabanına bağlanıldı.");
  } catch (err) {
    console.error("Veritabanına bağlanırken hata oluştu:", err);
  }
};

//Başlangıçta adminleri ekler

// initializeDatabase();

// const sessionMiddleware = session({
//   secret: "your-secret-key",
//   resave: false,
//   saveUninitialized: false,
//   cookie: {
//     maxAge: 1000 * 60 * 60 * 24 
//   },
//   store: MongoStore.create({
//     mongoUrl: url,
//     collectionName: 'sessions'
//   })
// })
const sessionMiddleware = session({
  secret: "z4EYE7qlRD",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  },
  store: new MemoryStore({
    checkPeriod: 1000 * 60 * 60 
  })
});


module.exports = { connect, sessionMiddleware };
