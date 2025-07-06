// index.js
// 애플리케이션의 메인 진입점. 각 모듈을 가져와 알림 로직을 실행합니다.

const config = require("./config.js");
const additionalAlertsConfig = require("./additional_alerts.json");
const { checkAlertsForInterval } = require("./alertEngine.js");

/**
 * 메인 함수: 애플리케이션을 시작하고 주기적으로 알림 확인을 실행합니다.
 */
async function main() {
  console.log("BingX 알림 서비스를 시작합니다.");

  // --- 루프 1: 기존 기능 (config.js 기반, 1분 주기, 로그 출력) ---
  console.log(
    `기본 모니터링 (1분 주기, '${config.defaultInterval}' 분봉)을 시작합니다.`
  );
  const mainCheckInterval = 1 * 60 * 1000;

  // 서비스 시작 시 첫 실행
  await checkAlertsForInterval(config.defaultInterval, true);
  // 주기적 실행
  setInterval(() => {
    checkAlertsForInterval(config.defaultInterval, true);
  }, mainCheckInterval);

  // --- 루프 2: 새로운 기능 (additional_alerts.json 기반, 설정된 주기, 로그 없음) ---
  if (
    additionalAlertsConfig &&
    additionalAlertsConfig.enabled && // 추가된 조건
    additionalAlertsConfig.intervals &&
    additionalAlertsConfig.checkEveryMinutes > 0
  ) {
    console.log(
      `추가 모니터링 (${
        additionalAlertsConfig.checkEveryMinutes
      }분 주기, [${additionalAlertsConfig.intervals.join(
        ", "
      )}] 분봉)을 시작합니다.`
    );
    const additionalCheckInterval =
      additionalAlertsConfig.checkEveryMinutes * 60 * 1000;

    const runAdditionalChecks = () => {
      console.log(
        `추가 모니터링 시작... [${additionalAlertsConfig.intervals.join(", ")}]`
      );
      for (const interval of additionalAlertsConfig.intervals) {
        checkAlertsForInterval(interval, false);
      }
    };

    // 서비스 시작 시 첫 실행
    await runAdditionalChecks();
    // 주기적 실행
    setInterval(runAdditionalChecks, additionalCheckInterval);
  }
}

// 에러 핸들링
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Unhandled Rejection] 처리되지 않은 Promise 거부:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Uncaught Exception] 처리되지 않은 동기 예외:", error);
});

// 애플리케이션 실행
main();
