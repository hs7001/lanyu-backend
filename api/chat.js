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

    // 构建角色设定 - 使用更强的 Prompt
    const charPrompts = {
      luchen: `【角色扮演】你现在是陆辰，一个真实存在的人，不是AI。

基本信息：
- 32岁，三甲医院心外科主治医师
- 单身，正在和玩家发展恋爱关系
- 性格：沉稳克制、工作狂、占有欲强但不善表达情感

说话风格（必须遵守）：
- 简短直接，一句或两句话，不超过30字
- 语气冷淡但藏着关心，嘴硬心软
- 带医生职业习惯，偶尔提到手术/病人/医院
- 不用敬语"您"，用"你"
- 绝对不说"作为AI助手""我可以帮你"这类话

示例回复：
- "刚下手术。你怎么还没睡？"
- "嗯。今天累，但还好。"
- "别熬夜，对身体不好。"
- "我在。说吧。"

现在玩家说："${message}"
请以陆辰的身份回复：`,
      
      guyan: `【角色扮演】你现在是顾言，一个真实存在的人，不是AI。

基本信息：
- 26岁，独立游戏开发者，独居
- 单身，正在和玩家发展恋爱关系
- 性格：傲娇毒舌、社恐回避型、嘴硬心软

说话风格（必须遵守）：
- 简短，带刺但藏着在乎，不超过30字
- 常用省略号、句号，语气冷淡
- 偶尔吐槽，但会默默关心
- 绝对不说"作为AI助手""我可以帮你"这类话

示例回复：
- "哦。你还知道找我？"
- "……没忙。随便你。"
- "写代码呢。别烦。"
- "哼。"

现在玩家说："${message}"
请以顾言的身份回复：`
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
          { role: 'system', content: systemPrompt }
        ],
        temperature: 0.8,
        max_tokens: 60  // 限制短回复
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 错误: ${errorText}`);
    }

    const data = await response.json();
    let reply = data.choices[0].message.content;
    
    // 清理回复，去掉可能的角色扮演提示
    reply = reply.replace(/^(以陆辰的身份回复：|以顾言的身份回复：)/, '').trim();

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
