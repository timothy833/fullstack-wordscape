const multer = require("multer");
const fs = require("fs");


// ✅ 設定 Multer，確保 `uploads/` 目錄存在
const storage = multer.diskStorage({
    destination: function (req, file, cb){
        const uploadPath = "uploads/";
        if(!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true});
        }
        cb(null, uploadPath);
    },
    filename: function (req,file, cb){
        let sanitizedFileName = file.originalname.normalize("NFC")
            .replace(/\s/g, "_") // 空格轉 `_`
            .replace(/[^\w.-]/g, ""); // 移除特殊字符 
        cb(null, `${Date.now()}-${sanitizedFileName}`); // ✅ 確保唯一性
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 100*1024*1024},
});

// ✅ 正確導出 `upload`
module.exports = upload;