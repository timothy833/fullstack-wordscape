const postModel = require('../models/postModel');
const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const path = require("path");
const { s3 } = require("../config-s3");
const  { deleteFromR2 } = require('./deleteImageController');
const cheerio = require('cheerio'); // 解析 HTML 內容中的 `<img>`
//設定 Cloudflare R2
// const s3 = new S3Client({
//   region: "auto", // Cloudflare R2 不需要設定特定區域
//   endpoint: process.env.R2_ENDPOINT, // Cloudflare R2 API 端點
//   credentials: {
//     accessKeyId: process.env.R2_ACCESS_KEY,
//     secretAccessKey: process.env.R2_SECRET_KEY,
//   },
// });



// **通用 R2 上傳函式（支援 Base64 & 檔案）**
const uploadToR2 = async (file, folder) => {
  try {
    let fileBuffer; // 先宣告變數
    let fileName;

    if (typeof file === "string" && file.startsWith("data:image")) {
      // Base64 圖片處理
      const base64Data = file.split(",")[1];
      fileBuffer = Buffer.from(base64Data, "base64");
      fileName = `${folder}/${Date.now()}.png`; // **確保唯一檔名**
    }
    else if (file.path) {
      //正常檔案上傳 ✅ 處理一般檔案上傳 避免 R2 亂碼
      fileBuffer = fs.readFileSync(file.path);
      let sanitizedFileName = file.originalname.normalize("NFC")
        .replace(/\s/g, "_")  // 空格轉 `_`
        .replace(/[^\w.-]/g, ""); // 過濾特殊字符
      fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;
    }
    else {
      throw new Error("無效的圖片格式");
    }

    // ✅ **確保 R2 存取 Key 也是編碼過的**
    // const encodedFileName = encodeURIComponent(fileName);

    //初始化  ✅ 設定上傳參數 **上傳到 R2**
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.mimetype || "image/png",
    }


    // ✅ 使用 `PutObjectCommand` ✅ 上傳到 R2
    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    console.log("✅ 圖片成功上傳到 R2");

    // 上傳成功後刪除本地檔案
    // ✅ 確保刪除本地檔案  
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("❌ 刪除本地檔案失敗:", err);
        else console.log("✅ 本地檔案刪除成功:", file.path);
      });
    }

    // **本地 vs 雲端 儲存不同 URL**
    const resultUrl = process.env.NODE_ENV === "development"
      ? await getSignedUrl(s3, new GetObjectCommand(uploadParams), { expiresIn: 604800 })
      : `${process.env.CDN_BASE_URL}/api/image?key=${encodeURIComponent(fileName)}`; // **確保 URL 解析  ✅ 修正 `resultUrl`，確保 `key` 被 `encodeURIComponent()`**

    console.log("📌 返回的圖片 URL:", resultUrl);
    return resultUrl;
  } catch (error) {
    console.error(`圖片上傳錯誤: ${error}`);
    throw new Error("圖片上傳失敗");
  }
}


// **批量處理圖片上傳**
const processBatchUpload = async (images, folder) => {
  const urls = [];

  for (const file of images) {
    if (typeof file === "string" && file.startsWith("http")) {
      urls.push(file);
    } else {
      const url = await uploadToR2(file, folder);
      urls.push(url);
    }
  }

  return urls;
};

// ✅ 使用 `Object.assign` 確保不覆蓋其他 exports
Object.assign(module.exports, {
  uploadToR2
});

