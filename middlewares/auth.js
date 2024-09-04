// module.exports = (req, res, next) => {
//   if (!req.session.isAuth) {
//     return res.redirect("/login");
//   }
//   next();
// };


const jwt = require("jsonwebtoken");


const auth = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    next();
}

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; 
    if (!token) {
        return res.redirect("/login");
    }

    jwt.verify(token, 'privateKey', (err, decoded) => {
        if (err) {
            return res.redirect("/login");
        }
        req.user = decoded;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user.roles.includes("admin")) {
        return res.redirect("/user/profile");
    }
    next();
};

const isModerator = (req, res, next) => {
    if (!req.user.roles.includes("moderator")) {
        return res.redirect("/");
    }
    next();
};

const isDealer = (req, res, next) => {
    if (!req.user.roles.includes("dealer")) {
        return res.redirect("/admin/index");
    }
    next();
};

module.exports = { authMiddleware, isAdmin, isModerator, isDealer,auth };
