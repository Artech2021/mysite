// 测试脚本：验证模型调用和切换逻辑

// 模拟模型配置
const models = [
    {
        name: 'Doubao',
        url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        model: 'doubao-pro-4k'
    },
    {
        name: 'DeepSeek',
        url: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat'
    },
    {
        name: 'ChatGPT',
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo'
    },
    {
        name: 'MiniMax',
        url: 'https://api.minimax.chat/v1/text/chatcompletion_pro',
        model: 'abab5.5-chat'
    }
];

// 模拟API调用函数
async function mockCallLLMAPI(text, modelName) {
    console.log(`模拟调用 ${modelName} API...`);
    
    // 模拟不同模型的成功率
    const successRates = {
        'Doubao': 0.8,    // 80%成功率
        'DeepSeek': 0.75,  // 75%成功率
        'ChatGPT': 0.7,    // 70%成功率
        'MiniMax': 0.65    // 65%成功率
    };
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const success = Math.random() < (successRates[modelName] || 0.5);
    
    if (success) {
        return {
            success: true,
            questions: {
                singleChoice: Array(10).fill().map((_, i) => ({ 
                    id: i+1, 
                    question: `${modelName}生成的单选题${i+1}`,
                    options: ['A', 'B', 'C', 'D'].map(opt => ({ id: opt, text: `${opt}选项` })),
                    correctAnswer: 'B'
                })),
                trueFalse: Array(10).fill().map((_, i) => ({ 
                    id: i+1, 
                    question: `${modelName}生成的判断题${i+1}`,
                    correctAnswer: i % 2 === 0 ? '正确' : '错误'
                })),
                shortAnswer: Array(3).fill().map((_, i) => ({ 
                    id: i+1, 
                    question: `${modelName}生成的简答题${i+1}`
                }))
            }
        };
    } else {
        return {
            success: false,
            message: `${modelName} API调用失败`
        };
    }
}

// 模拟本地生成器
function mockGenerateQuestionsLocally(text) {
    console.log('使用本地生成器生成问题...');
    return {
        success: true,
        questions: {
            singleChoice: Array(5).fill().map((_, i) => ({ 
                id: i+1, 
                question: `本地生成的单选题${i+1}`,
                options: ['A', 'B', 'C', 'D'].map(opt => ({ id: opt, text: `${opt}选项` })),
                correctAnswer: 'B'
            })),
            trueFalse: Array(5).fill().map((_, i) => ({ 
                id: i+1, 
                question: `本地生成的判断题${i+1}`,
                correctAnswer: i % 2 === 0 ? '正确' : '错误'
            })),
            shortAnswer: Array(2).fill().map((_, i) => ({ 
                id: i+1, 
                question: `本地生成的简答题${i+1}`
            }))
        }
    };
}

// 测试模型调用和切换逻辑
async function testModelCalling(text, modelName = 'random') {
    // 模型优先级列表 - 优先尝试豆包和DeepSeek
    const modelPriorityList = ['Doubao', 'DeepSeek', 'ChatGPT', 'MiniMax'];
    
    // 如果用户指定了模型，将其放在首位
    let modelsToTry = [...modelPriorityList];
    if (modelName !== 'random' && modelsToTry.includes(modelName)) {
        modelsToTry = [modelName, ...modelsToTry.filter(m => m !== modelName)];
    }
    
    console.log(`\n测试开始：尝试的模型顺序：${modelsToTry.join(', ')}`);
    
    // 尝试每个模型，直到成功或所有模型都失败
    for (const currentModel of modelsToTry) {
        try {
            console.log(`\n尝试使用模型: ${currentModel}`);
            // 直接调用AI模型API生成题目
            const apiResult = await mockCallLLMAPI(text, currentModel);
            
            if (apiResult.success) {
                console.log(`✅ 成功使用模型: ${currentModel}生成题目`);
                console.log(`   - 单选题数量: ${apiResult.questions.singleChoice.length}`);
                console.log(`   - 判断题数量: ${apiResult.questions.trueFalse.length}`);
                console.log(`   - 简答题数量: ${apiResult.questions.shortAnswer.length}`);
                return true;
            } else {
                console.error(`❌ ${currentModel} API调用失败:`, apiResult.message);
                // 继续尝试下一个模型
            }
        } catch (error) {
            console.error(`❌ ${currentModel} 生成问题失败:`, error);
            // 继续尝试下一个模型
        }
    }
    
    // 所有模型都失败时，降级使用本地生成器
    console.log('\n❌ 所有AI模型都调用失败，降级使用本地生成器');
    const localResult = mockGenerateQuestionsLocally(text);
    if (localResult.success) {
        console.log('✅ 本地生成器成功生成题目');
        return true;
    } else {
        console.log('❌ 本地生成器也失败');
        return false;
    }
}

// 运行测试
async function runTests() {
    console.log('=== 模型调用和切换逻辑测试 ===\n');
    
    // 测试用例1：默认随机模型
    console.log('=== 测试用例1：默认随机模型 ===');
    await testModelCalling('测试知识点：人工智能的基本概念和应用');
    
    // 测试用例2：指定使用豆包模型
    console.log('\n=== 测试用例2：指定使用豆包模型 ===');
    await testModelCalling('测试知识点：人工智能的基本概念和应用', 'Doubao');
    
    // 测试用例3：指定使用DeepSeek模型
    console.log('\n=== 测试用例3：指定使用DeepSeek模型 ===');
    await testModelCalling('测试知识点：人工智能的基本概念和应用', 'DeepSeek');
    
    console.log('\n=== 所有测试完成 ===');
}

// 执行测试
runTests().catch(error => console.error('测试过程中发生错误:', error));
