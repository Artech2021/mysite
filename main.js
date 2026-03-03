// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const fileIconSection = document.getElementById('file-icon-section');
    const qrcodeModal = document.getElementById('qrcode-modal');
    const closeBtn = document.querySelector('.close-btn');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const textInput = document.getElementById('text-input');
    
    let qrCode = null;
    let currentSessionId = null;
    
    // 生成唯一会话ID
    function generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    // 生成二维码
    function generateQRCode() {
        // 清除旧的二维码
        if (qrCode) {
            qrcodeContainer.innerHTML = '';
        }
        
        // 生成新的会话ID
        currentSessionId = generateSessionId();
        
        // 获取当前页面的URL，用于生成手机端访问链接
        const currentUrl = window.location.origin;
        const mobileUrl = `${currentUrl}/mobile-upload.html?sessionId=${currentSessionId}`;
        
        // 生成二维码
        qrCode = new QRCode(qrcodeContainer, {
            text: mobileUrl,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // 监听来自手机端的消息
        startSessionPolling();
    }
    
    // 监听手机端上传的图片和OCR结果
    function startSessionPolling() {
        const pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/check-session?sessionId=${currentSessionId}`);
                const data = await response.json();
                
                if (data.completed) {
                    clearInterval(pollingInterval);
                    qrcodeModal.style.display = 'none';
                    
                    if (data.text) {
                        // 将识别结果显示在文本框中
                        textInput.value = data.text;
                    }
                }
            } catch (error) {
                console.error('轮询会话状态失败:', error);
            }
        }, 2000);
    }
    
    // 点击文件图标显示二维码
    fileIconSection.addEventListener('click', () => {
        generateQRCode();
        qrcodeModal.style.display = 'block';
    });
    
    // 点击关闭按钮关闭模态框
    closeBtn.addEventListener('click', () => {
        qrcodeModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭模态框
    window.addEventListener('click', (event) => {
        if (event.target === qrcodeModal) {
            qrcodeModal.style.display = 'none';
        }
    });
});