/**
 * 객체 관리 유틸리티 모듈
 */

// DOM 요소
const loadingOverlay = document.getElementById('loading-overlay');

/**
 * 로딩 표시
 */
export function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * 로딩 숨기기
 */
export function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
} 