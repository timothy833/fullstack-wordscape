const commentModel = require('../models/commentModel');
const postModel = require("../models/postModel"); // 引入文章 Model


exports.getAllComments = async (req, res) => {
  try {
    const comments = await commentModel.getAllComments();
    res.json({ status: "success", data: comments });
  } catch (error) {
    console.error("無法取得所有留言:", error);
    res.status(500).json({ status: "error", message: "無法取得所有留言" });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    if (!post_id) {
      return res.status(400).json({ status: "error", message: "缺少 post_id" });
    }

    const comments = await commentModel.getCommentsWithReplies(post_id.trim());
    res.json({ status: "success", data: comments });
  } catch (error) {
    console.error("無法取得留言:", error);
    res.status(500).json({ status: "error", message: "無法取得留言" });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { post_id, parent_comment_id, content } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    if (!post_id || !content) {
      return res.status(400).json({ status: "error", message: "缺少必要欄位" });
    }

    const newComment = await commentModel.createComment(post_id.trim(), parent_comment_id, user_id, content);

    res.status(201).json({ status: "success", data: newComment });
  } catch (error) {
    console.error("無法新增留言:", error);
    res.status(500).json({ status: "error", message: "無法新增留言" });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    if (!content) {
      return res.status(400).json({ status: "error", message: "請提供留言內容" });
    }

    const comment = await commentModel.getCommentById(id);
    if (!comment) {
      return res.status(404).json({ status: "error", message: "留言不存在" });
    }
    if (comment.user_id !== user_id) {
      return res.status(403).json({ status: "error", message: "無權修改該留言" });
    }

    const updatedComment = await commentModel.updateComment(id, content);
    res.json({ status: "success", data: updatedComment });
  } catch (error) {
    console.error("修改留言失敗:", error);
    res.status(500).json({ status: "error", message: "無法修改留言" });
  }
};



// 🔥 **刪除留言 API**
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params; // 取得要刪除的留言 ID
    const user_id = req.user?.id; // 取得當前登入使用者 ID

    if (!user_id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

      // 取得留言資訊
    const comment = await commentModel.getCommentById(id);
    if (!comment) {
      return res.status(404).json({ status: "error", message: "留言不存在" });
    } // ✅ 確保這裡結束，不會有無法執行的程式碼

    // 取得該留言所屬的文章
    const post = await postModel.getPostById(comment.post_id); 
    if (!post) {
      return res.status(404).json({ status: "error", message: "文章不存在" });
    }

       // ✅ 檢查權限：
    // 1. 如果 `user_id === post.user_id`（文章作者），允許刪除所有留言
    // 2. 如果 `user_id === comment.user_id`（留言發佈者），允許刪除該留言
    if (user_id === post.user_id || user_id === comment.user_id) {
        // 🔥 **直接刪除留言及所有回覆**
      await commentModel.deleteComment(id);

      return res.json({ status: "success", message: "留言已刪除" });
    } 

    return res.status(403).json({ status: "error", message: "無權刪除該留言" });
  
    // if (comment.user_id !== user_id) {
    //   return res.status(403).json({ status: "error", message: "無權刪除該留言" });
    // }

    // await commentModel.deleteComment(id);
    // res.json({ status: "success", message: "留言已刪除" });
  } catch (error) {
    console.error("刪除留言失敗:", error);
    res.status(500).json({ status: "error", message: "無法刪除留言" });
  }
};

exports.toggleCommentLike = async (req, res) => {
  try {
    const { comment_id } = req.params;
    const user_id = req.user?.id;

    if (!user_id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }
    if (!comment_id) {
      return res.status(400).json({ status: "error", message: "缺少 comment_id" });
    }

    console.log("🔹 按讚 / 取消按讚 comment_id:", comment_id, "user_id:", user_id);

    const result = await commentModel.toggleCommentLike(req.user.id, comment_id.trim());
    res.json({ status: "success", liked: result.liked });
  } catch (error) {
    console.error("按讚留言失敗:", error);
    res.status(500).json({ status: "error", message: "無法按讚留言" });
  }
};

exports.getCommentLikes = async (req, res) => {
  try {
    const { comment_id } = req.params;


    if (!comment_id) {
      return res.status(400).json({ status: "error", message: "缺少 comment_id" });
    }

    console.log("API 查詢的 comment_id:", comment_id);

    const likes = await commentModel.getCommentLikes(comment_id.trim());
    console.log("查詢結果:", likes);

    res.json({ status: "success", data: likes });
  } catch (error) {
    console.error("無法獲取留言按讚名單:", error);
    res.status(500).json({ status: "error", message: "無法獲取留言按讚名單" });
  }
};

