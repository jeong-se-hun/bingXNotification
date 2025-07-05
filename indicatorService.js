
// indicatorService.js
// technicalindicators 라이브러리를 사용하여 기술적 지표를 계산합니다.

const { RSI, BollingerBands } = require('technicalindicators');

/**
 * RSI (상대강도지수)를 계산합니다.
 * @param {Array<number>} closePrices - 필수. 종가 데이터 배열.
 * @param {number} period - 필수. RSI 계산에 사용할 기간 (일반적으로 14).
 * @returns {number | null} 계산된 마지막 RSI 값. 계산이 불가능하면 null을 반환.
 */
function calculateRSI(closePrices, period = 14) {
    // 계산에 필요한 최소 데이터 길이를 확인합니다.
    if (closePrices.length < period) {
        return null;
    }

    // RSI.calculate 함수는 RSI 값의 배열을 반환합니다.
    const rsiResult = RSI.calculate({
        values: closePrices, // 종가 배열
        period: period,      // 계산 기간
    });

    // 계산된 RSI 배열에서 마지막 값을 반환합니다.
    return rsiResult.length > 0 ? rsiResult[rsiResult.length - 1] : null;
}

/**
 * 볼린저 밴드 값을 계산합니다.
 * @param {Array<number>} closePrices - 필수. 종가 데이터 배열.
 * @param {number} period - 필수. 이동평균선 기간 (일반적으로 20).
 * @param {number} stdDev - 필수. 상하단 밴드의 표준편차 (일반적으로 2).
 * @returns {{upper: number, middle: number, lower: number} | null} 마지막 볼린저 밴드 값 (상단, 중간, 하단). 계산 불가능 시 null 반환.
 */
function calculateBollingerBands(closePrices, period = 20, stdDev = 2) {
    // 계산에 필요한 최소 데이터 길이를 확인합니다.
    if (closePrices.length < period) {
        return null;
    }

    // BollingerBands.calculate 함수는 BB 값 객체의 배열을 반환합니다.
    const bbResult = BollingerBands.calculate({
        values: closePrices, // 종가 배열
        period: period,      // 이동평균 기간
        stdDev: stdDev,      // 표준편차
    });

    // 계산된 BB 배열에서 마지막 값을 반환합니다.
    return bbResult.length > 0 ? bbResult[bbResult.length - 1] : null;
}

module.exports = {
    calculateRSI,
    calculateBollingerBands,
};
""
