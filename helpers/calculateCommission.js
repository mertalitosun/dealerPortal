const Dealers = require("../models/dealer_dealers");
const Customers = require("../models/dealer_customers");
const Purchases = require("../models/dealer_purchases");
const moment = require("moment")

module.exports = calculateCommission = async (dealer,startDate,endDate) => {
  const customers = await Customers.find({ addedBy: dealer._id });

  //müşteri idleri
  const customerIds = customers.map((customer) => customer._id);

  // const filtredPurchase = { customer: { $in: customerIds }, status:"Tamamlandı" };
    
  // if (startDate && endDate) {
  //   filtredPurchase.purchaseDate = {
  //     $gte: new Date(startDate),
  //     $lte: new Date(endDate).setHours(23, 59, 59, 999)
  //   };
  // }
  // const purchases = await Purchases.find(filtredPurchase);

  // //total hakediş (bayi)
  // const totalCommission = purchases.reduce((total, purchase) => {
  //   return (total += purchase.price * parseFloat(dealer.dealerCommission / 100));
  // }, 0);

  //alt bayi
  const subDealers = await Dealers.find({ referenceBy: dealer._id });
  const subDealerIds = subDealers.map((subDealer) => subDealer._id);

  // //alt bayi müşterileri
  // const subCustomers = await Customers.find({ addedBy: { $in: subDealerIds } });
  // const subCustomerIds = subCustomers.map((subCustomer) => subCustomer._id);

  // //alt bayi müşteri siparişleri
  // const subPurchases = await Purchases.find({
  //   customer: { $in: subCustomerIds}, status:"Tamamlandı"});

  // // total hakediş(alt bayi)
  // const totalSubCommission = subPurchases.reduce((total, purchase) => {
  //   return (total += purchase.price * parseFloat(dealer.subDealerCommission / 100));
  // }, 0);
  


  /* ------ payment-transactions ----- */

  //Geçtiğimiz ayın başlangıç-bitiş tarihi
  const today = moment();
  const startOfMonth = today.clone().subtract(1, 'months').startOf('month');
  const endOfMonth = today.clone().subtract(1, 'months').endOf('month');
  const monthlyStart = startOfMonth.format('YYYY-MM-DD');
  const monthlyEnd = endOfMonth.format('YYYY-MM-DD');
 

  // transaction-dealer
  const filteredPayment = {dealerId:dealer._id,paymentStatus:"Success"}
  

  const monthlyFiltered = {
    dealerId:dealer._id,
    paymentStatus:"Success",
    purchaseDate:{$gte: new Date(monthlyStart),$lte: new Date(monthlyEnd).setHours(23, 59, 59, 999)}
  }

  if (startDate && endDate) {
    filteredPayment.purchaseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999)
    };
  }

  const successPayments = await Purchases.find(filteredPayment);
  const totalCommissionpt = successPayments.reduce((total, payment)=>{
    return (total += payment.price * parseFloat(dealer.dealerCommission / 100))
  },0)


  //monthly
  const monthlyPayment = await Purchases.find(monthlyFiltered)
  const monthlytotal = monthlyPayment.reduce((total, payment)=>{
    return (total += payment.price * parseFloat(dealer.dealerCommission / 100))
  },0)


  // transaction-subDealer
  const filteredSubPayment = {dealerId:{ $in: subDealerIds },paymentStatus:"Success"}

  const monthlySubFiltered = {
    dealerId:{ $in: subDealerIds},
    paymentStatus:"Success",
    purchaseDate:{$gte: new Date(monthlyStart),$lte: new Date(monthlyEnd).setHours(23, 59, 59, 999)}
  }

  if (startDate && endDate) {
    filteredSubPayment.purchaseDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate).setHours(23, 59, 59, 999)
    };
  }

  const subSuccessPayments = await Purchases.find(filteredSubPayment);
  const totalSubCommissionpt = subSuccessPayments.reduce((total, payment)=>{
    return (total += payment.price * parseFloat(dealer.subDealerCommission / 100))
  },0)

  //monthly
  const monthlySubPayment = await Purchases.find(monthlySubFiltered);
  const monthlySubTotal = monthlySubPayment.reduce((total, payment)=>{
    return (total += payment.price * parseFloat(dealer.subDealerCommission / 100))
  },0)

  return {
    dealer,
    customers,
    totalCommission:totalCommissionpt.toFixed(2),
    totalSubCommission:totalSubCommissionpt.toFixed(2),
    monthlyTotal:monthlytotal.toFixed(2),
    monthlySubTotal:monthlySubTotal.toFixed(2),
  };
};
