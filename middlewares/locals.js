// module.exports=function(req,res,next){
//     res.locals.isAuth = req.session.isAuth;
//     res.locals.fullName = req.session.fullName;
//     res.locals.userId = req.session.userId;
//     res.locals.isAdmin = req.session.isAdmin;
//     res.locals.isModerator = req.session.isModerator;
//     res.locals.isDealer = req.session.isDealer;
//     next();
// }

const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, "privateKey", (err, decoded) => {
            if (err) {
                res.locals.isAuth = false;
                return next();
            }
            
            res.locals.isAuth = true;
            res.locals.userId = decoded.userId;
            res.locals.fullName = req.session.fullName; 
            res.locals.isAdmin = decoded.roles?.includes("admin") || false;
            res.locals.isModerator = decoded.roles?.includes("moderator") || false;
            res.locals.isDealer = decoded.roles?.includes("dealer") || false;
            
            next();
        });
    } else {
        res.locals.isAuth = false;
        next();
    }
};
