/**
 * 동기화 모듈
 * 
 * 장비 동기화 작업을 관리하는 모듈
 */

const SyncModule = (function() {
    // 상수
    const POLL_INTERVAL = 1000;  // 작업 상태 확인 간격 (ms)
    
    // 상태 관련 변수
    let currentTaskId = null;
    let currentDeviceId = null;
    let pollTimer = null;
    let modalInstance = null;
    let elapsedTimeCounter = null;
    let elapsedSeconds = 0;
    
    // 웹소켓 관련 변수
    let socket = null;
    
    /**
     * 동기화 모듈 초기화
     * @param {Object} options - 초기화 옵션
     */
    function init(options = {}) {
        // 모달 설정
        if (window.ModalModule) {
            modalInstance = window.ModalModule.initModal('syncModal', {
                openSelector: '.sync-btn',
                cancelSelector: '#cancelSync',
                onOpen: handleModalOpen,
                onClose: handleModalClose
            });
        }
        
        // 이벤트 리스너 설정
        const selectAllCheckbox = document.getElementById('selectAll');
        const syncForm = document.getElementById('syncForm');
        const submitBtn = document.getElementById('submitSync');
        const stopBtn = document.getElementById('stopSync');
        const hideBtn = document.getElementById('hideModal');
        const closeResultBtn = document.getElementById('closeResult');
        
        // 전체 선택 이벤트
        if (selectAllCheckbox && syncForm) {
            const checkboxes = syncForm.querySelectorAll('input[name="sync_type"]');
            
            selectAllCheckbox.addEventListener('change', function() {
                checkboxes.forEach(checkbox => checkbox.checked = this.checked);
            });
            
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    selectAllCheckbox.checked = Array.from(checkboxes).every(cb => cb.checked);
                });
            });
        }
        
        // 동기화 시작 버튼
        if (submitBtn) {
            submitBtn.addEventListener('click', startSync);
        }
        
        // 동기화 중단 버튼
        if (stopBtn) {
            stopBtn.addEventListener('click', cancelSync);
        }
        
        // 모달 숨김 버튼
        if (hideBtn) {
            hideBtn.addEventListener('click', function() {
                if (modalInstance) {
                    modalInstance.close();
                }
            });
        }
        
        // 결과 닫기 버튼
        if (closeResultBtn) {
            closeResultBtn.addEventListener('click', function() {
                if (modalInstance) {
                    modalInstance.close();
                }
            });
        }
        
        // 취소 버튼 이벤트 리스너
        initCancelButtons();
    }
    
    /**
     * 모달 열기 이벤트 핸들러
     * @param {HTMLElement} modal - 모달 요소
     * @param {HTMLElement} button - 클릭된 버튼
     */
    function handleModalOpen(modal, button) {
        if (!button) return;
        
        // 초기 상태로 설정
        resetModal();
        
        // 장비 정보 설정
        const deviceId = button.getAttribute('data-id');
        const deviceName = button.getAttribute('data-name');
        
        currentDeviceId = deviceId;
        
        const deviceNameElement = document.getElementById('syncDeviceName');
        if (deviceNameElement) {
            deviceNameElement.textContent = deviceName;
        }
        
        // 폼 초기화
        const syncForm = document.getElementById('syncForm');
        if (syncForm) {
            syncForm.reset();
            
            // 모든 체크박스 선택
            const checkboxes = syncForm.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => checkbox.checked = true);
        }
    }
    
    /**
     * 모달 닫기 이벤트 핸들러
     */
    function handleModalClose() {
        // 작업 상태 폴링 중지
        stopPolling();
        
        // 시간 카운터 중지
        stopTimeCounter();
        
        // 웹소켓 연결 종료
        closeWebSocket();
    }
    
    /**
     * 동기화 작업 시작
     */
    function startSync() {
        const form = document.getElementById('syncForm');
        if (!form) return;
        
        // 선택된 동기화 유형 가져오기
        const formData = new FormData();
        const checkboxes = form.querySelectorAll('input[name="sync_type"]:checked');
        
        if (checkboxes.length === 0) {
            alert('동기화할 항목을 하나 이상 선택해주세요.');
            return;
        }
        
        checkboxes.forEach(checkbox => {
            formData.append('sync_type', checkbox.value);
        });
        
        // 버튼 상태 변경
        const submitBtn = document.getElementById('submitSync');
        if (submitBtn) {
            submitBtn.textContent = '동기화 중...';
            submitBtn.disabled = true;
        }
        
        // 동기화 작업 요청
        fetch(`/devices/${currentDeviceId}/sync`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // 성공 여부 확인
            if (data.success) {
                // 작업 ID 설정
                if (data.task) {
                    currentTaskId = data.task.id;
                    
                    // 작업 ID를 숨김 필드에 저장
                    const taskIdField = document.createElement('input');
                    taskIdField.type = 'hidden';
                    taskIdField.id = 'syncTaskId';
                    taskIdField.value = currentTaskId;
                    form.appendChild(taskIdField);
                    
                    // 폴링 시작
                    startPolling();
                    
                    // 시간 카운터 시작
                    startTimeCounter();
                    
                    // 진행 화면으로 전환
                    showProgressView();
                } else {
                    // 작업 정보가 없을 경우 결과 표시
                    showResultView(data.message, true);
                }
            } else {
                // 오류 메시지 표시
                showResultView(data.message, false);
            }
        })
        .catch(error => {
            // 오류 처리
            console.error('동기화 작업 요청 중 오류:', error);
            showResultView(`동기화 작업 요청 중 오류: ${error.message}`, false);
        })
        .finally(() => {
            // 버튼 상태 복원
            if (submitBtn) {
                submitBtn.textContent = '동기화 시작';
                submitBtn.disabled = false;
            }
        });
    }
    
    /**
     * 동기화 작업 취소
     */
    function cancelSync() {
        if (!currentTaskId) return;
        
        if (!confirm('정말로 동기화를 중단하시겠습니까?')) return;
        
        // 중단 버튼 비활성화
        const stopBtn = document.getElementById('stopSync');
        if (stopBtn) {
            stopBtn.disabled = true;
            stopBtn.textContent = '중단 중...';
        }
        
        // 작업 취소 요청
        fetch(`/devices/api/tasks/${currentTaskId}/cancel`, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showResultView('동기화가 취소되었습니다.', true);
            } else {
                showResultView(`취소 실패: ${data.message}`, false);
            }
        })
        .catch(error => {
            console.error('동기화 작업 취소 중 오류 발생:', error);
            showResultView(`동기화 취소 중 오류: ${error.message}`, false);
        })
        .finally(() => {
            // 중단 버튼 상태 복원
            if (stopBtn) {
                stopBtn.disabled = false;
                stopBtn.textContent = '동기화 중단';
            }
        });
    }
    
    /**
     * 작업 상태 폴링 시작
     */
    function startPolling() {
        if (!currentTaskId) return;
        
        // 이전 타이머 정리
        stopPolling();
        
        // 작업 상태 폴링
        pollTimer = setInterval(() => {
            fetch(`/devices/api/tasks/${currentTaskId}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(updateTaskStatus)
            .catch(error => {
                console.error('작업 상태 폴링 중 오류 발생:', error);
                stopPolling();
            });
        }, POLL_INTERVAL);
        
        // 첫 번째 상태 요청
        fetch(`/devices/api/tasks/${currentTaskId}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(updateTaskStatus)
        .catch(error => console.error('작업 상태 요청 중 오류 발생:', error));
    }
    
    /**
     * 작업 상태 폴링 중지
     */
    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }
    
    /**
     * 웹소켓 연결 초기화
     */
    function initWebSocket() {
        // 지원되지 않는 환경에서는 폴링 사용
        if (typeof WebSocket === 'undefined') {
            startPolling();
            return;
        }
        
        // 기존 연결 종료
        closeWebSocket();
        
        // 웹소켓 프로토콜은 http -> ws, https -> wss로 변환
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/tasks/${currentTaskId}`;
        
        try {
            socket = new WebSocket(wsUrl);
            
            socket.onopen = function() {
                console.log('웹소켓 연결 성공');
            };
            
            socket.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    updateTaskStatus(data);
                } catch (e) {
                    console.error('웹소켓 메시지 처리 중 오류 발생:', e);
                }
            };
            
            socket.onerror = function(error) {
                console.error('웹소켓 오류:', error);
                // 웹소켓 오류 시 폴링으로 대체
                startPolling();
            };
            
            socket.onclose = function() {
                console.log('웹소켓 연결 종료');
            };
        } catch (e) {
            console.error('웹소켓 연결 실패:', e);
            // 연결 실패 시 폴링 사용
            startPolling();
        }
    }
    
    /**
     * 웹소켓 연결 종료
     */
    function closeWebSocket() {
        if (socket) {
            socket.close();
            socket = null;
        }
    }
    
    /**
     * 작업 상태 업데이트
     * @param {Object} task - 작업 정보
     */
    function updateTaskStatus(task) {
        // 현재 작업 ID
        const taskId = document.getElementById('syncTaskId');
        if (!taskId || taskId.value != task.id) return;
        
        // 작업 상태 업데이트
        const progressBar = document.getElementById('syncProgressBar');
        if (progressBar) {
            // 너비 업데이트
            progressBar.style.width = `${task.progress}%`; 
            
            // 데이터 속성 업데이트 - CSS용
            progressBar.setAttribute('data-progress', task.progress);
        }
        
        // 진행률 퍼센트 업데이트
        const progressPercentage = document.getElementById('syncProgressPercentage');
        if (progressPercentage) {
            progressPercentage.textContent = `${task.progress}%`;
        }
        
        // 현재 작업 정보 업데이트
        const currentOperation = document.getElementById('syncCurrentOperation');
        let operationText = '준비 중...';
        
        if (task.current_sync_type) {
            operationText = `${task.current_sync_type} 동기화 중`;
        }
        
        if (task.message) {
            operationText += ` - ${task.message}`;
        }
        
        if (currentOperation) {
            currentOperation.textContent = operationText;
        }
        
        // 작업 완료 처리
        if (task.status === 'completed' || task.status === 'failed' || task.status === 'canceled') {
            stopPolling();
            stopTimeCounter();
            
            let message = '';
            let success = true;
            
            if (task.status === 'completed') {
                message = '동기화가 성공적으로 완료되었습니다.';
            } else if (task.status === 'failed') {
                message = `동기화 실패: ${task.message || '알 수 없는 오류'}`;
                success = false;
            } else if (task.status === 'canceled') {
                message = '동기화가 취소되었습니다.';
                success = false;
            }
            
            showResultView(message, success);
            
            // 장비 목록 새로고침
            refreshDevicesList();
        }
    }
    
    // 프로그레스 바 초기화 함수
    function initProgressBars() {
        const progressElements = document.querySelectorAll('.progress[data-progress]');
        
        progressElements.forEach(element => {
            const progress = element.getAttribute('data-progress');
            if (progress) {
                // 타임아웃은 애니메이션을 위한 것
                setTimeout(() => {
                    element.style.width = `${progress}%`;
                }, 50);
            }
        });
    }
    
    /**
     * 시간 카운터 시작
     */
    function startTimeCounter() {
        // 이전 카운터 정리
        stopTimeCounter();
        
        // 경과 시간 초기화
        elapsedSeconds = 0;
        updateTimeDisplay();
        
        // 카운터 시작
        elapsedTimeCounter = setInterval(() => {
            elapsedSeconds++;
            updateTimeDisplay();
        }, 1000);
    }
    
    /**
     * 시간 카운터 중지
     */
    function stopTimeCounter() {
        if (elapsedTimeCounter) {
            clearInterval(elapsedTimeCounter);
            elapsedTimeCounter = null;
        }
    }
    
    /**
     * 시간 표시 업데이트
     */
    function updateTimeDisplay() {
        const timeElement = document.getElementById('syncProgressTime');
        if (!timeElement) return;
        
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        timeElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * 옵션 화면 표시
     */
    function showOptionsView() {
        const optionsView = document.getElementById('syncOptionsView');
        const progressView = document.getElementById('syncProgressView');
        const resultView = document.getElementById('syncResultView');
        
        const optionsButtons = document.getElementById('syncOptionsButtons');
        const progressButtons = document.getElementById('syncProgressButtons');
        const resultButtons = document.getElementById('syncResultButtons');
        
        if (optionsView) optionsView.style.display = 'block';
        if (progressView) progressView.style.display = 'none';
        if (resultView) resultView.style.display = 'none';
        
        if (optionsButtons) optionsButtons.style.display = 'block';
        if (progressButtons) progressButtons.style.display = 'none';
        if (resultButtons) resultButtons.style.display = 'none';
    }
    
    /**
     * 진행 화면 표시
     */
    function showProgressView() {
        const optionsView = document.getElementById('syncOptionsView');
        const progressView = document.getElementById('syncProgressView');
        const resultView = document.getElementById('syncResultView');
        
        const optionsButtons = document.getElementById('syncOptionsButtons');
        const progressButtons = document.getElementById('syncProgressButtons');
        const resultButtons = document.getElementById('syncResultButtons');
        
        if (optionsView) optionsView.style.display = 'none';
        if (progressView) progressView.style.display = 'block';
        if (resultView) resultView.style.display = 'none';
        
        if (optionsButtons) optionsButtons.style.display = 'none';
        if (progressButtons) progressButtons.style.display = 'block';
        if (resultButtons) resultButtons.style.display = 'none';
    }
    
    /**
     * 결과 화면 표시
     * @param {string} message - 결과 메시지
     * @param {boolean} success - 성공 여부
     */
    function showResultView(message, success) {
        const optionsView = document.getElementById('syncOptionsView');
        const progressView = document.getElementById('syncProgressView');
        const resultView = document.getElementById('syncResultView');
        
        const optionsButtons = document.getElementById('syncOptionsButtons');
        const progressButtons = document.getElementById('syncProgressButtons');
        const resultButtons = document.getElementById('syncResultButtons');
        
        const resultMessage = document.getElementById('syncResultMessage');
        
        if (optionsView) optionsView.style.display = 'none';
        if (progressView) progressView.style.display = 'none';
        if (resultView) resultView.style.display = 'block';
        
        if (optionsButtons) optionsButtons.style.display = 'none';
        if (progressButtons) progressButtons.style.display = 'none';
        if (resultButtons) resultButtons.style.display = 'block';
        
        if (resultMessage) {
            resultMessage.textContent = message;
            resultMessage.className = success ? 'text-success' : 'text-danger';
        }
    }
    
    /**
     * 모달 초기화
     */
    function resetModal() {
        // 현재 상태 초기화
        currentTaskId = null;
        currentDeviceId = null;
        
        // 폴링 및 타이머 정리
        stopPolling();
        stopTimeCounter();
        closeWebSocket();
        
        // 초기 화면 설정
        showOptionsView();
        
        // 진행 상태 초기화
        const progressBar = document.getElementById('syncProgressBar');
        const progressPercentage = document.getElementById('syncProgressPercentage');
        const progressTime = document.getElementById('syncProgressTime');
        const currentOperation = document.getElementById('syncCurrentOperation');
        
        if (progressBar) progressBar.style.width = '0%';
        if (progressPercentage) progressPercentage.textContent = '0%';
        if (progressTime) progressTime.textContent = '00:00';
        if (currentOperation) currentOperation.textContent = '준비 중...';
    }
    
    /**
     * 장비 목록 갱신
     */
    function refreshDevicesList() {
        // 현재 페이지와 검색어 가져오기
        const url = new URL(window.location);
        const page = url.searchParams.get('page') || 1;
        const search = url.searchParams.get('search') || '';
        
        // 목록 갱신 요청
        fetch(`/devices/list?page=${page}&search=${encodeURIComponent(search)}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            // 테이블과 페이지네이션 업데이트
            const tableBody = document.getElementById('devices-table-body');
            const paginationContainer = document.querySelector('.pagination-container');
            
            if (tableBody) tableBody.innerHTML = data.html;
            if (paginationContainer) paginationContainer.innerHTML = data.pagination;
            
            // 취소 버튼 이벤트 리스너 재설정
            initCancelButtons();
            
            // 프로그레스 바 초기화
            if (window.initProgressBars) {
                window.initProgressBars();
            }
        })
        .catch(error => {
            console.error('장비 목록 갱신 중 오류 발생:', error);
        });
    }
    
    /**
     * 취소 버튼 이벤트 리스너 초기화
     */
    function initCancelButtons() {
        // 작업 취소 버튼 이벤트 설정
        const cancelButtons = document.querySelectorAll('.cancel-sync-btn');
        
        cancelButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                const taskId = this.getAttribute('data-id');
                const deviceName = this.getAttribute('data-name');
                
                if (confirm(`${deviceName}의 동기화를 취소하시겠습니까?`)) {
                    // 버튼 비활성화
                    this.disabled = true;
                    this.textContent = '취소 중...';
                    
                    // 취소 요청
                    fetch(`/devices/api/tasks/${taskId}/cancel`, {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`서버 오류: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            alert('동기화가 취소되었습니다.');
                            refreshDevicesList();
                        } else {
                            alert(`취소 실패: ${data.message}`);
                            this.disabled = false;
                            this.textContent = '동기화 취소';
                        }
                    })
                    .catch(error => {
                        console.error('동기화 취소 중 오류 발생:', error);
                        alert(`동기화 취소 중 오류: ${error.message}`);
                        this.disabled = false;
                        this.textContent = '동기화 취소';
                    });
                }
            });
        });
    }
    
    // 공개 API
    return {
        init: init,
        refreshDevicesList: refreshDevicesList
    };
})();

// 전역 변수에 할당
window.SyncModule = SyncModule; 