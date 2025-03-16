/**
 * 정책 모듈 진입점
 */

import { initPolicies } from './policies.js';

// DOM이 로드된 후 정책 모듈 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 정책 페이지인지 확인
    const isPoliciesPage = document.getElementById('policiesTable') !== null;
    
    if (isPoliciesPage) {
        // 정책 모듈 초기화
        initPolicies();
    }
}); 