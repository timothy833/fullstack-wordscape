const db = require('../db');

exports.getAllComments = async () => {
  const result = await db.query(`
        SELECT comments.*, 
               users.username AS user_name,
               users.profile_picture,
               (SELECT COUNT(DISTINCT comment_likes.user_id) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS likes_count
        FROM comments
        JOIN users ON comments.user_id = users.id
        ORDER BY comments.created_at DESC;
    `);
  return result.rows;
}

exports.getCommentsByPostId = async (post_id) => {
  const result = await db.query(`
    SELECT comments.*, 
           users.username AS user_name,
           users.profile_picture,
           (SELECT COUNT(DISTINCT comment_likes.user_id) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS likes_count
    FROM comments
    JOIN users ON comments.user_id = users.id
    WHERE comments.post_id = $1
    ORDER BY comments.created_at ASC;
`, [post_id]);
  return result.rows;
};

exports.getCommentById = async (id) => {
  try {
    const result = await db.query(`
          SELECT * FROM comments WHERE id = $1;
      `, [id]);

    return result.rows[0];
  } catch (error) {
    console.error("取得留言時發生錯誤:", error);
    throw error;
  }
};

exports.getCommentsWithReplies = async (post_id) => {
  try {
    const result = await db.query(`
          SELECT comments.*, users.username AS user_name,
          users.profile_picture,
           (SELECT COUNT(DISTINCT comment_likes.user_id) FROM comment_likes WHERE comment_likes.comment_id = comments.id) AS likes_count
          FROM comments
          JOIN users ON comments.user_id = users.id
          WHERE comments.post_id = $1
          ORDER BY comments.created_at ASC;
      `, [post_id]);

    const comments = result.rows;

    const commentMap = {};
    comments.forEach(comment => commentMap[comment.id] = { ...comment, replies: [] });

    const nestedComments = [];
    comments.forEach(comment => {
      if (comment.parent_comment_id) {
        commentMap[comment.parent_comment_id]?.replies.push(commentMap[comment.id]);
      } else {
        nestedComments.push(commentMap[comment.id]);
      }
    });

    return nestedComments;
  } catch (error) {
    console.error("無法取得留言:", error);
    throw error;
  }
};


exports.createComment = async (post_id, parent_comment_id, user_id, content) => {
  try {
    const result = await db.query(`
          INSERT INTO comments (post_id, parent_comment_id, user_id, content)
          VALUES ($1, $2, $3, $4) RETURNING *;
      `, [post_id, parent_comment_id, user_id, content]);

    return result.rows[0];
  } catch (error) {
    console.error("無法新增留言:", error);
    throw error;
  }
};

exports.updateComment = async (id, content) => {
  try {
    const result = await db.query(`
          UPDATE comments SET content = $1, updated_at = NOW()
          WHERE id = $2 RETURNING *;
      `, [content, id]);

    return result.rows[0];
  } catch (error) {
    console.error("無法修改留言:", error);
    throw error;
  }
};

exports.deleteComment = async (id) => {
  try {
    await db.query(`DELETE FROM comments WHERE id = $1`, [id]);
    console.log(`✅ 成功刪除留言 ${id} 及所有回覆`);
  } catch (error) {
    console.error(`❌ 刪除留言 ${id} 失敗`, error);
  }
  
};

exports.toggleCommentLike = async (user_id, comment_id) => {
  try {
    console.log("🔹 切換留言按讚: user_id:", user_id, "comment_id:", comment_id);

        // 檢查是否已經按讚
    const checkResult = await db.query(
      `SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2;`,
      [user_id, comment_id]
    );


    console.log("🔹 查詢按讚記錄:", checkResult.rows);

    if (checkResult.rows.length > 0) {
      console.log("🔹 取消按讚");

      await db.query(`DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2;`,
        [user_id, comment_id]);

      return { liked: false };
    } else {
      console.log("🔹 新增按讚");

      const insertResult = await db.query(
        `INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2) ON CONFLICT (user_id, comment_id) DO NOTHING RETURNING *;`,
        [user_id, comment_id]
      );

      if (insertResult.rowCount === 0) {
        console.log("❌ 按讚失敗，可能是 `ON CONFLICT` 問題");
        return { liked: false };
      }

      return { liked: true };
    }
  } catch (error) {
    console.error("❌ 按讚失敗:", error);
    throw error;
  }
};

exports.getCommentLikes = async (comment_id) => {
  try {
    console.log("查詢的 comment_id:", comment_id);

    const result = await db.query(`
      SELECT comment_likes.user_id, 
             COALESCE(users.username, '未知使用者') AS username 
      FROM comment_likes 
      LEFT JOIN users ON comment_likes.user_id = users.id
      WHERE comment_likes.comment_id = $1;
  `, [comment_id]);

  console.log("查詢結果:", result.rows);

    return result.rows;
  } catch (error) {
    console.error("❌ 獲取留言按讚失敗:", error);

    throw error;
  }
};