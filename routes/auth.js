const express = require("express")
const router = express.Router();

const authController = require("../controller/auth");


router.post("/password/reset/:token", authController.post_password_reset);
router.get("/password/reset/:token", authController.get_password_reset);
router.post("/forgot-password", authController.post_password_forgot);
router.get("/forgot-password", authController.get_password_forgot);
router.get("/register", authController.get_register);
router.post("/register", authController.post_register);

router.get("/login", authController.get_login);
router.post("/login", authController.post_login);

router.get("/logout", authController.get_logout);


module.exports = router;