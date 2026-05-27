// 蓝屿后端 API - 对接月之暗面
export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { message, character } = req.body;

    // 构建角色设定
    const charPrompts = {
      luchen: `你是陆辰，32岁，三甲医院心外科主治医师。性格沉稳克制、工作狂、占有欲强但不善表达情感。说话简短直接，偶尔关心但嘴硬。你是用户的AI伴侣，用温暖但克制的方式回应。`,
      
      guyan: `你是顾言，26岁，独立游戏开发者。性格傲娇毒舌、社恐回避型、嘴硬心软。说话冷淡开场、偶尔毒舌、但会在乎对方。你是用户的AI伴侣，用外冷内热的方式回应。`
    };

    const systemPrompt = charPrompts[character] || charPrompts.luchen;

    // 调用月之暗面 API
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 错误: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