// **封面圖片上傳 API**
exports.uploadCoverImage = async (req, res) => {
  try {
    const file = req.file || req.body.file; //req.body.file .file決定前端json物件要設定的key, 但是用form/data格式傳的是用req.file 這個是multer建立傳遞檔案時在req中的屬性不可動

    // ✅ 如果是外部圖片，直接返回 URL，不上傳
    if (typeof file === "string" && file.startsWith("http")) {
      return res.json({ url: file });
    }

    const imageUrl = await uploadToR2(file, "cover_images"); //(檔案, 存放資料夾名稱)
    res.json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// **文章內圖片上傳 API**
exports.uploadContentImage = async (req, res) => {
  try {
    const files = req.body.files; // Base64 陣列/定義檔名為files
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "缺少圖片數據" });
    }
    console.log("📌 收到的 Base64 圖片數量:", files.length);
    const uploadedUrls = await processBatchUpload(files, "content_images");
    console.log("📌 上傳後的 R2 URL:", uploadedUrls);
    res.json({ urls: uploadedUrls });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// **代理 Cloudflare R2 讀取圖片**
// exports.proxyImage = async (req, res) => {
//   try {
//     const { key } = req.query;
//     if (!key) return res.status(400).json({ error: "缺少圖片 key" });

//     const command = new GetObjectCommand({
//       Bucket: process.env.R2_BUCKET_NAME,
//       Key: key,
//     });


//     const signedUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 7 天簽名 URL

//     return res.redirect(signedUrl);// 使用快取模式讀取簽名url
//   } catch (error) {
//     console.error("圖片代理錯誤:", error);
//     res.status(500).json({ error: "無法取得圖片" });
//   }
// };

// **取得所有文章**
exports.getPosts = async (req, res) => {
  try {
    const posts = await postModel.getPosts();
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得文章列表:", error);
    res.status(500).json({ status: "error", message: "無法取得文章" });
  }
};

// **根據 ID 取得文章**
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await postModel.getPostById(id);
    if (!post) {
      return res.status(404).json({ status: "error", message: "文章不存在" });
    }
    res.json({ status: "success", data: post });
  } catch (error) {
    console.error("無法取得文章:", error);
    res.status(500).json({ status: "error", message: "無法取得文章" });
  }
};

exports.getPostsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const posts = await postModel.getPostsByCategory(categoryId);
    if (posts.length === 0) {
      return res.status(404).json({ status: "error", message: "此分類下沒有文章" });
    }
    res.json({ status: "success", data: posts });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法取得分類文章" });
  }
};

exports.getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await postModel.getPostsByUser(userId);
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得使用者文章:", error);
    res.status(500).json({ status: "error", message: "無法取得使用者文章" });
  }
};

exports.getFullPostsWithComments = async (req, res) => {
  try {
    const posts = await postModel.getFullPostsWithComments();
    res.json({ status: "success", data: posts });
  } catch (error) {
    console.error("無法取得完整文章列表:", error);
    res.status(500).json({ status: "error", message: "無法取得完整文章列表" });
  }
};


//**建立文章**
exports.createPost = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const { title, content, description, category_id, status, tags, image_url } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "標題與內容為必填" });
    }


    const postData = {
      id: uuidv4(),
      user_id: req.user.id,
      category_id,
      title,
      content, // 這裡已經是處理過的 HTML，內含 R2 圖片 URL
      description, // ✅ 新增 `description`
      status: status || 'published',
      image_url: image_url || null // ✅ 存入轉換後的 URL
    };

    console.log("📌 正在新增文章"); // 🔴 **加上 log 檢查**

    const newPost = await postModel.createPost(postData, tags || []);
    console.log("✅ 文章新增成功:", newPost); // 🔴 **確認這裡是否有成功執行**
    res.status(201).json({ status: "success", data: newPost });
  } catch (error) {
    console.error("❌ 文章建立失敗:", error); // 🔴 **顯示錯誤細節**
    res.status(500).json({ status: "error", message: "無法新增文章" });
  }
};

// ✅ **判斷是否為 Cloudflare 快取代理圖片 //刪除更新使用**
const isCloudflareProxyImage = (imageUrl) => {
  if (!imageUrl) return false; // ✅ 防止 `null` 或 `undefined` 錯誤

  console.log(`🌐 檢查是否為 Cloudflare圖片網址: ${imageUrl}`);

  const baseURL = `${process.env.CDN_BASE_URL}/api/image?key=`;

  // ✅ 直接判斷 imageUrl 是否以 baseURL 開頭
  return imageUrl.startsWith(baseURL);
  
};

