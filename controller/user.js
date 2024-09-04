const Dealers = require("../models/dealer_dealers");
const Roles = require("../models/dealer_roles");
const Customers = require("../models/dealer_customers");
const Purchases = require("../models/dealer_purchases");
const Products = require("../models/dealer_products");
const Integrator = require("../models/dealer_integrator");
const payment_links = require("../models/dealer_payment-links");
const payment_transactions = require("../models/dealer_payment_transactions");
const progress_payments = require("../models/dealer_progress_payments");
const shortid = require("shortid");
const bcrypt = require("bcrypt")
const firstLetter = require("../helpers/firstLetter");
const calculateCommission = require("../helpers/calculateCommission");
const randomLinks = require("../helpers/randomLinks");
const microtime = require('microtime');
const crypto = require('crypto');
const axios = require('axios');
const jsSHA = require("jssha");
var request = require('request');



//progress-payments
exports.get_progress_payments = async (req,res) => {
  const userId = req.user.userId;
  const {startDate, endDate,status} = req.query
  try{
   
    const paymentFilter = {dealerId: userId};
    if (startDate && endDate) {
      paymentFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999),
      };
    }

    if(status){
      paymentFilter.status = status;
    }
    const progressPayments = await progress_payments.find(paymentFilter).sort({_id:-1}).populate('dealerId');
    res.render("users/progress_payments/progress_payments",{
      title:"Bayi Hakedişler",
      progressPayments
    })
  }catch(err){
    console.log(err)
  }
}





exports.get_payment = async (req,res) => {
  const payment_link = req.params.payment_link;
  try{
    const paymentLink = await payment_links.findOne({processId:payment_link}).populate({path:"purchase",populate:{path:"customer",model:"dealer_customers",populate:{path:"addedBy",model:"dealer_dealers"}}})
      res.render("users/purchases/payment-transaction-create",{
        title:"Kişi Bilgileri",
        paymentLink
      });
  }catch(err){
    console.log(err)
  }
}

exports.post_payment_link_create = async(req,res) => {
  const userId = req.user.userId;
  const purchaseId = req.query.purchaseId;
  
  const paymentLink = randomLinks(10);
  const purchase = await Purchases.findById(purchaseId).populate("customer");

  try{
    const payment_link = new payment_links({
      dealerId:userId,
      purchase:purchase,
      processId:paymentLink,
      link:`https://localhost/payment/${paymentLink}`,
      totalAmount:purchase.price,
      isActive:true,
      createdAt:new Date(), 
    })
    await payment_link.save();

    //link 24 saat sonra pasif 
    setTimeout(async () => {
      try {
        await payment_links.updateOne({ _id: payment_link._id },{ $set: { isActive: false }});
      } catch (err) {
        console.error(err);
      }
    },24 * 60 * 60 * 1000);
    // res.redirect(`/payment-link-create?link=${encodeURIComponent(payment_link.link)}`);
    res.json({ success: true, link: payment_link.link });
  }catch(err){
    console.log(err)
  }
}

exports.get_payment_link_create = async(req,res)=>{
  const purchaseId = req.query.purchaseId;
  const isAdmin = req.user.roles.includes("admin");
  const isModerator = req.user.roles.includes("moderator");
  try{
    const integrators = await Integrator.find();
    const purchase = await Purchases.findById(purchaseId)
    const existingPaymentLinks = await payment_links.find({purchase:purchaseId,isActive:true})
    if(existingPaymentLinks.length > 0){
      if(isAdmin || isModerator){
      res.redirect(`/admin/purchases?isActive=true`)
      }else{
      res.redirect(`/user/purchases?isActive=true`)
      }
    }else{
      res.render("users/purchases/payment-link-create",{
        title: "Ödeme Link Oluştur",
        integrators:integrators,
        purchase,
        existingPaymentLinks
      })
    }
    
  }catch(err){console.log(err)}
}

