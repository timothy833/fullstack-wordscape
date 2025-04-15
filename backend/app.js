// 1. 載入環境變數（從專案根目錄的 .env 檔案讀取）
require('dotenv').config();
console.log('Environment Variables:', process.env);

// 2. 載入 Express 與其他必要模組
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./initDb'); // 正確匯入資料庫初始化函數
const rateLimit = require("express-rate-limit"); //限制請求次數

//3.建立Express應用
const app = express();

// ✅ 設定信任代理，避免 `express-rate-limit` IP 錯誤
app.set('trust proxy', 1);

// ✅ 印出請求 IP 來檢查
app.use((req, res, next) => {
  console.log("IP:", req.ip);
  console.log("X-Forwarded-For:", req.headers["x-forwarded-for"]);
  next();
});


// ✅ 忽略 `/favicon.ico`，避免 400 錯誤
app.get("/favicon.ico", (req, res) => res.status(204).end());


//4. 設置內建中間件:使用Express 內建中間件
// 解析 JSON 格式的請求主體，並設定請求體大小限制
// 解析 JSON 格式的請求主體
app.use(express.json({ limit: "100mb" }));
// 解析 URL-encoded 格式的資料（表單提交）
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

//5. 設定CORS 中間件，允許來自指令來源的請求 CLIENT_ORIGIN=https://your-frontend-url.com

app.use(cors({
  origin: process.env.CLIENT_ORIGIN, // 根據前端網址進行調整process.env.// 解析 JSON 格式的請求主體，並設定請求體大小限制
  credentials: false, // 如果需要傳遞 Cookie 或身份驗證資訊 ✅ 關閉 credentials（不再讓瀏覽器自動攜帶 Cookie）
  maxAge: 86400,// ✅ CORS 設定快取 1 天
  allowedHeaders: ["Content-Type", "Authorization"],  // ✅ 允許這些標頭
  methods: ["GET", "POST", "PUT", "DELETE","PATCH" ,"OPTIONS"]
}));

app.options("*", cors()); // ✅ 允許所有路由的 OPTIONS 預檢請求

// 6. 日誌中間件：每次請求時輸出請求方法與路由
//日誌中間件：紀錄每次請求的HTTP 方法與路由
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


// ✅ 限制所有 API（15 分鐘最多 100 次請求）
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 500,
  message: { error: "請求過於頻繁，請稍後再試" },
  keyGenerator: (req) => req.ip, // ✅ 依據 IP 限制
});
app.use("/api", globalLimiter);

// ✅ 限制 `/api/proxy/image`（5 分鐘最多 30 次請求）
const imageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分鐘
  max: 30,
  message: { error: "圖片 API 請求過於頻繁，請稍後再試" },
  keyGenerator: (req) => req.ip, // ✅ 依據 IP 限制
});
app.use("/api/proxyImage", imageLimiter);

const proxyImageRoutes = require('./routes/proxyImageRoutes');
app.use("/api/proxyImage", proxyImageRoutes);




// 7. 載入各個路由模組
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const tagRoutes = require('./routes/tagRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
// const postTagRoutes = require('./routes/postTagRoutes');


app.use((req, res, next) => {
  console.log(`🌍 [${req.method}] ${req.url} - IP: ${req.ip}`);
  console.log("🔍 Headers:", req.headers);
  console.log("🔹 Body:", req.body);
  next();
});


// 8. 設定 API 路由（路徑可依需求自行調整）
// 如：當請求以 /api/users 開頭時，交由 userRoutes 處理
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/banners', bannerRoutes);
// app.use('/api/post-tags', postTagRoutes);

// 9. 測試路由：確認伺服器是否運作正常
app.get('/', (req, res) => {
  res.send('Express.js Server is running.');
});

// 健康檢查專用 — 給監控機器看的
app.get('/ping',(req, res)=> {
  res.status(200).json({
    message: 'pong',
    timestamp: new Date(),
    uptime:process.uptime().toFixed(2) + 'seconds',
  });
});


// 12. 全域錯誤處理中間件
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(err.status || 500).json({
      status: "error",
      message: err.message || "伺服器錯誤，請稍後再試"
  });
});

// 10. 啟動伺服器，並在啟動後初始化資料庫 
//取得環境變數中的 PORT 設定，若未定義則預設為 5000
const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // 初始化資料庫
    await initializeDatabase();
    console.log('Database initialization complete.');

    // 啟動 Express 伺服器
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1); // 發生錯誤時終止應用程式
  }
}

// 11. 執行伺服器啟動
startServer();