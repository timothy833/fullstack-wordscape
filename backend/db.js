// db.js
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === "production";  // ✅ 判斷是否在 Render
const useSSL = process.env.DATABASE_SSL === "true" || isProduction; // ✅ Render 強制啟用 SSL

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://myuser:password@localhost:5432/wordscape',
  ssl: useSSL ? { rejectUnauthorized: false } : false  // ✅ 依據環境變數決定是否啟用 SSL
});

// ✅ 更完整的方式來檢查 SSL 設定
console.log(`Database SSL Enabled: ${useSSL}`);

module.exports = {
  query: (text, params) => pool.query(text, params),
};