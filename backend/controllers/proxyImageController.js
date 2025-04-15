const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../config-s3");


// **代理Cloud flare產生 Cloudflare R2圖片簽名網址**
exports.proxyImage = async (req, res) => {
  try {
    const fileKey = decodeURIComponent(req.query.key); // ✅ 確保 URL 解析正確
    if (!fileKey) return res.status(400).json({ error: "缺少圖片 key" });

    // ✅ 直接產生新的簽名 URL（7 天有效）
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 604800 }); // 7 天有效
    console.log("📌 Render Server 取得 R2 簽名 URL:", signedUrl);

    // ✅ 直接回傳 `signedUrl` 給 Cloudflare Pages
    return res.json({ signedUrl });
  } catch (error) {
    console.error("圖片代理錯誤:", error);
    res.status(500).json({ error: "無法取得圖片" });
  }
};
