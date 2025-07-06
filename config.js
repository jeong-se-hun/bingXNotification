require("dotenv").config();

module.exports = {
  // BingX API 연결을 위한 키 설정
  bingx: {
    apiKey: process.env.BINGX_API_KEY,
    secretKey: process.env.BINGX_SECRET_KEY,
  },

  // 알림을 보낼 채널 설정
  notification: {
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
    },
    prefix: "BingX_test", // 알림 메시지 앞에 붙을 접두사
  },

  // 모든 코인에 기본적으로 적용될 시간 봉
  defaultInterval: "5m",

  // 모든 코인에 기본적으로 적용될 지표 설정
  defaultIndicators: [
    {
      name: "RSI",
      period: 14,
      buyThreshold: 30,
      sellThreshold: 70,
    },
    {
      name: "BollingerBands",
      period: 20,
      stdDev: 2,
    },
  ],
};
