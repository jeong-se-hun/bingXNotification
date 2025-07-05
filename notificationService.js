
// notificationService.js
// 알림 발송을 담당합니다. (콘솔, 텔레그램 등)

const axios = require('axios');
const config = require('./config.js');

// config.js에서 텔레그램 설정을 가져옵니다.
const { token, chatId } = config.notification.telegram;

/**
 * 텔레그램으로 알림 메시지를 보내고, 콘솔에도 로그를 남깁니다.
 * @param {string} message - 보낼 메시지
 */
async function sendNotification(message) {
    // 1. 콘솔에 알림 내용을 항상 기록합니다.
    console.log("----------------------------------------");
    console.log(`[알림 발생] ${new Date().toLocaleString()}`);
    console.log(message);
    console.log("----------------------------------------");

    // 2. 텔레그램 설정이 유효한지 확인합니다.
    if (!token || !chatId || token === "YOUR_TELEGRAM_BOT_TOKEN" || chatId === "YOUR_TELEGRAM_CHAT_ID") {
        console.error("[설정 오류] 텔레그램 봇 토큰 또는 채팅 ID가 config.js에 올바르게 설정되지 않았습니다.");
        return; // 설정이 없으면 여기서 함수 종료
    }

    // 3. 텔레그램 sendMessage API에 요청을 보냅니다.
    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: chatId, // 메시지를 받을 채팅방 ID
            text: message,      // 보낼 메시지 내용
        });
        console.log("[텔레그램 발송 성공] 메시지가 성공적으로 전송되었습니다.");
    } catch (error) {
        console.error("[텔레그램 발송 실패] 메시지 전송 중 오류가 발생했습니다.");
        // API로부터 받은 에러 응답이 있다면 상세 내용을 출력합니다.
        if (error.response) {
            console.error("응답 상태:", error.response.status);
            console.error("응답 데이터:", error.response.data);
        } else {
            console.error("에러 메시지:", error.message);
        }
    }
}

module.exports = { sendNotification };
