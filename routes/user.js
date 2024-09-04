const express = require("express")
const router = express.Router();
// const {isDealer} = require("../middlewares/isAccess");
const {isDealer,authMiddleware} = require("../middlewares/auth");


const userController = require("../controller/user");


//progress-payments
router.get("/user/progress-payments",authMiddleware,isDealer,userController.get_progress_payments);


//paytr - link - transactions
router.get("/payment/:payment_link",userController.get_payment);
router.post("/payment-link-create",authMiddleware,userController.post_payment_link_create);
router.get("/payment-link-create",authMiddleware,userController.get_payment_link_create);

//Satışlar
router.post("/user/purchase/create",authMiddleware,isDealer,userController.post_purchase_create);
router.get("/user/purchase/create",authMiddleware,isDealer,userController.get_purchase_create);
router.get("/user/purchases",authMiddleware,isDealer,userController.get_purchases);

//altbayi gelebilir
router.get("/user/subDealers",authMiddleware,isDealer,userController.get_subDealers);

//customer
router.post("/customer/edit/:customerCode",authMiddleware,userController.post_customer_edit);
router.get("/customer/edit/:customerCode",authMiddleware,userController.get_customer_edit);
router.post("/customer/create/",authMiddleware,userController.post_customer_create)
router.get("/customer/create/",authMiddleware,userController.get_customer_create)
router.get("/customer/details/:customerCode",authMiddleware,userController.get_customer_details);
router.get("/user/customers",authMiddleware,isDealer,userController.get_customers);

//Profile
router.post("/user/password-change/:dealerCode",authMiddleware,isDealer,userController.post_password_change);
router.get("/user/password-change/:dealerCode",authMiddleware,isDealer,userController.get_password_change);
router.get("/user/profile",authMiddleware,isDealer,userController.get_profile);
router.get("/",authMiddleware,userController.get_index);


module.exports = router;    