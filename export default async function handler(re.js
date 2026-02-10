export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  const prompt = `
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
  "choice": [
    {
      "question": "",
      "options": ["A", "B", "C", "D"],
      "answer": "",
      "source": ""
    }
  ],
  "judge": [
    {
      "question": "",
      "answer": true,
      "source": ""
    }
  ],
  "qa": [
    {
      "question": "",
      "answer": "",
      "source": ""
    }
  ]
}

文章内容如下：
"""
${text}
"""
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;

  res.status(200).json(JSON.parse(content));
}
