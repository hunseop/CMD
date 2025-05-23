/**
 * 모달 초기화
 * @param {string} modalId - 모달 요소 ID
 * @param {Object} options - 모달 옵션
 */
function initModal(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const modalOverlay = document.getElementById('modal-overlay');
    
    const defaults = {
        openSelector: null,
        closeSelector: '.modal-close, [data-dismiss="modal"]',
        cancelSelector: '[data-action="cancel"]',
        outsideClickClose: true,
        onOpen: null,
        onClose: null
    };
    
    const settings = { ...defaults, ...options };
    
    // 열기 버튼 이벤트
    if (settings.openSelector) {
        const openButtons = document.querySelectorAll(settings.openSelector);
        openButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                modal.classList.add('active');
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                if (typeof settings.onOpen === 'function') {
                    settings.onOpen(modal, this);
                }
            });
        });
    }
    
    // 닫기 버튼 이벤트
    const closeButtons = modal.querySelectorAll(settings.closeSelector);
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.classList.remove('active');
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            if (typeof settings.onClose === 'function') {
                settings.onClose(modal);
            }
        });
    });
    
    // 취소 버튼 이벤트
    const cancelButtons = modal.querySelectorAll(settings.cancelSelector);
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            modal.classList.remove('active');
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            if (typeof settings.onClose === 'function') {
                settings.onClose(modal);
            }
        });
    });
    
    // 외부 클릭 시 닫기
    if (settings.outsideClickClose) {
        modalOverlay.addEventListener('click', function() {
            modal.classList.remove('active');
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            if (typeof settings.onClose === 'function') {
                settings.onClose(modal);
            }
        });
    }
    
    return {
        open: function(data) {
            if (typeof settings.onOpen === 'function') {
                settings.onOpen(modal, null, data);
            }
            modal.classList.add('active');
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        },
        close: function() {
            modal.classList.remove('active');
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            
            if (typeof settings.onClose === 'function') {
                settings.onClose(modal);
            }
        }
    };
}

// 전역 스코프로 내보내기
window.ModalModule = {
    initModal
}; 