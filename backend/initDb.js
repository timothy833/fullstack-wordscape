const knex = require('knex');
const config = require('./knexfile'); // 讀取 knex 設定

//使用 knex(config[environment])
// 這樣 initDb.js 不會影響 你的 db.js，而是獨立用 knex 來執行 migrations。

// await knexInstance.destroy();
// 這確保 migrations 完成後關閉資料庫連線，避免資源浪費。

const environment = process.env.NODE_ENV || 'development';
const knexInstance = knex(config[environment]);

const initializeDatabase = async () => {
    try {
        await knexInstance.migrate.latest(); // 執行 migrations
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Error during database initialization:', error);
        process.exit(1);
    } finally {
        await knexInstance.destroy(); // 釋放連線
    }
};

// 匯出函數
module.exports = { initializeDatabase };