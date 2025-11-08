'use strict';
require('dotenv').config();

const line = require('@line/bot-sdk');
const express = require('express');

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.channelSecret,
  channelAccessToken: process.env.channelAccessToken
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

  // menu
  if (userMessage.includes("菜單")) {
    return client.replyMessage(event.replyToken, {
      type: "image",
      originalContentUrl: "https://lh3.googleusercontent.com/geougc-cs/AMBA38srtR3oP6E5elpULxHMkam9t_zj1hJo0Y5WhWwrD0c8B6i4OGa4REU2G3hehCNmQZ8S9keubg9SrcKsOt8ErXJ4WZuKaWx5r4gFB2wlBNJMTQjmUWw8dYr_Bhout-HwPMmRKGVuiThqNNgt=w734-h538-p",
      previewImageUrl: "https://lh3.googleusercontent.com/geougc-cs/AMBA38srtR3oP6E5elpULxHMkam9t_zj1hJo0Y5WhWwrD0c8B6i4OGa4REU2G3hehCNmQZ8S9keubg9SrcKsOt8ErXJ4WZuKaWx5r4gFB2wlBNJMTQjmUWw8dYr_Bhout-HwPMmRKGVuiThqNNgt=w734-h538-p"
    });
  }


  // location 
  if (userMessage.includes("店家位置") || userMessage.includes("地址") || userMessage.includes("導航") || userMessage.includes("位置") || userMessage.includes("location")) {
    return client.replyMessage(event.replyToken, {
      type: "location",
      title: "金品早午餐",
      address: "621嘉義縣民雄鄉頂崙村崙子頂104-102 (東榮國小旁)",
      latitude: 23.5576638,
      longitude: 120.4352089
    });
  }
  
  // phone
  if (
    userMessage.includes("電話") ||
    userMessage.includes("聯絡") ||
    userMessage.includes("訂餐")
  ) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "📞 聯絡電話：05-2060286"
    });
  }

  // time
  if (
    userMessage.includes("營業時間") ||
    userMessage.includes("開幾點") ||
    userMessage.includes("幾點關") || 
    userMessage.includes("營業中嗎") || 
    userMessage.includes("休息嗎")
  ) {
    return client.replyMessage(event.replyToken, {
      type: "flex",
      altText: "營業時間資訊",
      contents: {
        type: "bubble",
        hero: {
          type: "image",
          url: "https://example.com/your_store_image.jpg",
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover"
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "⏰ 營業時間",
              weight: "bold",
              size: "xl"
            },
            {
              type: "text",
              text: "每日：05:30 - 13:30\n每週二公休",
              margin: "md",
              size: "md"
            },
            {
              type: "separator",
              margin: "md"
            },
            {
              type: "text",
              text: "📍 嘉義縣民雄鄉頂崙村崙子頂104-102（東榮國小旁）",
              wrap: true,
              color: "#555555",
              margin: "md"
            }
          ]
        }
      }
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
  updateWebhookUrl();
});

const axios = require('axios');  // 引入 axios

async function updateWebhookUrl() {
  try {
    console.log('嘗試獲取 ngrok URL...');
    const ngrokApiUrl = 'http://localhost:4040/api/tunnels';
    const ngrokResponse = await axios.get(ngrokApiUrl);

    if (!ngrokResponse.data.tunnels || ngrokResponse.data.tunnels.length === 0) {
      console.error('無法取得 ngrok tunnels，請確認 ngrok 是否啟動');
      return;
    }

    const ngrokUrl = ngrokResponse.data.tunnels[0].public_url;

    if (!ngrokUrl) {
      console.error('ngrok URL 取得為空，請確認 ngrok 是否正常運作');
      return;
    }

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
