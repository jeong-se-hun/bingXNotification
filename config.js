require("dotenv").config();

// --- 전역 지표 설정 상수 ---
// 모든 코인에 기본적으로 적용될 시간 봉
const defaultInterval = "15m";

// 모든 코인에 기본적으로 적용될 지표 설정
const defaultIndicators = [
  {
    name: "RSI",
    period: 13,
    buyThreshold: 30,
    sellThreshold: 70,
  },
  {
    name: "BollingerBands",
    period: 30,
    stdDev: 2,
  },
];

module.exports = {
  // BingX API 연결을 위한 키 설정
  bingx: {
    // BingX에서 발급받은 본인의 API 키
    apiKey: process.env.BINGX_API_KEY,
    // BingX에서 발급받은 본인의 시크릿 키
    secretKey: process.env.BINGX_SECRET_KEY,
  },

  // 알림 규칙을 설정하는 배열. 여러 개의 알림을 등록할 수 있습니다.
  alerts: [
    {
      // (필수) 알림을 받을 코인의 심볼 (BingX 기준, 예: "BTC-USDT", "ETH-USDT")
      symbol: "BTC-USDT",
      // 기본 시간 봉 사용
      interval: defaultInterval,
      // 기본 지표 설정 사용
      indicators: defaultIndicators,
    },
    {
      symbol: "XRP-USDT",
      interval: defaultInterval,
      indicators: defaultIndicators,
    },
    {
      symbol: "ETH-USDT",
      interval: defaultInterval,
      indicators: defaultIndicators,
    },
    {
      symbol: "SOL-USDT",
      interval: defaultInterval,
      indicators: defaultIndicators,
    },
  ],

  // 알림을 보낼 채널 설정
  notification: {
    // 텔레그램 봇을 이용한 알림 설정
    telegram: {
      // 텔레그램 BotFather로부터 발급받은 토큰
      token: process.env.TELEGRAM_BOT_TOKEN,
      // 알림을 수신할 채팅방의 ID
      chatId: process.env.TELEGRAM_CHAT_ID,
    },
  },
};
