const express = require('express');
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require("../middlewares/upload") // ✅ 共用 `multer`
// const multer = require('multer');
// const fs = require("fs");
const router = express.Router();

// 文章相關 API
router.get('/', postController.getPosts);
router.get('/full', postController.getFullPostsWithComments);
router.get('/search', postController.searchPostsByTags);
router.get('/user/:userId', postController.getPostsByUser);
router.get('/category/:categoryId', postController.getPostsByCategory);
router.get('/post_likes/:post_id', postController.getPostLikes);

router.post('/', authMiddleware, postController.createPost);
router.post('/:id/tags', authMiddleware, postController.addTagsToPost);
router.post("/post_likes/:postId", authMiddleware, postController.togglePostLike);

router.post('/favorites/:post_id', authMiddleware, postController.togglePostFavorite);
router.get('/favorites', authMiddleware, postController.getUserFavorites);

router.get('/:id', postController.getPostById);

router.patch('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);


// **Multer - 使用本地磁碟作為暫存**  ✅ 設定 Multer，確保 `uploads/` 目錄存在
// ✅ 設定 Multer，確保 `uploads/` 目錄存在
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       const uploadPath = "uploads/";
//       if (!fs.existsSync(uploadPath)) {
//           fs.mkdirSync(uploadPath, { recursive: true });
//       }
//       cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     let sanitizedFileName = file.originalname.normalize("NFC")  // 修正 Unicode 亂碼
//       .replace(/\s/g, "_")// 空格轉 `_`
//       .replace(/[^\w.-]/g, ""); // 移除特殊字符 
//       cb(null,`${Date.now()}-${sanitizedFileName}`); // ✅ 確保唯一性
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // ✅ 單張圖片最大 10MB
// });


//上傳封面圖
router.post("/upload/cover", authMiddleware, upload.single("cover"), postController.uploadCoverImage);

//上傳Quill 文章內圖片
router.post("/upload/content", authMiddleware, postController.uploadContentImage);

// ✅ 更新文章狀態
router.put("/:id/status", authMiddleware, postController.updateStatus);

console.log("✅ 註冊文章路由: /api/posts/:id/status");

// ✅ 代理圖片（Cloudflare Cache）
// router.get("/proxy/image", postController.proxyImage);


router.get('/pinned/:userId', postController.getPinnedPostsByUser);
router.post('/:postId/pinned', authMiddleware, postController.togglePinnedPost);



module.exports = router;

