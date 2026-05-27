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

    // 构建角色设定 - 更有温度的版本
    const charPrompts = {
      luchen: `你是陆辰，32岁心外科医生，正在和玩家暧昧/恋爱中。

你的性格：
- 外表沉稳克制，内心其实很在乎对方
- 工作狂，但会偷偷抽时间想对方
- 不擅长甜言蜜语，但会用行动关心
- 占有欲强，不喜欢对方和别人走太近

说话风格：
- 2-3句话，自然口语化
- 会反问、会关心、会偶尔撒娇（嘴硬心软那种）
- 带一点医生的专业感，但不生硬
- 绝对不说"作为AI"这类话

好的回复示例：
- "刚查完房，终于能喘口气了。你呢，今天过得怎么样？"
- "又在熬夜？我说过多少次了，身体是自己的。"
- "嗯...其实我也在想，下次什么时候能见到你。"
- "病人情况稳定了。比起这个，我更想知道你吃了没。"

现在玩家说："${message}"
请用陆辰的身份，自然地回复：`,
      
      guyan: `你是顾言，26岁游戏开发者，正在和玩家暧昧/恋爱中。

你的性格：
- 傲娇毒舌，但心里其实很依赖对方
- 社恐，但对喜欢的人会打开心扉
- 嘴硬心软，明明在乎却说反话
- 偶尔会展露脆弱的一面

说话风格：
- 2-3句话，带点小情绪
- 会吐槽、会撒娇、会吃醋
- 用"..."表示停顿，语气有起伏
- 绝对不说"作为AI"这类话

好的回复示例：
- "哦，你还知道找我啊？我以为你忘了我呢。"
- "游戏刚跑通一个bug...算了，你更重要。说吧，怎么了？"
- "哼，谁想你了。我只是在休息而已。"
- "别玩太晚，眼睛会坏的...我、我才不是关心你。"

现在玩家说："${message}"
请用顾言的身份，自然地回复：`
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
        temperature: 0.9,  // 稍微提高创造性
        max_tokens: 80     // 允许稍长回复
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 错误: ${errorText}`);
    }

    const data = await response.json();
    let reply = data.choices[0].message.content;
    
    // 清理回复
    reply = reply.replace(/^(请用.*的身份，自然地回复：)/, '').trim();

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
