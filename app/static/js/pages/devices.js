/**
 * 장비 관리 페이지 모듈
 * 
 * 이 파일은 장비 관리 페이지의 모든 기능을 처리합니다.
 * - 장비 목록 조회 및 검색
 * - 장비 삭제 모달
 * - 엑셀 업로드 모달
 * - 장비 동기화 모달
 * - 탭 기능
 */

// 유틸리티 함수
/**
 * 버튼 상태 업데이트
 * @param {HTMLElement} button - 업데이트할 버튼 요소
 * @param {boolean} isLoading - 로딩 중 여부
 * @param {string} loadingText - 로딩 중 표시할 텍스트
 * @param {string} defaultText - 기본 텍스트
 */
function updateButtonState(button, isLoading, loadingText, defaultText) {
    if (!button) return;
    
    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : defaultText;
}

/**
 * 결과 메시지 표시
 * @param {HTMLElement} container - 결과 메시지 컨테이너
 * @param {HTMLElement} messageElement - 메시지 요소
 * @param {string} message - 표시할 메시지
 * @param {boolean} isSuccess - 성공 여부
 */
function showResultMessage(container, messageElement, message, isSuccess) {
    if (!container || !messageElement) return;
    
    container.style.display = 'block';
    messageElement.textContent = message;
    messageElement.className = isSuccess ? 'text-success' : 'text-danger';
}

/**
 * 장비 관리 페이지 초기화
 */
function initDevicesPage() {
    if (window.SearchModule) {
        window.SearchModule.initTableSearch('deviceSearch', '.data-table');
    }
    
    if (window.ValidationModule) {
        window.ValidationModule.initIpAddressValidation();
    }
    
    if (window.AlertsModule) {
        window.AlertsModule.initAutoHideAlerts();
    }
    
    initDeleteModal();
    initUploadModal();
    initSyncModal();
    initPaginationAndSearch();
}

/**
 * 삭제 모달 초기화
 */
function initDeleteModal() {
    if (window.ModalModule) {
        const deviceNameElement = document.getElementById('deviceName');
        const deleteForm = document.getElementById('deleteForm');
        
        window.ModalModule.initModal('deleteModal', {
            openSelector: '.delete-btn',
            cancelSelector: '#cancelDelete',
            onOpen: function(modal, button) {
                if (button) {
                    const deviceId = button.getAttribute('data-id');
                    const deviceName = button.getAttribute('data-name');
                    
                    deviceNameElement.textContent = deviceName;
                    deleteForm.action = `/devices/${deviceId}/delete`;
                }
            }
        });
    }
}

/**
 * 엑셀 업로드 모달 초기화
 */
function initUploadModal() {
    if (window.ModalModule) {
        window.ModalModule.initModal('uploadModal', {
            openSelector: '#uploadExcelBtn',
            cancelSelector: '#cancelUpload',
            onOpen: function() {
                document.getElementById('excelFile').value = '';
                document.getElementById('uploadResult').style.display = 'none';
            }
        });
        
        const submitBtn = document.getElementById('submitUpload');
        if (submitBtn) {
            submitBtn.addEventListener('click', uploadExcelFile);
        }
    }
}

/**
 * 엑셀 파일 업로드 처리
 */
function uploadExcelFile() {
    const fileInput = document.getElementById('excelFile');
    const resultDiv = document.getElementById('uploadResult');
    const resultMessage = document.getElementById('resultMessage');
    const errorList = document.getElementById('errorList');
    const errorListUl = errorList.querySelector('ul');
    const submitBtn = document.getElementById('submitUpload');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('파일을 선택해주세요.');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    updateButtonState(submitBtn, true, '업로드 중...', '업로드');
    
    resultDiv.style.display = 'none';
    errorList.style.display = 'none';
    errorListUl.innerHTML = '';
    
    fetch('/devices/upload-excel', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        showResultMessage(resultDiv, resultMessage, data.message, data.success);
        
        if (data.success) {
            if (data.errors && data.errors.length > 0) {
                errorList.style.display = 'block';
                data.errors.forEach(error => {
                    const li = document.createElement('li');
                    li.textContent = error;
                    errorListUl.appendChild(li);
                });
            }
            
            setTimeout(() => window.location.reload(), 3000);
        }
    })
    .catch(error => {
        showResultMessage(resultDiv, resultMessage, '업로드 중 오류가 발생했습니다: ' + error.message, false);
    })
    .finally(() => {
        updateButtonState(submitBtn, false, '업로드 중...', '업로드');
    });
}

/**
 * 탭 기능 초기화
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tabId = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * 장비 삭제 확인
 */
function confirmDelete() {
    if (confirm('정말로 이 장비를 삭제하시겠습니까?')) {
        document.getElementById('delete-form').submit();
    }
}

/**
 * 동기화 모달 초기화
 */
