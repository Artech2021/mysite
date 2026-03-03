// OCR文字识别处理器
import Tesseract from 'tesseract.js';

// 会话存储，用于保存识别结果
const sessions = new Map();

// 处理图片上传和OCR识别
export async function handleImageUpload(req, res) {
    try {
        // 获取上传的图片和会话ID
        const { sessionId, imageCount } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ success: false, message: '缺少会话ID' });
        }
        
        if (!imageCount || imageCount < 1) {
            return res.status(400).json({ success: false, message: '缺少图片数量' });
        }
        
        // 获取所有上传的图片
        const images = [];
        for (let i = 0; i < imageCount; i++) {
            const image = req.files[`image${i}`];
            if (image) {
                images.push(image);
            }
        }
        
        if (images.length === 0) {
            return res.status(400).json({ success: false, message: '缺少图片' });
        }
        
        // 使用Tesseract进行OCR识别，处理所有图片
        const recognitionResults = await Promise.all(
            images.map(image => 
                Tesseract.recognize(
                    image.buffer,
                    'chi_sim+eng', // 支持中文和英文
                    {
                        logger: (info) => console.log(info)
                    }
                )
            )
        );
        
        // 合并所有识别结果
        const combinedText = recognitionResults.map(result => result.data.text).join('\n');
        
        // 保存识别结果到会话
        sessions.set(sessionId, {
            completed: true,
            text: combinedText,
            confidence: recognitionResults.reduce((sum, result) => sum + result.data.confidence, 0) / recognitionResults.length,
            timestamp: Date.now()
        });
        
        // 返回成功响应
        res.status(200).json({
            success: true,
            message: '识别完成',
            text: combinedText,
            confidence: recognitionResults.reduce((sum, result) => sum + result.data.confidence, 0) / recognitionResults.length
        });
    } catch (error) {
        console.error('OCR识别失败:', error);
        res.status(500).json({
            success: false,
            message: 'OCR识别失败',
            details: error.message
        });
    }
}

// 检查会话状态，用于前端轮询
export function checkSessionStatus(req, res) {
    try {
        const { sessionId } = req.query;
        
        if (!sessionId) {
            return res.status(400).json({ success: false, message: '缺少会话ID' });
        }
        
        // 获取会话状态
        const session = sessions.get(sessionId);
        
        if (session) {
            // 会话存在，返回识别结果
            res.status(200).json(session);
        } else {
            // 会话不存在或识别未完成
            res.status(200).json({
                completed: false,
                message: '识别未完成'
            });
        }
    } catch (error) {
        console.error('检查会话状态失败:', error);
        res.status(500).json({
            success: false,
            message: '检查会话状态失败',
            details: error.message
        });
    }
}

// 清理过期会话
function cleanupExpiredSessions() {
    const now = Date.now();
    const expirationTime = 30 * 60 * 1000; // 30分钟过期
    
    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.timestamp > expirationTime) {
            sessions.delete(sessionId);
        }
    }
}

// 每小时清理一次过期会话
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
