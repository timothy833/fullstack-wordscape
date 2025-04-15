# 🚀 建立環境
FROM node:18
WORKDIR /app

# ✅ 快取優化：先拷貝 package.json 和 lock 檔以利 npm install 快取層
COPY package*.json ./

# ✅  ✅ 安裝依賴（不建議帶入本地 node_modules） 安裝時不要用 Mac 的 bcrypt，要在 Linux 環境裡重建
RUN npm install

# ✅ 再拷貝剩下程式碼（避免因程式碼更動而觸發 npm install 重跑）
COPY . .

# ✅ 修復 Mac 安裝 bcrypt binary 的問題（非必要但建議加）
# ✅ 如果你已經不小心 COPY 進來 Mac 的 bcrypt binary
# 可以加這行強制重建 native binary：
RUN npm rebuild bcrypt --build-from-source

EXPOSE 3000
CMD ["node", "app.js"]
