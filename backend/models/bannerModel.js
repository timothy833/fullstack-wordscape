const pool = require('../db');



// 取得某個使用者的 Banner
exports.getBannerByUserId = async (user_id) => {
    const result = await pool.query('SELECT * FROM banners WHERE user_id = $1', [user_id]);
    return result.rows[0]; // 每個使用者應該只有一個 Banner
};


// 建立 Banner
exports.createBanner = async (user_id, title, subtitle, image_url) => {
    const result = await pool.query(
        `INSERT INTO banners (user_id, title, subtitle, image_url) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [user_id, title, subtitle, image_url]
    );
    return result.rows[0];
};


// 更新 Banner
exports.updateBanner = async (user_id, title, subtitle, image_url) => {
    const result = await pool.query(
        `UPDATE banners 
         SET title = $1, subtitle = $2, image_url = $3, updated_at = NOW() 
         WHERE user_id = $4 RETURNING *`,
        [title, subtitle, image_url, user_id]
    );
    return result.rows[0];
};



// 刪除 Banner
exports.deleteBanner = async (user_id) => {
    const result = await pool.query(
        'DELETE FROM banners WHERE user_id = $1 RETURNING *',
        [user_id]
    );
    return result.rows[0];
};