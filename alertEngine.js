// alertEngine.js
// 개별 알림 규칙을 처리하고 지표를 계산하며 알림을 발송하는 핵심 로직을 포함합니다.

const { getKlineData } = require("./bingxService");
const { calculateRSI, calculateBollingerBands } = require("./indicatorService");
const { sendNotification } = require("./notificationService");

/**
 * 볼린저 밴드 상태를 시각적인 텍스트 그래프로 생성합니다.
 * @param {number} price - 현재 가격
 * @param {{upper: number, middle: number, lower: number}} bb - 볼린저 밴드 값
 * @returns {string} 시각화된 텍스트 그래프
 */
function createBBStatusGraph(price, bb) {
  const bandWidth = bb.upper - bb.lower;
  if (bandWidth === 0) {
    return "[밴드 폭이 0입니다]";
  }

  const pricePosition = (price - bb.lower) / bandWidth;
  const percentage = (pricePosition * 100).toFixed(1);

  const graphWidth = 15;
  let graph = Array(graphWidth).fill(" ");
  let priceIndex = Math.round(pricePosition * (graphWidth - 1));

  // 가격이 밴드를 벗어난 경우, 그래프의 양 끝에 표시
  if (priceIndex < 0) priceIndex = 0;
  if (priceIndex >= graphWidth) priceIndex = graphWidth - 1;

  graph[priceIndex] = "*";

  return `하단 [${graph.join("")}] 상단 (${percentage}%)`;
}

/**
 * 단일 알림 규칙을 처리하고 로그 메시지를 반환합니다.
 * @param {object} alert - 처리할 단일 알림 규칙 객체
 * @param {object} notificationState - 알림 상태를 관리하는 객체
 * @returns {Promise<Array<string>>} 해당 알림 규칙 처리에서 발생한 로그 메시지 배열
 */
async function processAlert(alert, notificationState) {
  const logMessages = [];
  const { symbol, interval, indicators } = alert;

  logMessages.push(`--- [${symbol} (${interval})] ---`);

  try {
    const klineData = await getKlineData(symbol, interval, 200);

    if (!klineData || klineData.length === 0) {
      logMessages.push(
        `[데이터 오류] ${symbol} (${interval}) K-Line 데이터를 가져오지 못했습니다.`
      );
      return logMessages;
    }

    const closePrices = klineData.map((k) => parseFloat(k.close));
    const lastPrice = closePrices[closePrices.length - 1];

    for (const indicator of indicators) {
      const stateKey = `${symbol}-${interval}-${indicator.name}`;

      if (indicator.name === "RSI") {
        const rsiValue = calculateRSI(closePrices, indicator.period);
        if (rsiValue === null) continue;

        logMessages.push(
          `[지표 확인] RSI(${indicator.period}): ${rsiValue.toFixed(2)}`
        );

        if (
          rsiValue >= indicator.sellThreshold &&
          !notificationState[stateKey]
        ) {
          await sendNotification(
            `[RSI 과매수] ${symbol} (${interval}) | RSI가 ${
              indicator.sellThreshold
            } 이상입니다: ${rsiValue.toFixed(2)} (현재가: ${lastPrice})`
          );
          notificationState[stateKey] = true;
        } else if (
          rsiValue <= indicator.buyThreshold &&
          !notificationState[stateKey]
        ) {
          await sendNotification(
            `[RSI 과매도] ${symbol} (${interval}) | RSI가 ${
              indicator.buyThreshold
            } 이하입니다: ${rsiValue.toFixed(2)} (현재가: ${lastPrice})`
          );
          notificationState[stateKey] = true;
        } else if (
          rsiValue > indicator.buyThreshold &&
          rsiValue < indicator.sellThreshold &&
          notificationState[stateKey]
        ) {
          logMessages.push(
            `[상태 초기화] ${stateKey} 조건이 정상 범위로 돌아왔습니다.`
          );
          notificationState[stateKey] = false;
        }
      }

      if (indicator.name === "BollingerBands") {
        const bbValue = calculateBollingerBands(
          closePrices,
          indicator.period,
          indicator.stdDev
        );
        if (bbValue === null) continue;

        const bbGraph = createBBStatusGraph(lastPrice, bbValue);
        logMessages.push(
          `[지표 확인] BB(${indicator.period}, ${indicator.stdDev}): ${bbGraph}`
        );

        if (lastPrice > bbValue.upper && !notificationState[stateKey]) {
          await sendNotification(
            `[BB 상단돌파] ${symbol} (${interval}) | 현재가(${lastPrice})가 BB 상단(${bbValue.upper.toFixed(
              2
            )})을 돌파했습니다.`
          );
          notificationState[stateKey] = true;
        } else if (
          lastPrice < bbValue.lower &&
          !notificationState[stateKey]
        ) {
          await sendNotification(
            `[BB 하단돌파] ${symbol} (${interval}) | 현재가(${lastPrice})가 BB 하단(${bbValue.lower.toFixed(
              2
            )})을 돌파했습니다.`
          );
          notificationState[stateKey] = true;
        } else if (
          lastPrice <= bbValue.upper &&
          lastPrice >= bbValue.lower &&
          notificationState[stateKey]
        ) {
          logMessages.push(
            `[상태 초기화] ${stateKey} 조건이 정상 범위로 돌아왔습니다.`
          );
          notificationState[stateKey] = false;
        }
      }
    }
  } catch (error) {
    logMessages.push(
      `[오류] ${symbol} (${interval}) 처리 중 오류 발생: ${error.message}`
    );
  }
  return logMessages;
}

module.exports = { processAlert };
