/**
 * 정책 엑셀 내보내기 관련 기능을 담당하는 모듈
 */

import { showLoading, hideLoading } from './utils.js';

/**
 * 엑셀 내보내기 모듈 초기화
 * @param {Function} getPoliciesData - 정책 데이터를 가져오는 함수
 * @returns {Object} - 엑셀 내보내기 관련 메서드를 포함한 객체
 */
export function initExport(getPoliciesData) {
    // 엑셀 내보내기 버튼
    const exportBtn = document.getElementById('exportExcelBtn');
    
    // 엑셀 내보내기 버튼 이벤트 리스너
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToExcel);
    }
    
    /**
     * 엑셀 파일로 내보내기
     */
    async function exportToExcel() {
        try {
            // 로딩 표시
            showLoading();
            
            // 내보내기 버튼 비활성화 및 로딩 표시
            if (exportBtn) {
                exportBtn.disabled = true;
                exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 내보내는 중...';
            }
            
            // 정책 데이터 가져오기 (필터 정보 포함)
            const policiesData = await getPoliciesData();
            
            // 검색 파라미터 가져오기
            const deviceId = document.getElementById('deviceFilter')?.value || '';
            const status = document.getElementById('statusFilter')?.value || '';
            const search = document.getElementById('policySearch')?.value || '';
            
            console.log('엑셀 내보내기 파라미터 준비:', { deviceId, status, search });
            
            // API 요청 데이터 구성
            const requestData = {
                device_id: deviceId,
                enable: status,
                search: search,
                filters: policiesData.filters || [] // 필터 정보 다시 추가
            };
            
            console.log('엑셀 내보내기 요청 데이터:', requestData);
            
            // AJAX 요청 (Blob 형식으로 받기)
            fetch('/policies/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('서버 응답 오류: ' + response.status);
                }
                
                // Content-Type 확인
                const contentType = response.headers.get('Content-Type');
                console.log('응답 Content-Type:', contentType);
                
                if (contentType && contentType.includes('application/json')) {
                    // JSON 응답인 경우 (오류 메시지 등)
                    return response.json().then(data => {
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        if (data.message === 'no_data') {
                            throw new Error('내보낼 데이터가 없습니다.');
                        }
                        throw new Error('알 수 없는 응답 형식입니다.');
                    });
                }
                
                // Blob 응답인 경우 (엑셀 파일)
                return response.blob();
            })
            .then(blob => {
                // 다운로드 링크 생성
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                const now = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
                a.href = url;
                a.download = `firewall_policies_${now}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                // 성공 메시지 표시
                alert('엑셀 파일이 생성되었습니다.');
                
                // 버튼 상태 복원
                if (exportBtn) {
                    exportBtn.disabled = false;
                    exportBtn.innerHTML = '<i class="fas fa-download"></i> 엑셀 내보내기';
                }
                
                // 로딩 숨기기
                hideLoading();
            })
            .catch(error => {
                // 오류 처리
                console.error('엑셀 내보내기 중 오류 발생:', error);
                alert(error.message || '엑셀 파일 생성 중 오류가 발생했습니다.');
                
                // 버튼 상태 복원
                if (exportBtn) {
                    exportBtn.disabled = false;
                    exportBtn.innerHTML = '<i class="fas fa-download"></i> 엑셀 내보내기';
                }
                
                // 로딩 숨기기
                hideLoading();
            });
        } catch (error) {
            console.error('엑셀 내보내기 중 오류 발생:', error);
            alert(error.message || '엑셀 내보내기 중 오류가 발생했습니다.');
            
            // 버튼 상태 복원
            if (exportBtn) {
                exportBtn.disabled = false;
                exportBtn.innerHTML = '<i class="fas fa-download"></i> 엑셀 내보내기';
            }
            
            hideLoading();
        }
    }
    
    // 공개 메서드 반환
    return {
        exportToExcel
    };
} 