//purchase
exports.post_purchase_create = async (req,res) => {
  const userId = req.user.userId;
  const {productSelect,purchaseDate,customerSelect,piece,price,integrator,giftRate,giftPiece} = req.body;
  let parsedPrice = parseFloat(price);
  let parsedPiece = parseInt(piece);
  // const totalPrice = parsedPiece ? (parsedPrice * parsedPiece) : parsedPrice;
  const totalPrice = parsedPrice;

  let errors = [];
  if (!productSelect || productSelect.trim() === '') {
    errors.push({ msg: 'Ürün seçilmelidir' });
  }
  if (!purchaseDate || isNaN(new Date(purchaseDate))) {
    errors.push({ msg: 'Geçerli bir satın alma tarihi girilmelidir' });
  }
  if (!customerSelect || customerSelect.trim() === '') {
    errors.push({ msg: 'Müşteri seçilmelidir' });
  }
  if (errors.length > 0) {
    const products = await Products.find();
    const customers = await Customers.find({addedBy:userId})
    return res.status(400).render('users/purchases/purchase-create', {
      title: 'Sipariş Oluştur',
      errors: errors,
      data: { productSelect, purchaseDate, customerSelect },
      products,
      customers
    });
  }

  const isGift = (giftRate && giftRate.trim() !== '') || (giftPiece && giftPiece.trim() !== '') ? true : false;
  try{
    const product = await Products.findById(productSelect).populate("type")
    const purchase = new Purchases({
      name:product.name,
      price: totalPrice,
      purchaseCode: `PRC-${shortid.generate()}`,
      purchaseDate: purchaseDate,
      dealerId:userId,
      customer:customerSelect,
      type: product.type.name,
      integrationName:integrator ? integrator: null,
      isGift:isGift ? isGift:null,
      giftRate:giftRate ? giftRate : null,
      giftPiece:giftPiece ? giftPiece : null,
      paymentStatus:null
    });
    await purchase.save();
    res.redirect("/user/purchases");
  }catch(err){
    console.log(err);
  }
}

exports.get_purchase_create = async (req,res) =>{
  const userId = req.user.userId;
  try{
    const integrators = await Integrator.find();

    const products = await Products.find().populate("type");
    const customers = await Customers.find({addedBy:userId})
    res.render("users/purchases/purchase-create",{
      title:"Sipariş Oluştur",
      products:products,
      customers:customers,
      integrators
    })
  }catch(err){
    console.log(err)
  }
}

exports.get_purchases = async (req,res) =>{
  const userId = req.user.userId;
  const {page = 1, startDate, endDate, status } = req.query;
  const perPage = 10;
  try{
    const customers = await Customers.find({addedBy:userId});
    const customerIds = customers.map(customer=>customer._id);
    
    const filteredPurchase = { customer: { $in: customerIds } }

    if (startDate && endDate) {
      filteredPurchase.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999)
      };
    }
   
    const filteredpaymentTransactions = {}

    if(status){
     filteredpaymentTransactions.status = status
    }

    const totalPurchases = await Purchases.countDocuments(filteredPurchase);
    const totalPages = Math.ceil(totalPurchases / perPage);
    const purchases = await Purchases.find(filteredPurchase).sort({_id:-1}).skip((page - 1 ) * perPage).limit(perPage).populate('customer');

    const links = await payment_links.find(); 
    const paymentTransactions = await payment_transactions.find();
    res.render("users/purchases/purchases",{
      title:"Satışlar",
      purchases:purchases,
      currentPage: parseInt(page),
      totalPages,
      links,
      paymentTransactions,
    })
  }catch(err){
    console.log(err)
  }
}

