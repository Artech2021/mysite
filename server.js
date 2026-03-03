// 服务器主文件
import express from 'express';
import multer from 'multer';
import { handleImageUpload, checkSessionStatus } from './ocr-handler.js';

// 创建Express应用
const app = express();
const port = 3000;

// 配置静态文件服务
app.use(express.static('./'));

// 配置JSON解析
app.use(express.json());

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API路由

// 图片上传和OCR识别 - 支持多张图片
app.post('/api/upload-image', upload.any(), handleImageUpload);

// 检查会话状态
app.get('/api/check-session', checkSessionStatus);

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log('前端页面: http://localhost:3000');
    console.log('手机端上传页面: http://localhost:3000/mobile-upload.html');
});
