// index.js
// 애플리케이션의 메인 진입점. 각 모듈을 가져와 알림 로직을 실행합니다.

// --- 모듈 임포트 ---
const config = require("./config.js");
const { getKlineData } = require("./bingxService");
const { calculateRSI, calculateBollingerBands } = require("./indicatorService");
const { sendNotification } = require("./notificationService");

// --- 상태 관리 ---
const notificationState = {};

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
 * 설정된 모든 알림 규칙을 순회하며 조건을 확인하고, 충족 시 알림을 보냅니다.
 */
async function checkAlerts() {
  console.log(`[${new Date().toLocaleString()}] 알림 규칙 확인 시작...`);

  try {
    // 모든 알림 규칙을 병렬로 처리하되, 로그는 순차적으로 출력하여 가독성을 확보합니다.
    const logPromises = config.alerts.map(async (alert) => {
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
    });

    // 모든 로그 프로미스가 완료될 때까지 기다립니다.
    const allLogs = await Promise.all(logPromises);

    // 수집된 로그를 순서대로 출력합니다.
    allLogs.forEach((logGroup) => {
      logGroup.forEach((log) => console.log(log));
    });
  } catch (error) {
    console.error(
      "[치명적 오류] checkAlerts 함수 실행 중 예상치 못한 오류 발생:",
      error
    );
  }
  console.log("----------------------------------------------------\n");
}

/**
 * 메인 함수: 애플리케이션을 시작하고 주기적으로 알림 확인을 실행합니다.
 */
async function main() {
  console.log("BingX 알림 서비스를 시작합니다.");
  console.log("모니터링 시작: 설정된 규칙을 바탕으로 지표를 확인합니다.");

  const checkInterval = 60 * 1000;

  // 첫 실행은 await로 완료를 기다립니다.
  await checkAlerts();

  // 이후 설정된 간격마다 checkAlerts 함수를 반복 실행합니다.
  setInterval(checkAlerts, checkInterval);
}

// 처리되지 않은 Promise Rejection을 잡아서 로깅하고 프로그램 종료를 방지합니다.
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection] 처리되지 않은 Promise 거부:", reason);
  // 필요에 따라 여기서 추가적인 로깅 또는 오류 처리 로직을 구현할 수 있습니다.
});

// 처리되지 않은 동기 예외를 잡아서 로깅하고 프로그램 종료를 방지합니다.
process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception] 처리되지 않은 동기 예외:", error);
  // 필요에 따라 여기서 추가적인 로깅 또는 오류 처리 로직을 구현할 수 있습니다.
});

// 애플리케이션 실행
main();
