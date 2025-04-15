FROM node:18
WORKDIR /app
COPY package*.json ./

# ✅ 安裝時不要用 Mac 的 bcrypt，要在 Linux 環境裡重建
RUN npm install
COPY . .

# ✅ 如果你已經不小心 COPY 進來 Mac 的 bcrypt binary
# 可以加這行強制重建 native binary：
RUN npm rebuild bcrypt --build-from-source

EXPOSE 3000
CMD ["node", "app.js"]
