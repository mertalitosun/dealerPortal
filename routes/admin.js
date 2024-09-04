const express = require("express")
const router = express.Router();
// const {isAdmin,isModerator} = require("../middlewares/isAccess");
const {isAdmin,isModerator,authMiddleware} = require("../middlewares/auth");

const upload = require("../helpers/documentUploads"); 

const adminController = require("../controller/admin");


//progress_payments
router.put('/admin/progress-payments/:id',authMiddleware,isAdmin,adminController.put_progress_payment)
router.get("/admin/progress-payments",authMiddleware,isAdmin,adminController.get_progress_payments);

//customers
router.post("/admin/customer/create",authMiddleware,isAdmin,adminController.post_customer_create);
router.get("/admin/customer/create",authMiddleware,isAdmin,adminController.get_customer_create);
router.get("/admin/customers",authMiddleware,isAdmin,adminController.get_customers);

//documents
router.post("/admin/dealer/document/add/:dealerId", upload.single('file'), authMiddleware,isAdmin,adminController.post_document_add);
router.get("/admin/dealer/document/add/:dealerId",authMiddleware,isAdmin,adminController.get_document_add);
router.get("/dealer/documents/:dealerId",authMiddleware,adminController.get_documents);
//purchases
router.post("/admin/purchase/create",authMiddleware,isAdmin,adminController.post_purchase_create);
router.get("/api/dealer/customers/:dealerId",authMiddleware,isAdmin,adminController.get_purchase_customer_api);
router.get("/admin/purchase/create",authMiddleware,isAdmin,adminController.get_purchase_create);
router.post("/admin/purchase/update/:purchaseCode",authMiddleware,isAdmin,adminController.post_purchase_update);
router.get("/admin/purchases",authMiddleware,isAdmin,adminController.get_purchases);
//Products
router.post("/admin/product/edit/:productCode",authMiddleware,isAdmin,adminController.post_product_edit);
router.get("/admin/product/edit/:productCode",authMiddleware,isAdmin,adminController.get_product_edit);
router.post("/admin/product/create",authMiddleware,isAdmin,adminController.post_product_create);
router.get("/admin/product/create",authMiddleware,isAdmin,adminController.get_product_create);
router.get("/admin/products",authMiddleware,isAdmin,adminController.get_products);

//dealer-edit
router.post("/admin/dealer/edit/:dealerCode",authMiddleware,isAdmin,adminController.post_dealer_edit);
router.get("/admin/dealer/edit/:dealerCode",authMiddleware,isAdmin,adminController.get_dealer_edit);
//dealer-details
router.get("/admin/dealer/details/:dealerCode",authMiddleware,isAdmin,adminController.get_dealer_details)

//dealer-create
router.post("/admin/dealer/create",authMiddleware,isAdmin,adminController.post_dealer_create);
router.get("/admin/dealer/create",authMiddleware,isAdmin,adminController.get_dealer_create);

router.get("/admin/dealers",authMiddleware,isAdmin,adminController.get_dealers);

//admin şifre değiştir
router.post("/admin/password-change/:userId",authMiddleware,isAdmin,adminController.post_password_change);
router.get("/admin/password-change/:userId",authMiddleware,isAdmin,adminController.get_password_change);

router.get("/admin/index",authMiddleware,isAdmin,adminController.get_index);


module.exports = router;