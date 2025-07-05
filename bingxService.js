// bingxService.js
// BingX API와의 통신을 담당합니다.

const axios = require("axios");

const API_URL = "https://open-api.bingx.com";

/**
 * K-Line (캔들) 데이터를 가져옵니다.
 * 이 함수는 공개 API 엔드포인트를 사용하므로 API 키 서명이 필요 없습니다.
 * @param {string} symbol - 필수. 조회할 코인 심볼 (예: "BTC-USDT")
 * @param {string} interval - 필수. 조회할 시간 봉 단위 (예: "1m", "15m", "1h", "1d")
 * @param {number} limit - 옵션. 받아올 캔들 데이터의 개수 (기본값: 100, 최대: 1000)
 * @returns {Promise<Array>} K-Line(캔들) 데이터 배열. 실패 시 빈 배열 반환.
 *                        배열의 각 요소는 { open, close, high, low, volume, time } 형태의 객체입니다.
 */
async function getKlineData(symbol, interval, limit = 100) {
  // K-Line 데이터를 조회하는 API 엔드포인트
  const endpoint = "/openApi/swap/v2/quote/klines";

  // API에 전달할 쿼리 파라미터를 생성합니다.
  const params = new URLSearchParams({
    symbol,
    interval,
    limit,
  });

  try {
    // axios를 사용해 GET 요청을 보냅니다.
    const response = await axios.get(
      `${API_URL}${endpoint}?${params.toString()}`
    );

    // BingX API는 성공 시 code: 0을 반환합니다.
    if (response.data.code === 0) {
      // 실제 데이터는 'data' 필드에 담겨 있습니다.
      return response.data.data;
    }
    // API가 에러를 반환한 경우
    throw new Error(
      `API Error (code: ${response.data.code}): ${response.data.msg}`
    );
  } catch (error) {
    console.error(
      `[API 요청 실패] ${symbol}(${interval}) K-Line 데이터 요청 중 오류 발생:`,
      error.message
    );
    return []; // 오류 발생 시 빈 배열을 반환하여 시스템 중단을 방지
  }
}

module.exports = { getKlineData };
