export default async function handler(req, res) { // 导出API处理程序函数，接收请求和响应对象
  if (req.method !== "POST") { // 检查请求方法是否为POST
    return res.status(405).json({ error: "Method not allowed" }); // 如果不是POST方法，返回405错误
  }

  const { text } = req.body; // 从请求体中提取文章内容

  const prompt = ` // 定义用于指导AI生成题目的提示模板
你是一个“学习型题库生成专家”，
请严格基于下面文章内容生成题目，不要引入外部知识。

要求：
1. 生成 10 道选择题（4 选 1）
2. 生成 10 道判断题
3. 生成 5 道问答题
4. 每道题必须给出【标准答案】
5. 给出【原文依据】（引用原文句子）

输出格式为 JSON，结构如下：

{
  "choice": [ // 选择题数组
    {
      "question": "", // 问题内容
      "options": ["A", "B", "C", "D"], // 选项数组
      "answer": "", // 正确答案
      "source": "" // 原文依据
    }
  ],
  "judge": [ // 判断题数组
    {
      "question": "", // 问题内容
      "answer": true, // 正确答案（布尔值）
      "source": "" // 原文依据
    }
  ],
  "qa": [ // 问答题数组
    {
      "question": "", // 问题内容
      "answer": "", // 标准答案
      "source": "" // 原文依据
    }
  ]
}

文章内容如下：
"""
${text} // 插入用户提供的文章内容
"""
`;

  try { // 开始错误处理块
    const response = await fetch("https://api.openai.com/v1/chat/completions", { // 发送请求到OpenAI API
      method: "POST", // 请求方法为POST
      headers: { // 请求头
        "Content-Type": "application/json", // 内容类型为JSON
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // 使用环境变量中的API密钥进行认证
      },
      body: JSON.stringify({ // 请求体，转换为JSON字符串
        model: "gpt-4.1-mini", // 使用的AI模型
        messages: [{ role: "user", content: prompt }], // 消息数组，包含用户提示
        temperature: 0.2 // 生成内容的随机性，0.2表示较为确定
      })
    });

    if (!response.ok) { // 检查API响应是否成功
      throw new Error(`API request failed with status ${response.status}`); // 如果失败，抛出错误
    }

    const data = await response.json(); // 解析API响应为JSON
    const content = data.choices[0].message.content; // 提取AI生成的内容

    res.status(200).json(JSON.parse(content)); // 将AI生成的内容解析为JSON并返回给客户端
  } catch (error) { // 处理错误
    console.error("Error processing request:", error); // 记录错误信息到控制台
    res.status(500).json({ error: "Internal server error" }); // 返回500错误给客户端
  }
}