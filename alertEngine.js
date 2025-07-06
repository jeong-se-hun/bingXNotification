// alertEngine.js
const { getKlineData } = require("./bingxService");
const { calculateRSI, calculateBollingerBands } = require("./indicatorService");
const { sendNotification } = require("./notificationService");
const symbols = require("./alerts.json");
const { defaultIndicators } = require("./config");

// 알림 상태를 관리하는 객체 (중복 알림 방지)
const notificationState = {};

function createBBStatusGraph(price, bb) {
  const bandWidth = bb.upper - bb.lower;
  if (bandWidth === 0) return "[밴드 폭 0]";
  const pricePosition = (price - bb.lower) / bandWidth;
  const percentage = (pricePosition * 100).toFixed(1);
  const graphWidth = 15;
  let graph = Array(graphWidth).fill(" ");
  let priceIndex = Math.round(pricePosition * (graphWidth - 1));
  if (priceIndex < 0) priceIndex = 0;
  if (priceIndex >= graphWidth) priceIndex = graphWidth - 1;
  graph[priceIndex] = "*";
  return `하단 [${graph.join("")}] 상단 (${percentage}%)`;
}

async function checkAlertsForInterval(interval, enableLogging) {
  const log = (message) => {
    if (enableLogging) {
      console.log(message);
    }
  };

  log("========================================");
  log(
    `--- [${interval}] 인터벌 모니터링 ${new Date().toLocaleTimeString()} ---`
  );
  log("========================================");

  for (const symbol of symbols) {
    try {
      const klineData = await getKlineData(symbol, interval, 200);
      if (!klineData || klineData.length === 0) {
        log(
          `[데이터 오류] ${symbol} (${interval}) K-Line 데이터를 가져오지 못했습니다.`
        );
        continue;
      }

      const closePrices = klineData.map((k) => parseFloat(k.close));
      const lastPrice = closePrices[closePrices.length - 1];

      if (enableLogging) {
        log(`--------------- [${symbol} (${interval})] ---------------`);
      }

      for (const indicator of defaultIndicators) {
        const stateKey = `${symbol}-${interval}-${indicator.name}`;

        if (indicator.name === "RSI") {
          const rsiValue = calculateRSI(closePrices, indicator.period);
          if (rsiValue === null) continue;

          log(`  [지표] RSI(${indicator.period}): ${rsiValue.toFixed(2)}`);

          const isOverbought = rsiValue >= indicator.sellThreshold;
          const isOversold = rsiValue <= indicator.buyThreshold;

          if (isOverbought && !notificationState[stateKey]) {
            await sendNotification(
              `[${symbol} (${interval})] | [RSI 과매수] | RSI가 ${
                indicator.sellThreshold
              } 이상입니다 | RSI: ${rsiValue.toFixed(2)}`
            );
            notificationState[stateKey] = true;
          } else if (isOversold && !notificationState[stateKey]) {
            await sendNotification(
              `[${symbol} (${interval})] | [RSI 과매도] | RSI가 ${
                indicator.buyThreshold
              } 이하입니다 | RSI: ${rsiValue.toFixed(2)}`
            );
            notificationState[stateKey] = true;
          } else if (
            !isOverbought &&
            !isOversold &&
            notificationState[stateKey]
          ) {
            log(`  [상태 초기화] ${stateKey} 조건이 정상 범위로 돌아왔습니다.`);
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
          log(
            `  [지표] BB(${indicator.period}, ${indicator.stdDev}): ${bbGraph}`
          );

          const isBreakout = lastPrice > bbValue.upper;
          const isBreakdown = lastPrice < bbValue.lower;

          if (isBreakout && !notificationState[stateKey]) {
            await sendNotification(
              `[${symbol} (${interval})] | [BB 상단돌파] | BB 상단(${bbValue.upper.toFixed(
                2
              )})을 돌파`
            );
            notificationState[stateKey] = true;
          } else if (isBreakdown && !notificationState[stateKey]) {
            await sendNotification(
              `[${symbol} (${interval})] | [BB 하단돌파] | BB 하단(${bbValue.lower.toFixed(
                2
              )})을 돌파`
            );
            notificationState[stateKey] = true;
          } else if (
            !isBreakout &&
            !isBreakdown &&
            notificationState[stateKey]
          ) {
            log(`  [상태 초기화] ${stateKey} 조건이 정상 범위로 돌아왔습니다.`);
            notificationState[stateKey] = false;
          }
        }
      }
    } catch (error) {
      log(`[오류] ${symbol} (${interval}) 처리 중 오류 발생: ${error.message}`);
    }
  }
}

module.exports = { checkAlertsForInterval };
