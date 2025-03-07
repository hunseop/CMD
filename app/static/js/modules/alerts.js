/**
 * 알림 메시지 자동 숨김 초기화
 * @param {string} selector - 알림 메시지 선택자
 * @param {number} timeout - 숨김 타이머 (ms)
 */
function initAutoHideAlerts(selector = '.alert', timeout = 3000) {
    const alerts = document.querySelectorAll(selector);
    
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 500);
        }, timeout);
    });
}

// 전역 스코프로 내보내기
window.AlertsModule = {
    initAutoHideAlerts
}; 