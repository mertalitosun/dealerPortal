const Users = require("../models/dealer_users");
const Dealers = require("../models/dealer_dealers");
const Roles = require("../models/dealer_roles");
const Products = require("../models/dealer_products");
const Customers = require("../models/dealer_customers");
const Purchases = require("../models/dealer_purchases");
const Documents = require("../models/dealer_documents");
const Product_types = require("../models/dealer_product_type");
const payment_links = require("../models/dealer_payment-links");
const payment_transactions = require("../models/dealer_payment_transactions");
const progress_payments = require("../models/dealer_progress_payments");
const Integrator = require("../models/dealer_integrator");


const shortid = require("shortid");
const bcrypt = require("bcrypt");
const sendLoginMail = require("../helpers/sendLoginMail");
const firstLetter = require("../helpers/firstLetter");
const calculateCommission = require("../helpers/calculateCommission");



//progress_payments
// hakediş durumu güncelleme
exports.put_progress_payment = async (req,res) =>{
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedPayment = await progress_payments.findByIdAndUpdate(id,{ status: status },{ new: true } );

    if (!updatedPayment) {
        return res.status(404).json({ success: false, error: 'Ödeme bulunamadı' });
    }

    res.json({ success: true, progressPayment: updatedPayment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Sunucu hatası' });
  }
}

exports.get_progress_payments = async (req,res) => {
  const {startDate, endDate,status,query} = req.query
  try{
    const dealerFilter = {};
    
    if(status){
      dealerFilter.status = status
    }
    if (query) {
      dealerFilter.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
      ];
    }

    const dealers = await Dealers.find(dealerFilter).select('_id');
    const dealerIds = dealers.map(dealer => dealer._id);

    const paymentFilter = {};
    if (startDate && endDate) {
      paymentFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999),
      };
    }
    if(status){
      paymentFilter.status = status
    }
    if (dealerIds.length > 0) {
      paymentFilter.dealerId = { $in: dealerIds };
    }

    const progressPayments = await progress_payments.find(paymentFilter).sort({_id:-1}).populate('dealerId');

    const totalprogressPayments = progressPayments.reduce((total,payment)=>{
      return total + payment.payment
    },0)

    const unpaidPayment = progressPayments.filter(payment => payment.status === false) .reduce((total, payment) => {
      return total + payment.payment; 
    }, 0);

    const completedPayment = progressPayments.filter(payment => payment.status === true) .reduce((total, payment) => {
      return total + payment.payment; 
    }, 0);

    if(query){
      return res.json({progressPayments})
    }
    res.render("admin/progress_payments/progress_payments",{
      title:"Bayi Hakedişler",
      progressPayments,
      totalprogressPayments,
      unpaidPayment,
      completedPayment
    })
  }catch(err){
    console.log(err)
  }
}

//customers
exports.post_customer_create = async (req,res) => {
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
      tcVkn,
      organization: firstLetter(organization),
      customerCode: `CSR-${shortid.generate()}`,
      addedBy: addedBy
    });
    await customer.save();
    res.redirect("/admin/customers");
  }catch(err){
    console.log(err);
  }
}

exports.get_customer_create = async (req,res) => {
  try{
    const dealers = await Dealers.find();
    res.render("admin/customers/customer-create",{
      title: "Müşteri Ekle",
      dealers
    });
  }catch(err){
    console.log(err)
  }
}

exports.get_customers = async (req,res) =>{
  const {page = 1,query} = req.query
  const perPage = 10;
  try{
    let filter = {};
    let dealerIds = [];

    if (query) {
      if (typeof query === 'string' && query.trim() !== '') {
        const dealers = await Dealers.find({
          firstName: { $regex: query, $options: 'i' }
        }, '_id'); 

        dealerIds = dealers.map(dealer => dealer._id);

        filter = {
          $or: [
            { customerCode: { $regex: query, $options: 'i' } },
            { firstName: { $regex: query, $options: 'i' } },
            { lastName: { $regex: query, $options: 'i' } },
            { phone: { $regex: query, $options: 'i' } },
            { organization: { $regex: query, $options: 'i' } },
            ...(dealerIds.length > 0 ? [{ addedBy: { $in: dealerIds } }] : [])
          ]
        };
      }
    }
    const totalCustomers = await Customers.countDocuments(filter);
    const totalPages = Math.ceil(totalCustomers / perPage);
    
    const customers = await Customers.find(filter).sort({_id:-1}).populate("addedBy").skip((page - 1) * perPage).limit(perPage);
    if(query){
      return res.json({ customers });
    }
    res.render("admin/customers/customers",{
      title:"Müşteri Listesi",
      customers,
      currentPage: parseInt(page),
      totalPages,
    })
  }catch(err){
    console.log(err)
  }
}

