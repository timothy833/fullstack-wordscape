const subscriptionModel = require('../models/subscriptionModel');

exports.toggleSubscription = async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    if (req.user.id === user_id) {
      return res.status(400).json({ status: "error", message: "無法訂閱自己" });
    }

    const result = await subscriptionModel.toggleSubscription(req.user.id, user_id);
    res.json({ status: "success", subscribed: result.subscribed });
  } catch (error) {
    console.error("訂閱操作失敗:", error);
    res.status(500).json({ status: "error", message: "無法操作訂閱" });
  }
};

exports.getSubscriptions = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const subscriptions = await subscriptionModel.getSubscriptionsByUser(req.user.id);
    res.json({ status: "success", data: subscriptions });
  } catch (error) {
    console.error("無法獲取訂閱清單:", error);
    res.status(500).json({ status: "error", message: "無法獲取訂閱清單" });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const followers = await subscriptionModel.getFollowersByUser(req.user.id);
    res.json({ status: "success", data: followers });
  } catch (error) {
    console.error("無法獲取被訂閱清單:", error);
    res.status(500).json({ status: "error", message: "無法獲取被訂閱清單" });
  }
};
