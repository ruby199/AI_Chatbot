class GeminiChatbot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.loading = document.getElementById('loading');
        this.charCount = document.getElementById('charCount');
        
        this.initializeEventListeners();
        this.setInitialTime();
    }

    initializeEventListeners() {
        // 전송 버튼 클릭
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter 키 입력
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 글자 수 카운터
        this.messageInput.addEventListener('input', () => {
            const count = this.messageInput.value.length;
            this.charCount.textContent = count;
            
            if (count > 900) {
                this.charCount.style.color = '#dc3545';
            } else if (count > 800) {
                this.charCount.style.color = '#ffc107';
            } else {
                this.charCount.style.color = '#6c757d';
            }
        });
    }

    setInitialTime() {
        const initialTimeElement = document.getElementById('initialTime');
        if (initialTimeElement) {
            initialTimeElement.textContent = this.getCurrentTime();
        }
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message) {
            this.showError('메시지를 입력해주세요.');
            return;
        }

        // 사용자 메시지 표시
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.charCount.textContent = '0';
        this.charCount.style.color = '#6c757d';
        
        // UI 비활성화
        this.setInputState(false);
        this.showLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (data.success) {
                this.addMessage(data.reply, 'bot');
            } else {
                throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
            }

        } catch (error) {
            console.error('Error:', error);
            this.addMessage(
                `죄송합니다. 오류가 발생했습니다: ${error.message}`, 
                'bot', 
                true
            );
        } finally {
            this.setInputState(true);
            this.showLoading(false);
            this.messageInput.focus();
        }
    }

    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'user') {
            messageContent.innerHTML = `<strong>나:</strong> ${this.escapeHtml(content)}`;
        } else {
            messageContent.innerHTML = `<strong>AI:</strong> ${this.formatBotMessage(content)}`;
            if (isError) {
                messageContent.style.color = '#dc3545';
                messageContent.style.borderColor = '#dc3545';
            }
        }
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatBotMessage(content) {
        // 기본적인 마크다운 스타일 지원
        return this.escapeHtml(content)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: #f8f9fa; padding: 2px 4px; border-radius: 3px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setInputState(enabled) {
        this.messageInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
        
        if (enabled) {
            this.messageInput.focus();
        }
    }

    showLoading(show) {
        this.loading.style.display = show ? 'block' : 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    showError(message) {
        // 간단한 에러 알림
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: fadeIn 0.3s ease-in;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// 페이지 로드 시 챗봇 초기화
document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});