//documents
exports.post_document_add = async (req, res) => {
  const dealerId = req.params.dealerId;
  const { name,documentDate } = req.body;
  try {
    const fileUrl = req.file.path;
    const documents = new Documents({
      name:name,
      dealerId:dealerId,
      url:fileUrl,
      documentDate: documentDate
    });
    await documents.save();

    res.redirect(`/admin/dealer/documents/${dealerId}`);
  } catch (err) {
    console.log(err);
  }
};
exports.get_document_add = async(req,res) => {
  const dealerId = req.params.dealerId;
  try{
    const dealer = await Dealers.findById(dealerId)
    res.render("admin/dealers/dealer-document-create",{
      title:"Belge Ekle",
      dealer
    })
  }catch(err){
    console.log(err)
  }
}
exports.get_documents = async (req,res) => {
  const dealerId = req.params.dealerId;
  const {page = 1} = req.query
  const perPage = 10;
  try{
    const dealer = await Dealers.findById(dealerId)
    const totalDocuments = await Documents.countDocuments();
    const totalPages = Math.ceil(totalDocuments / perPage);
    
    const documents = await Documents.find({dealerId:dealerId}).skip((page - 1) * perPage).limit(perPage);
    res.render("admin/dealers/dealer-documents",{
      title:"Evraklar",
      documents,
      currentPage: parseInt(page),
      totalPages,
      dealer
    })
  }catch(err){
    console.log(err)
  }
}
//purchases
exports.post_purchase_create = async (req,res) => {
  const {dealerSelect,customerSelect,productSelect,purchaseDate,price,piece,integrator,giftRate,giftPiece} = req.body;
  let parsedPrice = parseFloat(price);
  let parsedPiece = parseInt(piece);
  // const totalPrice = parsedPiece ? (parsedPrice * parsedPiece) : parsedPrice;
  const totalPrice = parsedPrice;
  const isGift = (giftRate && giftRate.trim() !== '') || (giftPiece && giftPiece.trim() !== '') ? true : false;
  try{
    const product = await Products.findById(productSelect).populate("type")
    const purchase = new Purchases({
      name:product.name,
      price: totalPrice,
      purchaseCode: `PRC-${shortid.generate()}`,
      purchaseDate: purchaseDate,
      dealerId:dealerSelect,
      customer:customerSelect,
      type: product.type.name,
      integrationName:integrator ? integrator: null,
      isGift:isGift ? isGift:null,
      giftRate:giftRate ? giftRate : null,
      giftPiece:giftPiece ? giftPiece : null,
      paymentStatus:null
    });
    await purchase.save();
    res.redirect("/admin/purchases");
  }catch(err){
    console.log(err);
  }
}

exports.get_purchase_customer_api = async (req, res) => {
  try {
      const dealerId = req.params.dealerId;
      const customers = await Customers.find({ addedBy: dealerId }); 
      res.json(customers); 
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
  }
}

exports.get_purchase_create = async (req,res) => {
  try{
    const integrators = await Integrator.find();
    const products = await Products.find().populate("type");
    const dealers = await Dealers.find();

    res.render("admin/purchases/purchase-create",{
      title:"Sipariş Oluştur",
      products:products,
      dealers,
      integrators
    })
  }catch(err){
    console.log(err)
  }
}

exports.post_purchase_update = async (req,res) => {
  const purchaseCode = req.params.purchaseCode;
  const {status,paymentStatus} = req.body;
  try{
    await Purchases.findOneAndUpdate({purchaseCode:purchaseCode},{
      status:status,
      paymentStatus: paymentStatus == "" ? null : paymentStatus
    });
    res.redirect("/admin/purchases")
  }catch(err){
    console.log(err)
  }
}

exports.get_purchases = async (req,res) => {
  const {page = 1,startDate,endDate, query} = req.query
  const perPage = 10;
  try{
    const filter = query ? {$or: [{ purchaseCode: { $regex: query, $options: 'i' } },]} : {};
    
    if (startDate && endDate) {
      filter.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999)
      };
    }
    
  
    const totalPurchases = await Purchases.countDocuments(filter);
    const totalPages = Math.ceil(totalPurchases / perPage);

    const purchases = await Purchases.find(filter).sort({_id:-1}).populate({path:"customer",populate:{path:"addedBy",model:"dealer_dealers"}}).skip((page - 1) * perPage).limit(perPage);

    const links = await payment_links.find(); 
    const paymentTransactions = await payment_transactions.find();
    if (query) {
      return res.json({ purchases ,links});
    }
    res.render("admin/purchases/purchases",{
      title:"Satışlar",
      purchases,
      currentPage: parseInt(page),  
      totalPages,
      links,
      paymentTransactions,
    })
  }catch(err){
    console.log(err)
  }
}

