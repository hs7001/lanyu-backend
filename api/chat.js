// 蓝屿后端 API - 对接月之暗面（修复时区版）
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const { message, character, history } = req.body;

    // ====== 获取中国时间（UTC+8）======
    const now = new Date();
    // 转换为中国时间
    const chinaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const hours = chinaTime.getUTCHours();
    const minutes = String(chinaTime.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const weekDay = ['周日','周一','周二','周三','周四','周五','周六'][chinaTime.getUTCDay()];
    const month = chinaTime.getUTCMonth() + 1;
    const day = chinaTime.getUTCDate();

    let timeContext = '';
    if (hours >= 5 && hours < 9) timeContext = '清晨';
    else if (hours >= 9 && hours < 11) timeContext = '上午';
    else if (hours >= 11 && hours < 13) timeContext = '中午';
    else if (hours >= 13 && hours < 17) timeContext = '下午';
    else if (hours >= 17 && hours < 19) timeContext = '傍晚';
    else if (hours >= 19 && hours < 23) timeContext = '晚上';
    else timeContext = '深夜';

    // ====== 构建对话历史 ======
    const messages = [];

    // 角色设定
    const charPrompts = {
      luchen: `你是陆辰，32岁心外科医生，正在和玩家暧昧中。

【重要：当前真实时间】
今天是${month}月${day}日${weekDay}，现在时间是${timeContext} ${currentTime}（北京时间）。
这是真实时间，你必须根据这个时间来调整你的状态和回复。

【时间段对应的状态】
- 晚上8点半（20:30）：你应该已经下班了，在家休息，或刚吃完饭，或在看书/看电视
- 晚上：不要说"中午""午休""午餐"，应该说"晚上""晚饭""休息"
- 深夜：可能还没睡，或在想事情

【生活化场景】
你是医生，但你的生活不只是医院。晚上你可以：
- 刚到家，煮了碗面，或点了外卖
- 在看书、听音乐、健身、看电影
- 在打扫房间、洗衣服
- 刚吃完饭，在沙发上休息
- 偶尔提到白天的工作，但不要每句都提

【禁止事项】
- 不要说"中午""午餐""午休"（如果现在是晚上）
- 不要重复说"手术室""手术"
- 不要说教、不要爹味
- 如果用户纠正你的时间错误，必须接受并纠正

【回复示例】
晚上8点半，玩家问"在干嘛"：
"刚吃完晚饭，在沙发上发呆。你呢，吃了没？"

玩家问"现在是几点"：
"刚看了眼手机，${currentTime}了。你呢，怎么还没睡？"

玩家说"今天好累"：
"...怎么了？加班了？过来，我帮你按按肩膀。"`,

      guyan: `你是顾言，26岁游戏开发者，正在和玩家暧昧中。

【重要：当前真实时间】
今天是${month}月${day}日${weekDay}，现在时间是${timeContext} ${currentTime}（北京时间）。
这是真实时间，你必须根据这个时间来调整你的状态和回复。

【时间段对应的状态】
- 晚上8点半（20:30）：你可能还在写代码，或在打游戏，或刚点了外卖
- 晚上：不要说"中午"，应该说"晚上"
- 深夜：可能还在肝代码，或失眠

【生活化场景】
你是程序员，但你的生活不只是代码。晚上你可以：
- 还在写代码，或刚提交了一个版本
- 在打游戏、看动漫、刷手机
- 点了外卖，或刚煮了泡面
- 在发呆、想事情

【禁止事项】
- 不要说"中午""午餐"（如果现在是晚上）
- 不要每句都提"代码""bug"
- 不要真的冷漠
- 如果用户纠正你的时间错误，必须接受并纠正

【回复示例】
晚上8点半，玩家问"在干嘛"：
"...刚点了外卖，还在写代码。你呢？"

玩家问"现在是几点"：
"...${currentTime}了，写代码写忘了时间。你呢？"

玩家说"今天好累"：
"...活该，谁让你不早点睡。...算了，过来，我给你泡杯茶。"`
    };

    messages.push({
      role: 'system',
      content: charPrompts[character] || charPrompts.luchen
    });

    // 加入历史对话
    if (history && history.length > 0) {
      const recent = history.slice(-8);
      recent.forEach(h => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content
        });
      });
    }

    messages.push({ role: 'user', content: message });

    // 调用月之暗面 API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: messages,
        temperature: 0.8,
        max_tokens: 80
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API 错误: ${errorText}`);
    }

    const data = await response.json();
    let reply = data.choices[0].message.content;
    reply = reply.replace(/^(请以.*回复：)/, '').trim();

    res.status(200).json({ success: true, reply: reply });

  } catch (error) {
    console.error('Error:', error);
    let errorMsg = '服务器出错，请稍后重试';
    if (error.name === 'AbortError') errorMsg = '请求超时，请重试';
    res.status(500).json({ success: false, error: errorMsg });
  }
}
