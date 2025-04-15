
# 建立階段：安裝與打包前端
# 📌 `/app` 是容器內的工作資料夾，與你本機資料夾名稱無關。
# 📌 `/app/dist` 是 Vite 預設輸出的打包資料夾，不需修改除非你在 `vite.config.js` 裡改了 `outDir`。

FROM node:18 AS builder
WORKDIR /app
COPY . .  
RUN npm install
RUN npm run build

# 部署階段：使用 Nginx serve提供靜態檔案
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