//Product
exports.post_product_edit = async (req,res) =>{
  const productCode = req.params.productCode;
  const {name,price,type} = req.body;
  let errors = [];
  if (!name || name.trim() === '') {
    errors.push({ msg: 'Ürün Adı boş bırakılamaz' });
  }
  if (!price || isNaN(price) || price < 0) {
    errors.push({ msg: 'Ürün fiyatı boş bırakılamaz ve 0 dan büyük olmalıdır' });
  }

  if (errors.length > 0) {
    return res.status(400).render('admin/products/product-edit', {
      title: 'Ürün Ekle',
      errors: errors,
      data: {name, price}
    });
  }
  try{
    await Products.findOneAndUpdate({productCode:productCode},{
      name: firstLetter(name),
      price:price,
      type
    })
    res.redirect(`/admin/products`)
  }catch(err){
    console.log(err)
  }
}
exports.get_product_edit = async (req,res) =>{
  const productCode = req.params.productCode;
  try{
    const product = await Products.findOne({productCode:productCode}).populate("type");
    const product_types = await Product_types.find();

    res.render("admin/products/product-edit",{
      title:"Ürün Güncelle",
      product:product,
      product_types
    })
  }catch(err){
    console.log(err)
  }
}
exports.post_product_create = async (req,res) =>{
  const {name,price,type} = req.body;
  let errors = [];

  if (!name || name.trim() === '') {
    errors.push({ msg: 'Ürün Adı boş bırakılamaz' });
  }
  if (!price || isNaN(price) || price < 0) {
    errors.push({ msg: 'Ürün fiyatı boş bırakılamaz ve 0 dan büyük olmalıdır' });
  }

  if (errors.length > 0) {
    return res.status(400).render('admin/products/product-create', {
      title: 'Ürün Ekle',
      errors: errors,
      data: {name, price}
    });
  }
  try {
    const product = new Products({
      name:firstLetter(name),
      price:price,
      productCode: `PRD-${shortid.generate()}`,
      type:type
    });

    await product.save();
    res.redirect("/admin/products");
  }catch(err){
    console.log(err);
  }
}
exports.get_product_create = async (req,res) =>{
  try{
    const product_types = await Product_types.find();
    res.render("admin/products/product-create",{
      title:"Ürün Ekle",
      product_types
    });
  }catch(err){
    console.log(err)
  }
}
exports.get_products = async (req,res) =>{
  const{ page = 1} = req.query;
  const perPage = 10;
  try{

    const totalProducts = await Products.countDocuments();
    const totalPages = Math.ceil(totalProducts / perPage);

    const products = await Products.find().sort({_id:-1}).populate("type").skip((page - 1) * perPage).limit(perPage);
    res.render("admin/products/products",{
      title:"Ürün Listesi",
      products:products,
      currentPage: parseInt(page),
      totalPages
    })
  }catch(err){
    console.log(err)
  }
}


