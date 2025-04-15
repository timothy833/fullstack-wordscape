const tagModel = require('../models/tagModel');

exports.getTags = async (req, res) => {
  try {
    const tags = await tagModel.getAllTags();
    res.json({ status: "success", data: tags });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法取得標籤列表" });
  }
};


exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ status: "error", message: "請提供標籤名稱" });
    }

    const tag = await tagModel.createTag(name);
    res.status(201).json({ status: "success", data: tag });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法新增標籤" });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    await tagModel.deleteTag(id);
    res.json({ status: "success", message: "標籤已刪除" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法刪除標籤" });
  }
};
