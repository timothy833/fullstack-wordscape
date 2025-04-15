const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config(); // 確保能讀取環境變數

//設定 Cloudflare R2連線
const s3 = new S3Client({
    region: "auto", // Cloudflare R2 不需要設定特定區域
    endpoint: process.env.R2_ENDPOINT, // Cloudflare R2 API 端點
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY,
      secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

module.exports = { s3 }; // ✅ 確保這裡是 `module.exports = { s3 }`