//dealer-edit
exports.post_dealer_edit = async (req, res) => {
  const dealerCode = req.params.dealerCode;
  const dealer = await Dealers.findOne({dealerCode:dealerCode})
  const { firstName, lastName, phone, email, smmRoom, smmRoomNumber, dealerCommission, subDealerCommission, referenceBy,status,statusDescription, isContract,vkn,tsicilNo } = req.body;


  try {
    const roles = [];
    let bayiRole = await Roles.findOne({ name: 'dealer' });
    if (!bayiRole) {
      bayiRole = new Roles({ name: 'dealer' });
      await bayiRole.save();
    }
    roles.push(bayiRole._id);

    let altBayiRole = await Roles.findOne({ name: 'subDealer' });
    if (!altBayiRole) {
      altBayiRole = new Roles({ name: 'subDealer' });
      await altBayiRole.save();
    }

    if (referenceBy && referenceBy.trim() !== '') {
      roles.push(altBayiRole._id);
    }


    await Dealers.findOneAndUpdate(
      { dealerCode: dealerCode },
      {
        firstName: firstLetter(firstName),
        lastName: firstLetter(lastName),
        phone,
        email,
        smmRoom: firstLetter(smmRoom),
        smmRoomNumber,
        dealerCommission,
        subDealerCommission,
        status,
        statusDescription: status == "true" ? "Aktif" : statusDescription,
        referenceBy: referenceBy && referenceBy.trim() !== '' ? referenceBy : null,
        roles: roles,
        vkn,
        tsicilNo,
        isContract:isContract === "on" ? true : false,
        deactivatedAt: status == "false" && status != dealer.status.toString() ? new Date() : dealer.deactivatedAt,
        activatedAt: status == "true" && status != dealer.status.toString() ? new Date() : dealer.activatedAt
      }
    );
    res.redirect(`/admin/dealer/details/${dealerCode}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Sunucu Hatası");
  }
};
exports.get_dealer_edit = async (req,res) =>{
  const dealerCode = req.params.dealerCode;
  try{
    const dealers = await Dealers.find({dealerCode : {$ne:dealerCode}})
    const dealer = await Dealers.findOne({dealerCode:dealerCode}).populate("referenceBy")
    res.render("admin/dealers/dealer-edit",{
      title:"Bayi Düzenle",
      dealer:dealer,
      dealers:dealers,
    })
  }catch(err){
    console.log(err)
  }
}
//dealer-details
exports.get_dealer_details = async (req,res) =>{
  const dealerCode = req.params.dealerCode;
  const { startDate, endDate, page = 1 } = req.query;
  const perPage = 10;
  try{
    const dealer = await Dealers.findOne({dealerCode:dealerCode}).populate("roles").populate("referenceBy");

    //hakediş hesaplama
    const {totalCommission, totalSubCommission,monthlyTotal,monthlySubTotal } = await calculateCommission(dealer,startDate,endDate);


    const filtredPayment= {dealerId:dealer._id,paymentStatus:"Success"};
    
    if (startDate && endDate) {
      filtredPayment.purchaseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate).setHours(23, 59, 59, 999)
      };
    }

   
    const totalPaymentTransactions = await Purchases.countDocuments(filtredPayment);
    const totalPages = Math.ceil(totalPaymentTransactions / perPage);

    const purchases = await Purchases.find(filtredPayment).sort({_id:-1}).skip((page - 1) * perPage).limit(perPage).populate("customer");
    res.render("admin/dealers/dealer-details",{
      title: `${dealer.firstName + " " + dealer.lastName} || Detay`,
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
    })
  }catch(err){
    console.log(err)
  }
}

//dealer-create
exports.post_dealer_create = async (req,res) =>{
  const {firstName,lastName,phone,email,smmRoom,smmRoomNumber,dealerCommission,subDealerCommission,referenceBy,vkn,tsicilNo} = req.body;
  let errors = [];
  const dealers = await Dealers.find();

  if (!firstName || firstName.trim() === '') {
    errors.push({ msg: 'Ad boş bırakılamaz' });
  }
  if (!lastName || lastName.trim() === '') {
    errors.push({ msg: 'Soyad boş bırakılamaz' });
  }
  if (!phone || phone.trim() === '') {
    errors.push({ msg: 'Telefon boş bırakılamaz' });
  }
  if (!email || email.trim() === '') {
    errors.push({ msg: 'E-Posta boş bırakılamaz' });
  }
 
  if (!dealerCommission || isNaN(dealerCommission) || dealerCommission < 0 || dealerCommission > 100) {
    errors.push({ msg: 'Bayi Komisyonu 0 ile 100 arasında olmalıdır' });
  }
  if (!subDealerCommission || isNaN(subDealerCommission) || subDealerCommission < 0 || subDealerCommission > 100) {
    errors.push({ msg: 'Alt Bayi Komisyonu 0 ile 100 arasında olmalıdır' });
  }

  if (errors.length > 0) {
    return res.status(400).render('admin/dealers/dealer-create', {
      title: 'Bayi Kayıt Formu',
      errors: errors,
      data: { firstName, lastName, phone, email, dealerCommission, subDealerCommission,vkn },
      dealers:dealers
    });
  }

  try {
    const existingDealer = await Dealers.findOne({ email });
    const existingDealerVkn = await Dealers.findOne({ vkn });
    const existingUser = await Users.findOne({email})
    
    if (existingDealer || existingUser || existingDealerVkn) {
      errors.push({ msg: 'Bu e-posta adresine veya vergi kimlik numarasına sahip bir kayıt zaten mevcut' });
      return res.status(400).render('admin/dealers/dealer-create', {
        title: 'Bayi Kayıt Formu',
        errors: errors,
        data: { firstName, lastName, phone, email, dealerCommission, subDealerCommission, vkn },
        dealers:dealers
      });
    }
    
    const roles = [];
    let bayiRole = await Roles.findOne({ name: 'dealer' });
    if (!bayiRole) {
      bayiRole = new Roles({ name: 'dealer' });
      await bayiRole.save();
    }
    roles.push(bayiRole._id);

    let altBayiRole = await Roles.findOne({ name: 'subDealer' });
    if (!altBayiRole) {
      altBayiRole = new Roles({ name: 'subDealer' });
      await altBayiRole.save();
    }
    
    if (referenceBy && referenceBy.trim() !== '') {
      roles.push(altBayiRole._id);
    }

    const password = shortid.generate()
    const dealer = new Dealers({
      firstName:firstLetter(firstName),
      lastName:firstLetter(lastName),
      phone,
      email,
      vkn,
      tsicilNo,
      smmRoom:firstLetter(smmRoom),
      smmRoomNumber,
      dealerCommission,
      subDealerCommission,
      referenceBy: referenceBy && referenceBy.trim() !== '' ? referenceBy : null,
      dealerCode: `DLR-${shortid.generate()}`,
      password: await bcrypt.hash(password,10),
      roles: roles,
      activatedAt: new Date()
    });

    await dealer.save();
    const  subject = "Bayi Kaydınız Başarılı"
    const text = `Merhaba ${firstLetter(firstName) + " " + firstLetter(lastName)},\n\nBayi kaydınız başarılı bir şekilde tamamlanmıştır.\nKullanıcı Adı: ${email}\nŞifre: ${password}\n\nAşağıdaki linkten giriş yapabilirsiniz.\n << Buraya Link Ekleyebilirsiniz>>`;
    sendLoginMail(email,subject,text)
    res.redirect("/admin/dealers");
  }catch(err){
    console.log(err);
  }
}
exports.get_dealer_create = async (req,res) =>{
  try{
    const dealers = await Dealers.find();
    res.render("admin/dealers/dealer-create",{
      title:"Bayi Kayıt Formu",
      dealers:dealers
    });
  }catch(err){
    console.log(err)
  }
  
}

exports.get_dealers = async (req,res) =>{
  const {page = 1,query} = req.query;
  const perPage = 10;

  try {
    const filter = query ? {
      $or: [
        { dealerCode: { $regex: query, $options: 'i' } },
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    } : {};
  
    const totalDealers = await Dealers.countDocuments(filter);
    const totalPages = Math.ceil(totalDealers / perPage);

    const dealers = await Dealers.find(filter).sort({_id:-1}).skip((page - 1) * perPage).limit(perPage)
    if (query) {
      return res.json({ dealers });
    }
    res.render("admin/dealers/dealers", {
      title: "Bayi Listesi",
      dealers: dealers,
      currentPage: parseInt(page),
      totalPages
    });
  } catch (err) {
    console.log(err);
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
    return res.status(400).render('/admin/index', {
      title: 'Şifre Güncelle',
      errors: errors,
    });
  }

  try{
    const user = await Users.findById(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      errors.push({ msg: 'Mevcut şifre yanlış' });
      return res.status(400).render('admin/index', {
        title: 'Şifre Güncelle',
        errors: errors,
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.redirect("/admin/index")
  }catch(err){
    console.log(err)
  }
}

exports.get_password_change = (req,res) =>{
  res.render("users/profile/password-change",{
    title:"Şifre Güncelle"
  })
}

exports.get_index = async (req, res) => {
  const userId = req.user.userId;
  try {
    const user = await Users.findById(userId).populate("roles");
    const dealerCount = await Dealers.countDocuments()
    const customerCount = await Customers.countDocuments()
    const progressPayments = await progress_payments.find()

    const totalProgressPayments = progressPayments.reduce((total,payment)=>{
      return total + payment.payment
    },0)

    const unpaidPayment = progressPayments.filter(payment => payment.status === false) .reduce((total, payment) => {
      return total + payment.payment; 
    }, 0);

    const completedPayment = progressPayments.filter(payment => payment.status === true) .reduce((total, payment) => {
      return total + payment.payment; 
    }, 0);
    res.render("admin/index", {
      title: `${user.firstName} || ${user.roles[0].name}`,
      user: user,
      dealerCount,
      customerCount,
      totalProgressPayments,
      unpaidPayment,
      completedPayment
    });
  } catch (err) {
    console.log(err);
  }
};
