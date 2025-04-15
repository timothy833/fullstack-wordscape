const { ssl, connectionString } = require('pg/lib/defaults');

require('dotenv').config();

module.exports = {
    development: {
        client: 'pg', // 使用 PostgreSQL
        connection: {
            connectionString: process.env.DATABASE_URL, // 從環境變數讀取連線字串
            ssl: false ,  // 開發環境不需要啟用 SSL 
        },
        migrations: {
            directory: './migrations'  // 指定 migration 檔案存放的資料夾
        },
        seeds: {
            directory: './seeds' // 指定種子檔案存放的資料夾（可選）
        }
    },
    production: {
        client: 'pg',
        connection: {
            connectionString: process.env.DATABASE_URL, // 從環境變數讀取連線字串
            ssl: {rejectUnauthorized: false },  // 啟用 SSL 但不驗證憑證
        },
        migrations: {
            directory: './migrations'
        },
        seeds: {
            directory: './migration'
        }
    }
}