// **更新文章**
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content ,description, image_url } = req.body;
    const updateFields = {};

    // 1️⃣ 取得舊文章資料
    const oldPost = await postModel.getPostById(id);
    if(!oldPost){
      return res.status(404).json({status: "error", message: "文章不存在"});
    }

    //刪除舊圖片清單
    let deleteImageKeys = [];

    // 動態檢查是否要更新
    if (typeof title === "string" && title.trim() !== "" && title.trim() !== oldPost.title) updateFields.title = title.trim();
    if (typeof description === "string" && description.trim() !== "" && description.trim() !== oldPost.description) updateFields.description = description.trim();
    if (typeof image_url === "string" && image_url.trim() !== "" && image_url.trim() !== oldPost.image_url) updateFields.image_url = image_url.trim();

    if(typeof content === "string" && content.trim() !== "" && content.trim() !== (oldPost.content || "").trim()){
      updateFields.content = content.trim();
    
      // ✅ **處理封面圖片**
      if (typeof image_url === "string" && image_url.startsWith("http")) {
        if (oldPost.image_url && isCloudflareProxyImage(oldPost.image_url)) {
          const fileKey = decodeURIComponent(oldPost.image_url.split("key=")[1]);
          await deleteFromR2(fileKey);
        }
      }// ✅ **如果封面圖片變更，刪除舊的 R2 圖片**
      else if(image_url !== oldPost.imageUrl && isCloudflareProxyImage(oldPost.image_url)){
        const fileKey = decodeURIComponent(oldPost.image_url.split("key=")[1]);
        if (fileKey) deleteImageKeys.push(fileKey);
      }

      // ✅ **解析 `content` 內的新圖片**
      const $newContent = cheerio.load(content);
      let newImageKeys = new Set();
      $newContent('img').each((_, img)=> {
        const imgSrc = $newContent(img).attr("src");
        if(imgSrc && isCloudflareProxyImage(imgSrc)){
          const newKey = decodeURIComponent(imgSrc.split("key=")[1]);
          if (newKey) newImageKeys.add(newKey);
        }
      })

      // ✅ **解析舊文章 `content` 內的 `<img>` 取得舊圖片**
      const $oldContent = cheerio.load(oldPost.content);
      $oldContent('img').each((_, img)=>{
        const oldImgSrc = $oldContent(img).attr('src');
        if(oldImgSrc && isCloudflareProxyImage(oldImgSrc)){
          const oldKey = decodeURIComponent(oldImgSrc.split("key=")[1]);
          if(oldKey && !newImageKeys.has(oldKey)) {
            deleteImageKeys.push(oldKey); //只刪除已被移除的圖片
          }
        }
      });
    }
    // ✅ **刪除不再使用的 R2 圖片**
    for(const key of deleteImageKeys){
      await deleteFromR2(key);
    }

    // ✅ **更新資料庫內的文章**
    const updatedPost = await postModel.updatePost(id, updateFields);

    // if (!updatedPost) {
    //   return res.status(404).json({ status: "error", message: "文章不存在" });
    // }

    res.json({ status: "success", data: updatedPost });
  } catch (error) {
    console.error("更新文章失敗:", error);
    res.status(500).json({ status: "error", message: "無法更新文章" });
  }
};

// **切換文章狀態 API**
exports.updateStatus = async (req, res) => {
  try {
    console.log("🔔 進入 updateStatus，收到 ID:", req.params.id);
    const { id } = req.params;
    const { status } = req.body; // 期望的狀態

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ status: "error", message: "無效的狀態" });
    }

    // ✅ **呼叫 `updatePostStatus`，直接檢查文章並更新**
    const updatedPost = await postModel.updatePostStatus(id, status);

    if (!updatedPost) {
      return res.status(404).json({ status: "error", message: "文章不存在" });
    }

    res.json({ status: "success", data: updatedPost });
  } catch (error) {
    console.error("❌ 更新文章狀態失敗:", error);
    res.status(500).json({ status: "error", message: "無法更新文章狀態" });
  }
};


