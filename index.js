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

// Health check (can remove)
app.get('/', (req, res) => res.send('LINE Bot is running 🚀'));

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

// Event Handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const userMessage = event.message.text.trim();
  let reply;

  // 🥪 menu
  if (userMessage.match(/菜單|menu/i)) {
    reply = {
      type: "image",
      originalContentUrl:
        "https://lh3.googleusercontent.com/geougc-cs/AMBA38srtR3oP6E5elpULxHMkam9t_zj1hJo0Y5WhWwrD0c8B6i4OGa4REU2G3hehCNmQZ8S9keubg9SrcKsOt8ErXJ4WZuKaWx5r4gFB2wlBNJMTQjmUWw8dYr_Bhout-HwPMmRKGVuiThqNNgt=w734-h538-p",
      previewImageUrl:
        "https://lh3.googleusercontent.com/geougc-cs/AMBA38srtR3oP6E5elpULxHMkam9t_zj1hJo0Y5WhWwrD0c8B6i4OGa4REU2G3hehCNmQZ8S9keubg9SrcKsOt8ErXJ4WZuKaWx5r4gFB2wlBNJMTQjmUWw8dYr_Bhout-HwPMmRKGVuiThqNNgt=w734-h538-p",
    };
  }

  // 📍 location
  else if (userMessage.match(/位置|地址|導航|location/i)) {
    reply = {
      type: "location",
      title: "金品早午餐",
      address: "嘉義縣民雄鄉頂崙村15鄰崙子頂104號之102（東榮國小旁）",
      latitude: 23.557404,
      longitude: 120.435883,
    };
  }

  // ☎️ phones
  else if (userMessage.match(/電話|聯絡|訂餐|contact/i)) {
    reply = {
      type: "flex",
      altText: "聯絡電話資訊",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "📞 聯絡我們", weight: "bold", size: "xl" },
            {
              type: "text",
              text: "金品早午餐",
              color: "#8B4513",
              size: "md",
              margin: "md",
            },
            {
              type: "text",
              text: "電話：05-206-0286",
              size: "md",
              margin: "sm",
            },
            {
              type: "button",
              style: "primary",
              color: "#C0A27A",
              action: {
                type: "uri",
                label: "📲 直接撥打",
                uri: "tel:052060286",
              },
              margin: "sm"
            },
          ],
        },
      },
    };
  }

  // ⏰ opening time
  else if (userMessage.match(/營業|開幾點|關|休息|時間|hours/i)) {
    reply = {
      type: "flex",
      altText: "營業時間資訊",
      contents: {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "⏰ 營業時間", weight: "bold", size: "xl" },
            {
              type: "text",
              text: "每日：05:30 - 13:30\n每週二公休",
              margin: "md",
            },
            { type: "separator", margin: "md" },
            {
              type: "text",
              text: "📍 嘉義縣民雄鄉頂崙村15鄰崙子頂104號之102（東榮國小旁）",
              wrap: true,
              color: "#555555",
              margin: "md",
            },
          ],
        },
      },
    };
  }

  // 🎁 discount
  else if (userMessage.match(/優惠|活動|offers/i)) {
    reply = {
      type: "text",
      text:
        "🎉 本月優惠活動！\n" +
        "🍳 早鳥優惠：07:00 前點任一套餐，飲料免費升級 ☕\n" +
        "🎫 集點 10 點送主餐乙份\n\n" +
        "快來金品複合式早點享受美味早晨吧！",
    };
  }

  // 🥯 recommend
  else if (userMessage.match(/推薦|人氣|必點|recommend/i)) {
    reply = {
      type: "text",
      text:
        "🥪 今日人氣推薦：\n" +
        "1️⃣ 厚切豬排吐司\n" +
        "2️⃣ 起司蛋可頌\n" +
        "3️⃣ 經典拿鐵\n\n" +
        "☀️ 早餐好時光，從金品開始！",
    };
  }

  // 🧡 default
  else {
    reply = {
      type: "text",
      text:
        "👋 歡迎光臨金品複合式早點！\n" +
        "您可以輸入關鍵字查看資訊：\n" +
        "【菜單｜位置｜電話｜優惠｜營業時間｜推薦】🍞",
    };
  }

  // 回覆
  try {
    await client.replyMessage(event.replyToken, reply);
  } catch (err) {
    console.error("❌ 回覆訊息失敗:", err.originalError?.response?.data || err);
  }
}


// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Listening on ${port}`));
// app.listen(port, () => {
//   console.log(`listening on ${port}`);
//   updateWebhookUrl();
// });

// const axios = require('axios');  // 引入 axios

// async function updateWebhookUrl() {
//   try {
//     console.log('嘗試獲取 ngrok URL...');
//     const ngrokApiUrl = 'http://localhost:4040/api/tunnels';
//     const ngrokResponse = await axios.get(ngrokApiUrl);

//     if (!ngrokResponse.data.tunnels || ngrokResponse.data.tunnels.length === 0) {
//       console.error('無法取得 ngrok tunnels，請確認 ngrok 是否啟動');
//       return;
//     }

//     const ngrokUrl = ngrokResponse.data.tunnels[0].public_url;

//     if (!ngrokUrl) {
//       console.error('ngrok URL 取得為空，請確認 ngrok 是否正常運作');
//       return;
//     }

//     console.log('取得 ngrok URL:', ngrokUrl);

//     const lineApiUrl = 'https://api.line.me/v2/bot/channel/webhook/endpoint';
//     const response = await axios.put(
//       lineApiUrl,
//       { endpoint: `${ngrokUrl}/callback` },
//       {
//         headers: {
//           'Authorization': `Bearer ${config.channelAccessToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (response.status === 200) {
//       console.log('LINE Webhook URL 更新成功:', `${ngrokUrl}/callback`);
//     } else {
//       console.error('更新 Webhook 失敗:', response.data);
//     }
//   } catch (error) {
//     if (error.response) {
//       console.error('更新 Webhook 發生錯誤:', error.response.status, error.response.data);
//     } else {
//       console.error('更新 Webhook 發生錯誤:', error.message);
//     }
//   }
// }
