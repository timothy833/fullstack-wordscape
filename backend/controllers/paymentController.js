const paymentModel = require('../models/paymentModel');

// exports.createPayment = async (req, res) => {
//   try {
//     const { amount, status } = req.body;
//     if (!req.user || !req.user.id) {
//       return res.status(401).json({ status: "error", message: "未授權，請登入" });
//     }

//     const payment = await paymentModel.createPayment(req.user.id, amount, status);
//     res.status(201).json({ status: "success", data: payment });
//   } catch (error) {
//     res.status(500).json({ status: "error", message: "無法建立付款記錄" });
//   }
// };

// exports.getAllPayments = async (req, res) => {
//   try {
//     const payments = await paymentModel.getAllPayments();
//     res.json({ status: "success", data: payments });
//   } catch (error) {
//     res.status(500).json({ status: "error", message: "無法獲取付款記錄" });
//   }
// };

// exports.getPaymentsByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const payments = await paymentModel.getPaymentsByUser(userId);
//     res.json({ status: "success", data: payments });
//   } catch (error) {
//     res.status(500).json({ status: "error", message: "無法獲取使用者付款記錄" });
//   }
// };

exports.createPayment = async (req, res) => {
  try {
    const { amount, receiver_id } = req.body;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    if (!receiver_id || req.user.id === receiver_id) {
      return res.status(400).json({ status: "error", message: "收款人 ID 無效或不能付款給自己" });
    }

    const payment = await paymentModel.createPayment(req.user.id, receiver_id, amount);
    res.status(201).json({ status: "success", data: payment });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法建立付款記錄" });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const payments = await paymentModel.getAllPayments();
    res.json({ status: "success", data: payments });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法獲取付款記錄" });
  }
};

// 🔹 取得 **使用者付款的紀錄** (付款人)
exports.getPaymentsSent = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const payments = await paymentModel.getPaymentsSentByUser(req.user.id);
    res.json({ status: "success", data: payments });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法獲取付款記錄" });
  }
};

// 🔹 取得 **使用者收款的紀錄** (收款人)
exports.getPaymentsReceived = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const payments = await paymentModel.getPaymentsReceivedByUser(req.user.id);
    res.json({ status: "success", data: payments });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法獲取收款記錄" });
  }
};