// **刪除文章**
exports.deletePost = async (req, res) => {
  try {
    const deletedPost = await postModel.getPostById(req.params.id);
    if (!deletedPost) return res.status(404).json({ status: "error", message: "找不到文章" });

    let deleteImageKeys = [];

    // ✅ **刪除封面 `image_url`**
    if(deletedPost.image_url && isCloudflareProxyImage(deletedPost.image_url)){
      const fileKey = decodeURIComponent(deletedPost.image_url.split("key=")[1]);
      console.log(`🖼 封面圖片 fileKey: ${fileKey}`);
      deleteImageKeys.push(fileKey);
    }

    //✅ **解析 `content` 內的 `<img>` 取得所有圖片**
    const $ = cheerio.load(deletedPost.content);
    $('img').each((_, img)=> {
      const imgSrc = $(img).attr('src');
      console.log(`🔍 找到圖片: ${imgSrc}`);

      if (!imgSrc) return;

      const isProxy = isCloudflareProxyImage(imgSrc);
      console.log(`🧐 這是 Cloudflare Proxy 嗎？ ${isProxy}`);

      if(isProxy){
        console.log(`✅ 確認為 Cloudflare Proxy: ${imgSrc}`);
        const fileKey = decodeURIComponent(new URL(imgSrc).searchParams.get("key"));
        console.log(`🖼 內容圖片 fileKey: ${fileKey}`);
        deleteImageKeys.push(fileKey);
      }
    });
    console.log(`🔍 總共要刪除 ${deleteImageKeys.length} 張圖片`);

    // ✅ **刪除所有 R2 圖片**
    for(const key of deleteImageKeys) {
      await deleteFromR2(key);
    }
    
    // ✅ **刪除資料庫內的文章**
    await postModel.deletePost(req.params.id);

    

    res.json({ status: "success", message: `文章已刪除，共刪除 ${deleteImageKeys.length} 張圖片` });
  } catch (error) {
    console.error("刪除文章失敗:", error);
    res.status(500).json({ status: "error", message: "無法刪除文章" });
  }
};

exports.addTagsToPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ status: "error", message: "請提供有效的標籤陣列" });
    }

    const addedTags = await postModel.addTagsToPost(id, tags);
    res.json({ status: "success", data: { post_id: id, tags: addedTags } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法新增標籤" });
  }
};

exports.searchPostsByTags = async (req, res) => {
  try {
    const { tags } = req.query;
    if (!tags) {
      return res.status(400).json({ status: "error", message: "請提供標籤參數" });
    }

    const tagArray = tags.split(',');
    const posts = await postModel.searchPostsByTags(tagArray);
    res.json({ status: "success", data: posts });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法搜尋文章" });
  }
};

exports.togglePostLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    if (!postId) {
      return res.status(400).json({ status: "error", message: "缺少 postId" });
    }

    const result = await postModel.togglePostLike(userId, postId);
    res.json({ status: "success", liked: result.liked });
  } catch (error) {
    console.error("按讚失敗:", error);
    res.status(500).json({ status: "error", message: "操作失敗" });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const { post_id } = req.params;
    const likes = await postModel.getPostLikes(post_id);

    if (!likes) {
      return res.status(404).json({ status: "error", message: "找不到該文章的按讚數" });
    }

    res.json({ status: "success", data: likes });
  } catch (error) {
    res.status(500).json({ status: "error", message: "無法查詢按讚數" });
  }
};


exports.togglePostFavorite = async (req, res) => {
  try {
    const { post_id } = req.params;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const result = await postModel.togglePostFavorite(req.user.id, post_id);
    res.json({ status: "success", favorited: result.favorited });
  } catch (error) {
    console.error("無法收藏/取消收藏文章:", error);
    res.status(500).json({ status: "error", message: "無法收藏/取消收藏文章" });
  }
};

exports.getUserFavorites = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: "error", message: "未授權，請登入" });
    }

    const favorites = await postModel.getUserFavorites(req.user.id);
    res.json({ status: "success", data: favorites });
  } catch (error) {
    console.error("無法獲取收藏文章清單:", error);
    res.status(500).json({ status: "error", message: "無法獲取收藏文章清單" });
  }
};


// 取得某個 user 的釘選文章
exports.getPinnedPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const pinnedPosts = await postModel.getPinnedPostsByUser(userId);

    res.json({ status: "success", data: pinnedPosts });
  } catch (error) {
    console.error("❌ getPinnedPostsByUser 錯誤:", error);
    res.status(500).json({ status: "error", message: "無法取得釘選文章" });
  }
};

// 切換釘選文章（需登入且只能釘選自己文章）
exports.togglePinnedPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await postModel.getPostById(postId);
    if (!post || post.user_id !== userId) {
      return res.status(403).json({ status: "error", message: "沒有權限釘選" });
    }

    const isPinned = await postModel.isPostPinnedByUser(userId, postId);

    if (isPinned) {
      await postModel.unpinPostForUser(userId, postId);
      res.json({ status: "success", pinned: false });
    } else {
      await postModel.pinPostForUser(userId, postId);
      res.json({ status: "success", pinned: true });
    }
  } catch (error) {
    console.error("❌ 切換釘選文章失敗:", error);
    res.status(500).json({ status: "error", message: "無法切換釘選狀態" });
  }
};
