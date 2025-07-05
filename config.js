require("dotenv").config();

// --- 전역 지표 설정 상수 ---
// 모든 코인에 기본적으로 적용될 시간 봉
const defaultInterval = "5m";

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

// alerts.json에서 모니터링할 심볼 목록(문자열 배열)을 불러옵니다.
const alertSymbols = require("./alerts.json");

// 각 심볼에 기본 설정을 적용하여 최종 알림 규칙 배열을 생성합니다.
const alerts = alertSymbols.map((symbol) => ({
  symbol: symbol,
  interval: defaultInterval,
  indicators: defaultIndicators,
}));

module.exports = {
  // BingX API 연결을 위한 키 설정
  bingx: {
    // BingX에서 발급받은 본인의 API 키
    apiKey: process.env.BINGX_API_KEY,
    // BingX에서 발급받은 본인의 시크릿 키
    secretKey: process.env.BINGX_SECRET_KEY,
  },

  // 동적으로 생성된 알림 규칙 배열
  alerts,

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
