const db = require('../db');
const bcrypt = require('bcrypt'); //用於密碼加密


// 取得所有使用者
exports.getAllUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows;
};

// 透過 ID 取得使用者
exports.getUserById = async (id) => {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
};


// 透過 Email 取得使用者
exports.getUserByEmail = async (email) => {
  const result = await db.query(`
        SELECT * FROM users WHERE email = $1
    `, [email]);
  return result.rows[0];
}

// 創建新使用者
exports.createUser = async (user) => {
  try {
    const { username, email, password, bio, profile_picture, phone, gender, birthday } = user;
    // 檢查是否缺少必要欄位
    let missingFields = [];
    if (!username) missingFields.push("username");
    if (!email) missingFields.push("email");
    if (!password) missingFields.push("password");

    // ✅ `bio` 和 `profile_picture` 可以為空，不應該影響檢查
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
    //將密碼加密
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(`
           INSERT INTO users(username, email, password, bio, profile_picture, phone, gender, birthday)
           VALUES ($1, $2, $3, $4, $5,$6,$7,$8) RETURNING * `,
      [username, email, hashedPassword, bio || '', profile_picture || '', phone || null, gender || "其他", birthday || null]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Error creating user:", error);
    throw error; // 讓 `register` 方法處理錯誤
  }

}

// 更新使用者資訊（支援更改密碼）
exports.updateUser = async (id, updateFields) => {
  try {

    // ✅ 檢查 updateFields 是否為空
    if (!id || Object.keys(updateFields).length === 0) {
      throw new Error("❌ 無效的更新請求，請提供至少一個欄位更新");
    }
  
    const keys = Object.keys(updateFields);
    const values = Object.values(updateFields);

    // ✅ 構造 SQL 語句
    let setQuery = keys.map((key, index) => `${key} = $${index + 1}`).join(", ");

    const query = `
            UPDATE users SET ${setQuery}
            WHERE id = $${keys.length + 1}
            RETURNING id, username, email, bio, profile_picture, phone, gender, birthday;
        `;

    values.push(id);
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("User not found");
    }
    return result.rows[0]; // ✅ 回傳更新後的使用者資訊
  } catch (error) {
    console.error("Error updating user:", error);
    throw error; // 讓上層函式（如 `controller`）處理錯誤
  }

};

// 更新使用者密碼
exports.updateUserPassword = async (id, hashedPassword) => {
  try {
    const result = await db.query(`UPDATE users SET password = $1 WHERE id = $2 RETURNING id, username, email;`, [hashedPassword, id]);
    if (result.rows.length === 0) {
      throw new Error("User not found");
    }
    return result.rows[0];
  } catch (error) {
    throw error;
  }
}

// 刪除使用者
exports.deleteUser = async (id) => {
  await db.query('DELETE FROM users WHERE id = $1', [id]);
};

