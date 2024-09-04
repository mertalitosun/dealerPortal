const Dealers = require("../models/dealer_dealers");
const payment_transactions = require("../models/dealer_payment_transactions");
const progress_payments = require("../models/dealer_progress_payments");
const Purchases = require("../models/dealer_purchases");
const moment = require("moment");

module.exports = calculate_progress_payment = async () => {
  try {

    const dealers = await Dealers.find();

   
    const today = moment();
    const startOfMonth = today.clone().subtract(1, 'months').startOf('month');
    const endOfMonth = today.clone().subtract(1, 'months').endOf('month');
    const monthlyStart = startOfMonth.toDate();
    const monthlyEnd = endOfMonth.endOf('day').toDate();

    for (const dealer of dealers) {
      
      const monthlyFiltered = {
        dealerId: dealer._id,
        paymentStatus: "Success",
        purchaseDate: { $gte: monthlyStart, $lte: monthlyEnd }
      };

    
      const monthlyPayment = await Purchases.find(monthlyFiltered);
      const monthlyTotal = monthlyPayment.reduce((total, payment) => {
        return total + (payment.price * parseFloat(dealer.dealerCommission / 100));
      }, 0);

      
      const subDealers = await Dealers.find({ referenceBy: dealer._id });
      const subDealerIds = subDealers.map((subDealer) => subDealer._id);

      const monthlySubFiltered = {
        dealerId: { $in: subDealerIds },
        paymentStatus: "Success",
        purchaseDate: { $gte: monthlyStart, $lte: monthlyEnd }
      };


      const monthlySubPayment = await Purchases.find(monthlySubFiltered);
      const monthlySubTotal = monthlySubPayment.reduce((total, payment) => {
        return total + (payment.price * parseFloat(dealer.subDealerCommission / 100));
      }, 0);

    
      const totalPayment = monthlyTotal + monthlySubTotal;
      const lastDayOfMonth = endOfMonth.toDate();
     

      
      const progressData = {
        dealerId: dealer._id,
        payment: totalPayment,
        date: lastDayOfMonth,
        status: false
      };

      await new progress_payments(progressData).save();
    }

    console.log("Hakedişler başarıyla hesaplandı ve kaydedildi.");
  } catch (error) {
    console.error("Hakediş hesaplama sırasında bir hata oluştu:", error);
  }
};
