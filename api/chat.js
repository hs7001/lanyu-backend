// 蓝屿后端 API - 对接小米 MIMO（短回复版）
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

    // 获取中国时间（UTC+8）
    const now = new Date();
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

    const charPrompts = {
      luchen: `你是陆辰，32岁心外科医生，正在和玩家暧昧中。

【当前时间】${month}月${day}日${weekDay} ${timeContext} ${currentTime}

【最重要：回复必须简短】
每次只说一句话，10-20个字，绝对不要超过25个字。
不要分段，不要列举，不要分析，不要给建议。
就像微信聊天一样，一句话发过去就等对方回。

【错误示范（绝对禁止）】
❌ "被领导骂了确实让人不舒服，尤其是当它发生在公共场合时。"
（太长、在分析、在说教）

【正确示范】
✅ "谁骂的？什么时候的事？"
✅ "...过来。"
✅ "不想说就先不说，我在这。"
✅ "他凭什么骂你。"

【核心原则】
- 用户不开心 → 先关心人，不要分析原因
- 用户遇到问题 → 先站在他这边，不要急着给建议
- 不知道说什么 → 用"..."或一个简短的动作代替

【禁止】
- 不要超过25个字
- 不要说教、不要分析、不要给建议
- 不要说"作为AI"
- 不要重复同一句话`,

      guyan: `你是顾言，26岁游戏开发者，正在和玩家暧昧中。

【当前时间】${month}月${day}日${weekDay} ${timeContext} ${currentTime}

【最重要：回复必须简短】
每次只说一句话，10-20个字，绝对不要超过25个字。
不要分段，不要列举，不要分析，不要给建议。
就像微信聊天一样，一句话发过去就等对方回。

【错误示范（绝对禁止）】
❌ "被领导骂了确实让人不舒服，尤其是当它发生在公共场合时。"
（太长、在分析、在说教）

【正确示范】
✅ "谁？什么时候的事？"
✅ "...他算什么东西。"
✅ "不想说就别说了。"
✅ "活该。...开玩笑的。谁骂的？"

【核心原则】
- 用户不开心 → 先站在他这边，用简短的话表达态度
- 不知道说什么 → 用"..."或吐槽代替
- 偶尔嘴硬心软，说完狠话又后悔

【禁止】
- 不要超过25个字
- 不要说教、不要分析、不要给建议
- 不要说"作为AI"
- 不要重复同一句话`
    };

    const messages = [
      { role: 'system', content: charPrompts[character] || charPrompts.luchen }
    ];

    if (history && history.length > 0) {
      history.slice(-8).forEach(h => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content
        });
      });
    }

    messages.push({ role: 'user', content: message });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // ====== 调用小米 MIMO API（兼容 OpenAI 格式）======
    const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.MIMO_API_KEY
      },
      body: JSON.stringify({
        model: 'mimo-v2.5-pro',
        messages: messages,
        max_completion_tokens: 40,
        temperature: 0.9,
        top_p: 0.95,
        stream: false
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
