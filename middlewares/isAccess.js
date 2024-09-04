// const isAdmin = (req, res, next) => {
//     if (!req.session.isAdmin) {
//       return res.redirect("/user/profile");
//     }
//     next();
//   };
  
//   const isModerator = (req, res, next) => {
//     if (!req.session.isModerator) {
//       return res.redirect("/");
//     }
//     next();
//   };
  
//   const isDealer = (req, res, next) => {
//     if (!req.session.isDealer) {
//       return res.redirect("/admin/index");
//     }
//     next();
//   };
  
//   module.exports = {isAdmin,isModerator,isDealer}