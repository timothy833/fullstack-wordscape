const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require("../middlewares/upload") // ✅ 共用 `multer`



// ✅ 註冊、登入（不需要 JWT 驗證）登出(需要JWT)
//註冊
router.post('/register', userController.register);
//登入
router.post('/login', userController.login);
//登出
router.post('/logout', authMiddleware, userController.logout);


//使用者管理 （需要 `authMiddleware` 驗證）
//取得所有使用者
router.get('/', userController.getUsers);
//取得單一使用者
router.get('/:id', userController.getUser);
//更新使用者
router.patch('/:id', authMiddleware,upload.single("profile_picture") ,userController.updateUser);
//刪除使用者
router.delete('/:id', authMiddleware , userController.deleteUser);

//密碼管理 （不需要 JWT，因為 Token 來自 Email）
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);


module.exports = router;