// Configuration and State
const CONFIG = {
    // Leave empty to use same-origin and nginx proxy inside container.
    apiUrl: '',
    font: 'Noto Sans Syriac',
    fontSize: 16,
    temperature: 0.8,
    maxTokens: 50,
    topK: 40,
    modelId: null  // null = use API default
};

let isConnected = false;
let isSending = false;

// DOM Elements
const elements = {
    chatContainer: document.getElementById('chatContainer'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    settingsBtn: document.getElementById('settingsBtn'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    settingsPanel: document.getElementById('settingsPanel'),
    fontSelect: document.getElementById('fontSelect'),
    fontSizeRange: document.getElementById('fontSizeRange'),
    fontSizeValue: document.getElementById('fontSizeValue'),
    temperatureRange: document.getElementById('temperatureRange'),
    temperatureValue: document.getElementById('temperatureValue'),
    maxTokensInput: document.getElementById('maxTokensInput'),
    topKInput: document.getElementById('topKInput'),
    apiUrlInput: document.getElementById('apiUrlInput'),
    modelSelect: document.getElementById('modelSelect'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    reconnectBtn: document.getElementById('reconnectBtn'),
    modelIndicator: document.getElementById('modelIndicator')
};

// Cache for models response
let MODELS_CACHE = null;

// Initialize App
async function init() {
    loadSettings();
    attachEventListeners();
    await checkConnection();
    await loadAvailableModels();
    
    // Auto-resize textarea
    elements.messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Load available models from API
async function loadAvailableModels() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/models`);
        if (response.ok) {
            const data = await response.json();
            MODELS_CACHE = data;
            const select = elements.modelSelect;
            select.innerHTML = '<option value="">API Default</option>';
            
            Object.keys(data.models || {}).forEach(modelId => {
                const model = data.models[modelId];
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = model.description || modelId;
                if (model.disabled) {
                    option.disabled = true;
                    option.textContent += ' (unavailable)';
                }
                select.appendChild(option);
            });
            
            // Restore saved selection
            if (CONFIG.modelId) {
                select.value = CONFIG.modelId;
            }

            updateModelIndicator();
        }
    } catch (e) {
        console.warn('Failed to load models:', e);
    }
}

function updateModelIndicator() {
    if (!elements.modelIndicator) return;
    if (CONFIG.modelId) {
        elements.modelIndicator.textContent = `Model: ${CONFIG.modelId}`;
        // If we have a description, set tooltip
        if (MODELS_CACHE && MODELS_CACHE.models && MODELS_CACHE.models[CONFIG.modelId]) {
            elements.modelIndicator.title = MODELS_CACHE.models[CONFIG.modelId].description || CONFIG.modelId;
        } else {
            elements.modelIndicator.title = 'Selected model';
        }
    } else if (MODELS_CACHE && MODELS_CACHE.active) {
        elements.modelIndicator.textContent = `Model: ${MODELS_CACHE.active} (API default)`;
        elements.modelIndicator.title = 'Using API active model';
    } else {
        elements.modelIndicator.textContent = 'Model: API Default';
        elements.modelIndicator.title = 'Using API active model';
    }
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('modernAssyrianGPTSettings');
    if (saved) {
        Object.assign(CONFIG, JSON.parse(saved));
        // Backward compatibility: previously saved 'Ramsina' maps to new internal name
        if (CONFIG.font === 'Ramsina') {
            CONFIG.font = 'Ramsina TestA';
        }
        elements.fontSelect.value = CONFIG.font;
        elements.fontSizeRange.value = CONFIG.fontSize;
        elements.fontSizeValue.textContent = CONFIG.fontSize;
        elements.temperatureRange.value = CONFIG.temperature;
        elements.temperatureValue.textContent = CONFIG.temperature;
        elements.maxTokensInput.value = CONFIG.maxTokens;
        elements.topKInput.value = CONFIG.topK;
        elements.apiUrlInput.value = CONFIG.apiUrl;
        if (CONFIG.modelId && elements.modelSelect) {
            elements.modelSelect.value = CONFIG.modelId;
        }
    }
    applyFontSettings();
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('modernAssyrianGPTSettings', JSON.stringify(CONFIG));
}

// Apply font settings
function applyFontSettings() {
    const messages = document.querySelectorAll('.message-text');
    messages.forEach(msg => {
        msg.style.fontFamily = `'${CONFIG.font}', serif`;
        msg.style.fontSize = `${CONFIG.fontSize}px`;
    });
    elements.messageInput.style.fontFamily = `'${CONFIG.font}', -apple-system, sans-serif`;
    elements.messageInput.style.fontSize = `${CONFIG.fontSize}px`;
}

// Attach event listeners
function attachEventListeners() {
    // Send message
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Reconnect button
    elements.reconnectBtn.addEventListener('click', () => {
        console.log('Manual reconnect triggered');
        checkConnection();
    });

    // Settings
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.add('active');
    });

    elements.closeSettingsBtn.addEventListener('click', () => {
        elements.settingsPanel.classList.remove('active');
    });

    // Font settings
    elements.fontSelect.addEventListener('change', (e) => {
        CONFIG.font = e.target.value;
        applyFontSettings();
        saveSettings();
    });

    elements.fontSizeRange.addEventListener('input', (e) => {
        CONFIG.fontSize = parseInt(e.target.value);
        elements.fontSizeValue.textContent = CONFIG.fontSize;
        applyFontSettings();
        saveSettings();
    });

    // Generation settings
    elements.temperatureRange.addEventListener('input', (e) => {
        CONFIG.temperature = parseFloat(e.target.value);
        elements.temperatureValue.textContent = CONFIG.temperature;
        saveSettings();
    });

    elements.maxTokensInput.addEventListener('change', (e) => {
        CONFIG.maxTokens = parseInt(e.target.value);
        saveSettings();
    });

    elements.topKInput.addEventListener('change', (e) => {
        CONFIG.topK = parseInt(e.target.value);
        saveSettings();
    });

    elements.apiUrlInput.addEventListener('change', (e) => {
        CONFIG.apiUrl = e.target.value;
        saveSettings();
        checkConnection();
    });

    elements.modelSelect.addEventListener('change', (e) => {
        CONFIG.modelId = e.target.value || null;
        saveSettings();
        updateModelIndicator();
    });

    // Close settings when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.settingsPanel.contains(e.target) && 
            !elements.settingsBtn.contains(e.target) &&
            elements.settingsPanel.classList.contains('active')) {
            elements.settingsPanel.classList.remove('active');
        }
    });
}

// Check API connection
async function checkConnection() {
    console.log('Checking connection to:', CONFIG.apiUrl);
    elements.reconnectBtn.style.display = 'none'; // Hide during check
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(`${CONFIG.apiUrl}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            isConnected = true;
            elements.statusIndicator.classList.add('connected');
            elements.statusText.textContent = `Connected (${data.device})`;
            elements.reconnectBtn.style.display = 'none';
            console.log('API connection successful:', data);
        } else {
            throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        isConnected = false;
        elements.statusIndicator.classList.remove('connected');
        const errorMsg = error.name === 'AbortError' 
            ? 'Connection timeout - API not responding' 
            : `Connection error: ${error.message}`;
        elements.statusText.textContent = errorMsg;
        elements.reconnectBtn.style.display = 'inline-block'; // Show reconnect button
        console.error('Connection error details:', {
            apiUrl: CONFIG.apiUrl,
            error: error.message,
            type: error.name
        });
        
        // Retry after 10 seconds (not 3, to avoid hammering)
        setTimeout(checkConnection, 10000);
    }
}

// Send message
async function sendMessage() {
    if (isSending) return;
    
    const message = elements.messageInput.value.trim();
    if (!message) return;

    if (!isConnected) {
        showError('Not connected to API server. Retrying connection...');
        checkConnection(); // Retry connection immediately
        return;
    }

    isSending = true;
    elements.sendBtn.disabled = true;

    // Clear input
    elements.messageInput.value = '';
    elements.messageInput.style.height = 'auto';

    // Remove welcome message if present
    const welcomeMsg = elements.chatContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // Add user message
    addMessage(message, 'user');

    // Add loading indicator
    const loadingId = addLoadingMessage();

    try {
        const payload = {
            prompt: message,
            max_new_tokens: CONFIG.maxTokens,
            temperature: CONFIG.temperature,
            top_k: CONFIG.topK
        };
        if (CONFIG.modelId) {
            payload.model_id = CONFIG.modelId;
        }
        
        const response = await fetch(`${CONFIG.apiUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Remove loading indicator
        removeLoadingMessage(loadingId);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Generation failed');
        }

        const data = await response.json();
        
        // Fetch current metrics
        let metrics = null;
        try {
            const metricsResponse = await fetch(`${CONFIG.apiUrl}/metrics`);
            if (metricsResponse.ok) {
                metrics = await metricsResponse.json();
            }
        } catch (e) {
            console.warn('Failed to fetch metrics:', e);
        }
        
        // Add assistant response with metrics
        addMessage(data.generated_text, 'assistant', metrics);

    } catch (error) {
        removeLoadingMessage(loadingId);
        showError(`Error: ${error.message}`);
        console.error('Generation error:', error);
    } finally {
        isSending = false;
        elements.sendBtn.disabled = false;
        elements.messageInput.focus();
    }
}

// Add message to chat
function addMessage(text, sender, metrics = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const time = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let metricsHtml = '';
    if (metrics && sender === 'assistant') {
        const tokensPerSec = metrics.avg_tokens_per_second || 0;
        const lastLatency = metrics.last_request_latency || 0;
        const totalTokens = metrics.total_generated_tokens || 0;
        const activeModel = metrics.active_model_id || 'unknown';
        
        metricsHtml = `
            <div class="message-metrics">
                <span class="metric-item">🤖 ${escapeHtml(activeModel)}</span>
                <span class="metric-item">⚡ ${tokensPerSec.toFixed(1)} tok/s</span>
                <span class="metric-item">⏱️ ${lastLatency.toFixed(2)}s</span>
                <span class="metric-item">📊 ${totalTokens} total</span>
            </div>
        `;
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <button class="copy-btn" title="Copy to clipboard" aria-label="Copy message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
            <div class="message-text" style="font-family: '${CONFIG.font}', serif; font-size: ${CONFIG.fontSize}px;">
                ${escapeHtml(text)}
            </div>
            ${metricsHtml}
            <span class="message-time">${time}</span>
        </div>
    `;
    
    elements.chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

// Add loading indicator
function addLoadingMessage() {
    const loadingId = `loading-${Date.now()}`;
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant loading';
    loadingDiv.id = loadingId;
    
    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        </div>
    `;
    
    elements.chatContainer.appendChild(loadingDiv);
    scrollToBottom();
    return loadingId;
}

// Remove loading indicator
function removeLoadingMessage(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    elements.chatContainer.appendChild(errorDiv);
    scrollToBottom();
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
}

// Scroll to bottom
function scrollToBottom() {
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Reconnect periodically
setInterval(() => {
    if (!isConnected) {
        checkConnection();
    }
}, 30000); // Check every 30 seconds

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Copy helpers
async function copyTextToClipboard(text) {
    // Try modern async clipboard API first
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (_) {
        // fall through to legacy
    }
    // Legacy fallback using a temporary textarea
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.pointerEvents = 'none';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch (err) {
        console.warn('Legacy copy failed:', err);
        return false;
    }
}

// Global event delegation for copy buttons
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const content = btn.closest('.message-content');
    if (!content) return;
    const textEl = content.querySelector('.message-text');
    const text = textEl ? textEl.innerText : '';
    if (!text) return;
    const success = await copyTextToClipboard(text);
    if (success) {
        btn.classList.add('copied');
        const prevTitle = btn.title;
        btn.title = 'Copied!';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.title = prevTitle;
        }, 1000);
    } else {
        console.warn('Copy not permitted by browser or context.');
    }
});

// Set dynamic copyright year
document.getElementById('copyrightYear').textContent = new Date().getFullYear();
