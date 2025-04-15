
const db = require('../db');

exports.createCategory = async (name) => {
  try {
    const result = await db.query(`
            INSERT INTO categories (id, name)
            VALUES (gen_random_uuid(), $1) RETURNING *;
        `, [name]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

exports.getCategoryByName = async (name) => {
  try{
    const result = await db.query("SELECT * FROM categories WHERE name = $1", [name]);
    return result.rows[0]; // ✅ 回傳分類
  } catch (error) {
    throw error;
  }
};


exports.getAllCategories = async () => {
  try {
    const result = await db.query(`SELECT * FROM categories ORDER BY name ASC;`);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

exports.deleteCategory = async (id) => {
  try {
    await db.query(`DELETE FROM categories WHERE id = $1;`, [id]);
  } catch (error) {
    throw error;
  }
};
