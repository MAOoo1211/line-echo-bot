'use strict';
require('dotenv').config();

const line = require('@line/bot-sdk');
const express = require('express');

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.channelSecret,
  channelAccessToken: process.env.channelSecret
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  console.log('收到 LINE Webhook 請求:', JSON.stringify(req.body, null, 2));
  if (!req.body.events || req.body.events.length === 0) {
    console.error('⚠️ 收到的 events 為空或無法解析');
    return res.status(200).end(); // 回 200 給 LINE
  }
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      console.error('處理 LINE Webhook 時發生錯誤:', err);
      res.status(200).end(); // 即使發生錯誤，也回 200 給 LINE
    });
});

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;

  if (userMessage.includes("菜單")) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "🥪 這是我們的最新菜單：https://lh3.googleusercontent.com/geougc-cs/AMBA38srtR3oP6E5elpULxHMkam9t_zj1hJo0Y5WhWwrD0c8B6i4OGa4REU2G3hehCNmQZ8S9keubg9SrcKsOt8ErXJ4WZuKaWx5r4gFB2wlBNJMTQjmUWw8dYr_Bhout-HwPMmRKGVuiThqNNgt=w734-h538-p",
    });
  }

  if (userMessage.includes("地址")) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "📍 621嘉義縣民雄鄉東榮路",
    });
  }

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "謝謝光臨金品早餐 ☀️",
  });
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

const axios = require('axios');  // 引入 axios

async function updateWebhookUrl() {
  try {
    console.log('嘗試獲取 ngrok URL...');
    const ngrokApiUrl = 'http://localhost:4040/api/tunnels';
    const ngrokResponse = await axios.get(ngrokApiUrl);
    const ngrokUrl = ngrokResponse.data.tunnels[0].public_url;

    console.log('取得 ngrok URL:', ngrokUrl);

    const lineApiUrl = 'https://api.line.me/v2/bot/channel/webhook/endpoint';
    const response = await axios.put(
      lineApiUrl,
      { endpoint: `${ngrokUrl}/callback` },
      {
        headers: {
          'Authorization': `Bearer ${config.channelAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status === 200) {
      console.log('LINE Webhook URL 更新成功:', `${ngrokUrl}/callback`);
    } else {
      console.error('更新 Webhook 失敗:', response.data);
    }
  } catch (error) {
    if (error.response) {
      console.error('更新 Webhook 發生錯誤:', error.response.status, error.response.data);
    } else {
      console.error('更新 Webhook 發生錯誤:', error.message);
    }
  }
}

updateWebhookUrl();