function initSyncModal() {
    // 동기화 모듈이 직접 모달을 처리하므로 여기서는 추가 초기화할 필요 없음
    // SyncModule이 없는 경우에만 기본 처리
    if (!window.SyncModule) {
        // 동기화 버튼 이벤트 리스너
        const syncButtons = document.querySelectorAll('.sync-btn');
        const syncModal = document.getElementById('syncModal');
        const modalOverlay = document.getElementById('modal-overlay');
        
        if (syncButtons.length > 0 && syncModal) {
            syncButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const deviceId = this.getAttribute('data-id');
                    const deviceName = this.getAttribute('data-name');
                    
                    // 장비 이름 설정
                    const deviceNameElement = document.getElementById('syncDeviceName');
                    if (deviceNameElement) {
                        deviceNameElement.textContent = deviceName;
                    }
                    
                    // 전체 선택
                    const checkboxes = syncModal.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(checkbox => checkbox.checked = true);
                    
                    // 모달 표시
                    syncModal.classList.add('active');
                    modalOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            });
            
            // 닫기 버튼
            const closeButtons = syncModal.querySelectorAll('.modal-close, #cancelSync');
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    syncModal.classList.remove('active');
                    modalOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
            
            // 동기화 시작 버튼
            const submitBtn = document.getElementById('submitSync');
            if (submitBtn) {
                submitBtn.addEventListener('click', function() {
                    // 최소한의 폼 검증
                    const checkedBoxes = syncModal.querySelectorAll('input[name="sync_type"]:checked');
                    if (checkedBoxes.length === 0) {
                        alert('동기화할 항목을 하나 이상 선택해주세요.');
                        return;
                    }
                    
                    // 여기서는 간단한 확인 메시지만 표시
                    alert('동기화가 시작되었습니다. 장비 목록에서 진행 상황을 확인하세요.');
                    
                    // 모달 닫기
                    syncModal.classList.remove('active');
                    modalOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
        }
    }
}

/**
 * 동기화 취소 버튼 초기화
 */
function initCancelSyncButtons() {
    const cancelButtons = document.querySelectorAll('.cancel-sync-btn');
    
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.getAttribute('data-id');
            const deviceName = this.getAttribute('data-name');
            
            if (confirm(`${deviceName} 장비의 동기화 작업을 취소하시겠습니까?`)) {
                cancelSyncTask(taskId);
            }
        });
    });
}

/**
 * 동기화 작업 취소
 */
function cancelSyncTask(taskId) {
    fetch(`/devices/api/tasks/${taskId}/cancel`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            refreshDevicesList();
        } else {
            alert(`작업 취소 실패: ${data.message}`);
        }
    })
    .catch(error => {
        console.error('작업 취소 중 오류:', error);
        alert('작업 취소 중 오류가 발생했습니다.');
    });
}

/**
 * 페이지네이션 및 검색 이벤트 초기화
 */
function initPaginationAndSearch() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.page-link')) {
            e.preventDefault();
            const page = e.target.dataset.page;
            const searchQuery = document.getElementById('deviceSearch')?.value || '';
            loadDevices(page, searchQuery);
        }
    });

    const searchInput = document.getElementById('deviceSearch');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadDevices(1, this.value), 300);
        });
    }
}

/**
 * 장비 목록 로드
 * @param {number} page - 페이지 번호
 * @param {string} search - 검색어
 */
function loadDevices(page, search = '') {
    const tableBody = document.getElementById('devices-table-body');
    const paginationContainer = document.querySelector('.pagination-container');
    
    if (!tableBody || !paginationContainer) return;
    
    fetch(`/devices/list?page=${page}&search=${encodeURIComponent(search)}`, {
        headers: {'X-Requested-With': 'XMLHttpRequest'}
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        tableBody.innerHTML = data.html;
        paginationContainer.innerHTML = data.pagination;
        
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        if (search) {
            url.searchParams.set('search', search);
        } else {
            url.searchParams.delete('search');
        }
        window.history.replaceState({}, '', url);
    })
    .catch(error => console.error('장비 목록 로드 중 오류 발생:', error));
}

/**
 * 장비 목록 새로고침
 */
function refreshDevicesList() {
    const tableBody = document.getElementById('devices-table-body');
    const paginationContainer = document.querySelector('.pagination-container');
    
    if (!tableBody) return;
    
    // 현재 페이지 및 검색어 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 1;
    const search = urlParams.get('search') || '';
    
    // AJAX 요청
    fetch(`/devices/list?page=${page}&search=${search}`, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        // 테이블 내용 업데이트
        if (tableBody) {
            tableBody.innerHTML = data.html;
        }
        
        // 페이지네이션 업데이트
        if (paginationContainer) {
            paginationContainer.innerHTML = data.pagination;
        }
        
        // 이벤트 리스너 다시 설정
        initDeleteModal();
        initCancelSyncButtons();
        
        // 프로그레스 바 초기화
        if (window.initProgressBars) {
            window.initProgressBars();
        }
    })
    .catch(error => {
        console.error('장비 목록 갱신 중 오류:', error);
    });
}

// DOMContentLoaded 이벤트에서 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.devices-container')) {
        initDevicesPage();
    }
    
    if (document.querySelector('.device-detail-container')) {
        initTabs();
    }
});

// 전역 스코프로 내보내기
window.initDevicesPage = initDevicesPage;
window.confirmDelete = confirmDelete;