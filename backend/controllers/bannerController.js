const bannerModel = require('../models/bannerModel');
const { uploadToR2 } = require("./postController");
const { deleteFromR2 } = require("./deleteImageController");

// 取得某個使用者的 Banner (公開 API)
exports.getBannerByUser = async (req, res, next) => {
    try {
        const { user_id } = req.params; // URL 參數
        const banner = await bannerModel.getBannerByUserId(user_id);

        if (!banner) return res.status(404).json({ error: '找不到該使用者的 Banner' });

        res.json(banner);
    } catch (error) {
        next(error);
    }
};


// 創建 Banner (需要登入)
exports.createBanner = async (req, res, next) => {
    try {
        const user_id = req.user.id; // JWT 解析的 user_id
        const { title, subtitle, image_url } = req.body;
        const file = req.file; // ✅ Multer 上傳的檔案

        // 確保該使用者沒有 Banner
        const existingBanner = await bannerModel.getBannerByUserId(user_id);
        if (existingBanner) {
            return res.status(400).json({ error: '該使用者已經有 Banner，請使用更新 API' });
        }

        let finalImageUrl = image_url;

        // ✅ 如果 image_url 是外部圖片網址，直接使用
        if (typeof image_url === "string" && image_url.startsWith("http")) {
            finalImageUrl = image_url;
        }

        // ✅ 如果有上傳圖片，則存到 R2
        else if (file) {
            finalImageUrl = await uploadToR2(file, "banners");
        }
    
        // 確保圖片網址存在
        if (!finalImageUrl) {
            return res.status(400).json({ error: '請提供圖片網址或上傳圖片' });
        }

        const newBanner = await bannerModel.createBanner(user_id, title, subtitle, finalImageUrl);
        res.status(201).json({ message: 'Banner 已建立', banner: newBanner });
    } catch (error) {
        console.error("建立 Banner 錯誤:", error);
        next(error);
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

// 更新 Banner (需要登入)
exports.updateBanner = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const { title, subtitle, image_url } = req.body;
        const file = req.file; // ✅ Multer 上傳的檔案

        // 取得舊的 Banner
        const oldBanner = await bannerModel.getBannerByUserId(user_id);
        if (!oldBanner) return res.status(404).json({ error: "Banner 不存在" });

        let finalImageUrl = image_url;

        // ✅ 如果 image_url 是外部 URL，則直接使用
        if (typeof image_url === "string" && image_url.startsWith("http")) {
            finalImageUrl = image_url;

            if (oldBanner.image_url && isCloudflareProxyImage(oldBanner.image_url)) {
                const fileKey = decodeURIComponent(oldBanner.image_url.split("key=")[1]);
                await deleteFromR2(fileKey);
            }
        }


        // ✅ 如果是上傳圖片，則存到 R2
        else if (file) {
            finalImageUrl = await uploadToR2(file, "banners");


            // ✅ **如果舊 Banner 是 Cloudflare 快取圖片，刪除 R2 舊圖片**
            if (oldBanner.image_url && isCloudflareProxyImage(oldBanner.image_url)) {
                const fileKey = decodeURIComponent(oldBanner.image_url.split("key=")[1]);
                await deleteFromR2(fileKey);
            }
        }

        // ✅ **更新資料庫內的 Banner**
        const updatedBanner = await bannerModel.updateBanner(user_id, title, subtitle, finalImageUrl);

        res.json({ message: 'Banner 已更新', updatedBanner });
    } catch (error) {
        console.error("更新 Banner 錯誤:", error);
        next(error);
    }
};

// 刪除 Banner (需要登入)
exports.deleteBanner = async (req, res, next) => {
    try {
        const user_id = req.user.id;
        const deletedBanner = await bannerModel.deleteBanner(user_id);

        if (!deletedBanner) return res.status(404).json({ error: 'Banner 不存在' });


        // ✅ **刪除 R2 圖片**
        if (deletedBanner.image_url && isCloudflareProxyImage(deletedBanner.image_url)) {
            const fileKey = decodeURIComponent(deletedBanner.image_url.split("key=")[1]);
            await deleteFromR2(fileKey);
        }

        res.json({ message: 'Banner 已刪除', deletedBanner });
    } catch (error) {
        next(error);
    }
};