/**
 * 객체 페이지 스크립트
 * 모듈화된 코드를 사용하도록 수정됨
 */

// 모듈 가져오기
import { initObjects } from '../modules/objects/objects.js';

// DOM이 완전히 준비된 후 객체 모듈 초기화
window.addEventListener('load', () => {
    // 객체 모듈 초기화
    initObjects();
}); 