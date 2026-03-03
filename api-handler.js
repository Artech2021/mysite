export default async function handler(req, res) {
  // 检查请求方法是否为POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, modelName = 'Doubao' } = req.body; // 从请求体中提取文章内容和模型名称

    // 定义用于指导AI生成题目的提示模板
    const prompt = `
你是一个“学习型题库生成专家”，
请严格基于下面文章内容生成题目，不要引入外部知识。

要求：
1. 生成 10 道单选题（4 选 1）
2. 生成 10 道判断题，每题末尾加上括号()
3. 生成 3 道简答题
4. 每道题必须给出【标准答案】
5. 给出【原文依据】（引用原文句子）

输出格式为 JSON，结构必须严格符合以下格式，不能有任何额外内容：
{
  "singleChoice": [ // 单选题数组
    {
      "id": 1, // 问题编号
      "question": "", // 问题内容
      "options": [ // 选项数组
        { "id": "A", "text": "" },
        { "id": "B", "text": "" },
        { "id": "C", "text": "" },
        { "id": "D", "text": "" }
      ],
      "correctAnswer": "", // 正确答案（选项ID，如"A"、"B"、"C"或"D"）
      "source": "" // 原文依据
    }
  ],
  "trueFalse": [ // 判断题数组
    {
      "id": 1, // 问题编号
      "question": "", // 问题内容，末尾必须有()
      "correctAnswer": "正确", // 正确答案（"正确"或"错误"）
      "source": "" // 原文依据
    }
  ],
  "shortAnswer": [ // 简答题数组
    {
      "id": 1, // 问题编号
      "question": "", // 问题内容
      "source": "" // 原文依据
    }
  ]
}

文章内容如下：
"""
${text}
"""
`;

    // 定义模型配置
    const models = {
      Doubao: {
        url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        model: 'doubao-pro-4k',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DOUBAO_API_KEY || 'YOUR_DOBAO_API_KEY'}`,
          'X-Volc-Region': 'cn-beijing'
        }
      },
      DeepSeek: {
        url: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY'}`
        }
      },
      ChatGPT: {
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4.1-mini',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY'}`
        }
      }
    };

    // 获取选中的模型配置
    const selectedModel = models[modelName] || models.Doubao; // 默认使用豆包模型

    // 构建请求体
    const requestBody = {
      model: selectedModel.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的教育评估专家，擅长生成高质量的测试题目。请严格按照用户要求的格式输出JSON。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      top_p: 0.9
    };

    // 发送API请求
    const response = await fetch(selectedModel.url, {
      method: 'POST',
      headers: selectedModel.headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    
    // 提取AI生成的内容
    let content;
    if (modelName === 'Doubao' || modelName === 'ChatGPT') {
      content = data.choices[0].message.content;
    } else if (modelName === 'DeepSeek') {
      content = data.choices[0].message.content;
    } else {
      content = data.choices[0].message.content;
    }

    // 清理AI生成的内容，确保只有JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI response does not contain valid JSON');
    }
    
    // 解析JSON
    let questions = JSON.parse(jsonMatch[0]);

    // 验证并确保输出格式正确
    if (!questions.singleChoice || !Array.isArray(questions.singleChoice)) {
      questions.singleChoice = [];
    }
    
    if (!questions.trueFalse || !Array.isArray(questions.trueFalse)) {
      questions.trueFalse = [];
    }
    
    if (!questions.shortAnswer || !Array.isArray(questions.shortAnswer)) {
      questions.shortAnswer = [];
    }

    // 确保题目数量符合要求
    while (questions.singleChoice.length < 10) {
      questions.singleChoice.push({
        id: questions.singleChoice.length + 1,
        question: `补充单选题${questions.singleChoice.length + 1}`,
        options: [
          { "id": "A", "text": "选项A" },
          { "id": "B", "text": "选项B" },
          { "id": "C", "text": "选项C" },
          { "id": "D", "text": "选项D" }
        ],
        correctAnswer: "B",
        source: text.substring(0, 100) + '...'
      });
    }
    
    while (questions.trueFalse.length < 10) {
      questions.trueFalse.push({
        id: questions.trueFalse.length + 1,
        question: `补充判断题${questions.trueFalse.length + 1}()`,
        correctAnswer: Math.random() > 0.5 ? "正确" : "错误",
        source: text.substring(0, 100) + '...'
      });
    }
    
    while (questions.shortAnswer.length < 3) {
      questions.shortAnswer.push({
        id: questions.shortAnswer.length + 1,
        question: `补充简答题${questions.shortAnswer.length + 1}`,
        source: text.substring(0, 100) + '...'
      });
    }

    // 确保ID编号正确
    questions.singleChoice.forEach((q, i) => q.id = i + 1);
    questions.trueFalse.forEach((q, i) => q.id = i + 1);
    questions.shortAnswer.forEach((q, i) => q.id = i + 1);

    // 返回正确格式的响应
    res.status(200).json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ 
      success: false, 
      error: "Internal server error",
      details: error.message 
    });
  }
}