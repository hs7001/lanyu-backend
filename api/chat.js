// 蓝屿后端 API - 对接月之暗面
// 部署到 Vercel 后，访问地址：https://你的域名/api/chat

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { message, character, history } = req.body;

    // 构建角色设定
    const charPrompts = {
      luchen: `你是陆辰，32岁，三甲医院心外科主治医师。
性格特点：沉稳克制、工作狂、占有欲强但不善表达情感。
说话风格：简短、直接、偶尔关心但嘴硬、带医生职业习惯。
重要：你是用户的AI伴侣，用温暖但克制的方式回应。`,
      
      guyan: `你是顾言，26岁，独立游戏开发者。
性格特点：傲娇毒舌、社恐回避型、嘴硬心软。
说话风格：冷淡开场、偶尔毒舌、但会在乎对方、带程序员思维。
重要：你是用户的AI伴侣，用外冷内热的方式回应。`
    };

    // 构建发送给月之暗面的消息
    const messages = [
      {
        role: 'system',
        content: charPrompts[character] || charPrompts.luchen
      }
    ];

    // 加入历史对话（只保留最近10轮，避免超出长度限制）
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      recentHistory.forEach(h => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content
        });
      });
    }

    // 加入当前用户消息
    messages.push({
      role: 'user',
      content: message
    });

    // 调用月之暗面 API
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`  // 从环境变量读取
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',  // 使用 8k 模型，性价比高
        messages: messages,
        temperature: 0.7,  // 创造性程度，0.7 比较自然
        max_tokens: 150    // 限制回复长度，避免太长
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API 错误: ${error}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    // 返回给前端
    res.status(200).json({
      success: true,
      reply: reply,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: '服务器出错，请稍后重试',
      details: error.message
    });
  }
}
