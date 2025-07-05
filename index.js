// index.js
// 애플리케이션의 메인 진입점. 각 모듈을 가져와 알림 로직을 실행합니다.

// --- 모듈 임포트 ---
const config = require("./config.js");
const { processAlert } = require("./alertEngine.js"); // alertEngine 임포트

// --- 상태 관리 ---
const notificationState = {};

/**
 * 설정된 모든 알림 규칙을 순회하며 조건을 확인하고, 충족 시 알림을 보냅니다.
 */
async function checkAlerts() {
  console.log(`[${new Date().toLocaleString()}] 알림 규칙 확인 시작...`);

  try {
    // 모든 알림 규칙을 병렬로 처리하되, 로그는 순차적으로 출력하여 가독성을 확보합니다.
    const logPromises = config.alerts.map(async (alert) => {
      // processAlert 함수에 notificationState를 인자로 전달
      return await processAlert(alert, notificationState);
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
