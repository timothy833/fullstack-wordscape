
# 建立階段：安裝與打包前端
# 📌 `/app` 是容器內的工作資料夾，與你本機資料夾名稱無關。
# 📌 `/app/dist` 是 Vite 預設輸出的打包資料夾，不需修改除非你在 `vite.config.js` 裡改了 `outDir`。

# 建立階段：安裝與打包前端
FROM node:18 AS builder
WORKDIR /app

# ✅ 拷貝 .env 檔案進去容器（這裡是關鍵）
COPY .env .env

# ✅ 複製整個前端專案（含 package.json、src、vite.config.js 等）
COPY . .  

# ✅ 安裝依賴（會讀取 package.json）
RUN npm install

# ✅ 打包產出 dist/
RUN npm run build

# 部署階段：使用 Nginx serve提供靜態檔案

# 🚀 部署階段：使用 nginx 提供靜態資源服務
FROM nginx:alpine

# ✅ 將剛剛打包好的 dist 複製進 nginx 預設路徑
COPY --from=builder /app/dist /usr/share/nginx/html

# ✅ 開放 80 port（靜態網站使用）
EXPOSE 80

# ✅ 啟動 nginx（-g daemon off: 前景模式）
CMD ["nginx", "-g", "daemon off;"]


