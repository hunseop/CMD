/**
 * 정책 페이지 스크립트
 * 모듈화된 코드를 사용하도록 수정됨
 */

// 모듈 가져오기
import { initPolicies } from '../modules/policies/policies.js';

// DOM이 로드된 후 정책 모듈 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 정책 모듈 초기화
    initPolicies();
}); 