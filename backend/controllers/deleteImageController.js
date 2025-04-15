const { s3 } = require("../config-s3");
const {DeleteObjectCommand} = require("@aws-sdk/client-s3");

exports.deleteFromR2 = async(fileKey) => {
    try {
        if(!fileKey) throw new Error("❌ 缺少要刪除的圖片 key");

        console.log(`🚀 開始刪除 R2 圖片: ${fileKey}`);

        // 初始化刪除請求
        const deleteParams = {
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileKey,
        };

        //送出刪除請求
        const command = new DeleteObjectCommand(deleteParams);
        await s3.send(command);
        console.log(`✅ 圖片刪除成功: ${fileKey}`);


        return true;
    } catch (error) {
        console.error("❌ 刪除 R2 內圖片錯誤:",  error);
        return false;
    }
};

