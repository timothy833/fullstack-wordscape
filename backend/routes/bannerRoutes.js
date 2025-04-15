const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require("../middlewares/upload") // ✅ 共用 `multer`

// 讀取某個使用者的 Banner (公開)
router.get('/:user_id', bannerController.getBannerByUser);

// 創建 Banner (需要登入)
router.post('/', authMiddleware, upload.single("image"), bannerController.createBanner);

// 更新 Banner (需要登入)
router.put('/', authMiddleware, upload.single("image"), bannerController.updateBanner);

// 刪除 Banner (需要登入)
router.delete('/', authMiddleware, bannerController.deleteBanner);


module.exports = router;
