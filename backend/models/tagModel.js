const db = require('../db');

exports.getAllTags = async () => {
  try {
    const result = await db.query(`SELECT * FROM tags ORDER BY name;`);
    return result.rows;
  } catch (error) {
    throw error;
  }
};


exports.createTag = async (name) => {
  try {
    const result = await db.query(`
            INSERT INTO tags (name) VALUES ($1) RETURNING id, name;
        `, [name]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

exports.deleteTag = async (tagId) => {
  try {
    // 先刪除關聯
    await db.query(`DELETE FROM post_tags WHERE tag_id = $1;`, [tagId]);

    // 再刪除標籤
    await db.query(`DELETE FROM tags WHERE id = $1;`, [tagId]);
  } catch (error) {
    throw error;
  }
};