//Alt Bayi
exports.get_subDealers = async (req,res) =>{
  const userId = req.user.userId;
  const {page = 1, query} = req.query;
  const perPage = 10;
  try{
    const filter = query ? {
      $or: [
        { subDealerCode: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    } : {};
    const totalDealers = await Dealers.countDocuments({referenceBy:userId, ...filter});
    const totalPages = Math.ceil(totalDealers / perPage);
    const dealers = await Dealers.find({referenceBy:userId,...filter}).sort({_id:-1}).skip((page - 1) * perPage).limit(perPage);
    if(query){
      return res.json({dealers})
    }
    res.render("users/subDealers/subDealers",{
      title:"Alt Bayi Listesi",
      dealers:dealers,
      currentPage: parseInt(page),
      totalPages
    })
  }catch(err){
    console.log(err)
  }
}

//customer
exports.post_customer_edit = async (req,res) => {
  const customerCode = req.params.customerCode;
  const {firstName,lastName,phone,organization} = req.body;
  let errors = [];

  if (!firstName || firstName.trim() === '') {
    errors.push({ msg: 'Ad boş bırakılamaz' });
  }
  if (!lastName || lastName.trim() === '') {
    errors.push({ msg: 'Soyad boş bırakılamaz' });
  }
  if (!phone || phone.trim() === '') {
    errors.push({ msg: 'Telefon boş bırakılamaz' });
  }
  if (!organization || organization.trim() === '') {
    errors.push({ msg: 'Şirket boş bırakılamaz' });
  }
  if (errors.length > 0) {
    const customer = await Customers.find()
    return res.status(400).render('users/customers/customer-edit', {
      title: 'Bayi Kayıt Formu',
      errors: errors,
      data: { firstName, lastName, phone, organization },
      customer:customer
    });
  }
  try{
    await Customers.findOneAndUpdate({customerCode:customerCode},{
      firstName: firstLetter(firstName),
      lastName: firstLetter(lastName),
      phone:phone,
      organization: firstLetter(organization)
    })
    res.redirect(`/customer/details/${customerCode}`)
  }catch(err){
    console.log(err)
  }
  
}

exports.get_customer_edit = async (req,res) =>{
  const customerCode = req.params.customerCode;
  try{
    const customer = await Customers.findOne({customerCode:customerCode});
    res.render("users/customers/customer-edit",{
      title:"Müşteri Güncelle",
      customer:customer
    })
  }catch(err){
    console.log(err)
  }
}

exports.post_customer_create = async (req,res) =>{
  const userId = req.user.userId;
  const {firstName,lastName,phone,organization,addedBy,tcVkn} = req.body;
  let errors = [];

  if (!firstName || firstName.trim() === '') {
    errors.push({ msg: 'Ad boş bırakılamaz' });
  }
  if (!lastName || lastName.trim() === '') {
    errors.push({ msg: 'Soyad boş bırakılamaz' });
  }
  if (!tcVkn || tcVkn.trim() === '') {
    errors.push({ msg: 'TC/VKN boş bırakılamaz' });
  }
  if (!phone || phone.trim() === '') {
    errors.push({ msg: 'Telefon boş bırakılamaz' });
  }
  if (!organization || organization.trim() === '') {
    errors.push({ msg: 'Şirket boş bırakılamaz' });
  }
  if (errors.length > 0) {
    const dealers = await Dealers.find();
    return res.status(400).render('users/customers/customer-create', {
      title: 'Müşteri Kayıt Formu',
      errors: errors,
      data: { firstName, lastName, phone, organization,tcVkn },
      dealers
    });
  }

  try{
    const existingCustomer = await Customers.findOne({ tcVkn: tcVkn });
    if (existingCustomer) {
      errors.push({ msg: 'Bu TC/VKN ile sisteme kayıtlı müşteri mevcut' });
      const dealers = await Dealers.find();
      return res.status(400).render('users/customers/customer-create', {
        title: 'Müşteri Kayıt Formu',
        errors: errors,
        data: { firstName, lastName, phone, organization, tcVkn },
        dealers
      });
    }
    const customer = new Customers({
      firstName:firstLetter(firstName),
      lastName:firstLetter(lastName),
      phone,
      organization: firstLetter(organization),
      customerCode: `CSR-${shortid.generate()}`,
      tcVkn,
      addedBy: addedBy ? addedBy : userId
    });
    await customer.save();
    if(addedBy){
      res.redirect("/admin/customers");
    }else{
      res.redirect("/user/customers")
    }
  }catch(err){
    console.log(err);
  }
}

exports.get_customer_create = async(req,res) =>{
  try{
    const dealers = await Dealers.find();
    res.render("users/customers/customer-create",{
      title: "Müşteri Kayıt",
      dealers
    })
  }catch(err){
    console.log(err)
  }
}

exports.get_customer_details = async (req,res) =>{
  const customerCode = req.params.customerCode;
  const {page = 1} = req.query;
  const perPage = 10;
  try{
    const customer = await Customers.findOne({customerCode:customerCode}).populate("addedBy")

    const totalPurchases = await Purchases.countDocuments({customer:customer._id});
    const totalPages = Math.ceil(totalPurchases / perPage);

    const purchases = await Purchases.find({customer:customer._id}).sort({_id:-1}).skip((page - 1) * perPage).limit(perPage)
    res.render("users/customers/customer-details",{
      title: `${customer.firstName + " " + customer.lastName} || Detay`,
      customer:customer,
      purchases:purchases,
      currentPage: parseInt(page),
      totalPages
    })
  }catch(err){
    console.log(err)
  }
}

exports.get_customers = async (req,res) =>{
  const userId = req.user.userId
  const {page = 1,query} = req.query;
  const perPage = 2;
  try{
    const filter = query ? {
      $or: [
        { customerCode: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { organization: { $regex: query, $options: 'i' } }
      ]
    } : {};
    const queryCustomers = {addedBy:userId, ...filter}
    const totalCustomers = await Customers.countDocuments(queryCustomers);
    const totalPages = Math.ceil(totalCustomers / perPage);
    
    const customers = await Customers.find(queryCustomers).sort({_id:-1}).skip((page - 1) * perPage).limit(perPage);
    if(query){
      return res.json({customers})
    }
    res.render("users/customers/customers",{
      title: "Müşteri Listesi",
      customers:customers,
      currentPage: parseInt(page),
      totalPages
    });
  }catch(err){
    console.log(err)
  }
}

exports.post_password_change = async (req,res) =>{
  const userId = req.user.userId;
  const {currentPassword,newPassword,confirmNewPassword} = req.body;

  let errors = [];

  if (!currentPassword || currentPassword.trim() === '') {
    errors.push({ msg: 'Mevcut şifre boş bırakılamaz' });
  }
  if (!newPassword || newPassword.trim() === '') {
    errors.push({ msg: 'Yeni şifre boş bırakılamaz' });
  }
  if (!confirmNewPassword || confirmNewPassword.trim() === '') {
    errors.push({ msg: 'Yeni şifre tekrarı boş bırakılamaz' });
  }
  if (newPassword !== confirmNewPassword) {
    errors.push({ msg: 'Şifreler eşleşmiyor' });
  }

  if (errors.length > 0) {
    return res.status(400).render('/profile/password-change', {
      title: 'Şifre Güncelle',
      errors: errors,
    });
  }

  try{
    const dealer = await Dealers.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, dealer.password);
    if (!isMatch) {
      errors.push({ msg: 'Mevcut şifre yanlış' });
      return res.status(400).render('users/profile/password-change', {
        title: 'Şifre Güncelle',
        errors: errors,
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    dealer.password = hashedPassword;
    await dealer.save();
    res.redirect("/user/profile")
  }catch(err){
    console.log(err)
  }
}
exports.get_password_change = (req,res) =>{
  res.render("users/profile/password-change",{
    title:"Şifre Güncelle"
  })
}

exports.get_profile = async (req, res) => {
  const userId = req.user.userId;
  const {startDate, endDate, status,customer, page = 1 } = req.query;
  const perPage = 10;
  try {
    const dealer = await Dealers.findById(userId).populate("roles").populate("referenceBy");

    //hakediş
    const {totalCommission, totalSubCommission,monthlyTotal,monthlySubTotal } = await calculateCommission(dealer,startDate,endDate);


    const filtredPayment= {dealerId:dealer._id,paymentStatus:"Success"};
    
    if (startDate && endDate) {
      filtredPayment.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999)
      };
    }



    const totalPaymentTransactions = await Purchases.countDocuments(filtredPayment);
    const totalPages = Math.ceil(totalPaymentTransactions / perPage);

    const purchases = await Purchases.find(filtredPayment).sort({_id:-1}).skip((page - 1) * perPage).limit(perPage).populate("customer");
    res.render("users/profile/profile", {
      title: `${dealer.firstName + " " + dealer.lastName}`,
      dealer:dealer,
      totalCommission,
      totalSubCommission,
      currentPage: parseInt(page),
      totalPages,
      purchases,
      startDate,
      endDate,
      monthlyTotal,
      monthlySubTotal
    });
  } catch (err) {
    console.log(err);
  }
};

exports.get_index = (req, res) => {
  res.redirect("/user/profile");
}
