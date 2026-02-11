/**
 * Radio Stream Player - JavaScript functionality
 * Handles audio playback, stream management, and local storage
 */

class RadioPlayer {
    constructor() {
        // DOM elements
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        this.streamForm = document.getElementById('streamForm');
        this.streamsContainer = document.getElementById('streamsContainer');
        this.currentStreamName = document.getElementById('currentStreamName');
        this.currentStreamUrl = document.getElementById('currentStreamUrl');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.errorClose = document.getElementById('errorClose');

        // State
        this.streams = [];
        this.currentStream = null;
        this.isPlaying = false;
        this.isLoading = false;

        // Storage key
        this.storageKey = 'radioStreamPlayer_streams';

        // Initialize
        this.init();
    }

    /**
     * Initialize the radio player
     */
    init() {
        this.loadStreams();
        this.setupEventListeners();
        this.setupAudioEvents();
        this.updateUI();
        this.setInitialVolume();
        
        console.log('Radio Player initialized');
    }

    /**
     * Setup event listeners for UI controls
     */
    setupEventListeners() {
        // Play/pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());

        // Stop button
        this.stopBtn.addEventListener('click', () => this.stopStream());

        // Volume control
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));

        // Stream form submission
        this.streamForm.addEventListener('submit', (e) => this.handleStreamSubmission(e));

        // Error message close
        this.errorClose.addEventListener('click', () => this.hideError());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Page visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * Setup audio element event listeners
     */
    setupAudioEvents() {
        // Audio can start playing
        this.audioPlayer.addEventListener('canplay', () => {
            this.isLoading = false;
            this.updateStatus('ready', 'Ready to play');
        });

        // Audio starts playing
        this.audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateStatus('playing', 'Playing');
        });

        // Audio paused
        this.audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updateStatus('paused', 'Paused');
        });

        // Audio ended (shouldn't happen with streams, but just in case)
        this.audioPlayer.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updateStatus('ended', 'Stream ended');
        });

        // Audio loading starts
        this.audioPlayer.addEventListener('loadstart', () => {
            this.isLoading = true;
            this.updateStatus('loading', 'Connecting...');
        });

        // Audio is waiting for data
        this.audioPlayer.addEventListener('waiting', () => {
            this.updateStatus('loading', 'Buffering...');
        });

        // Audio error occurred
        this.audioPlayer.addEventListener('error', (e) => {
            this.handleAudioError(e);
        });

        // Volume changed
        this.audioPlayer.addEventListener('volumechange', () => {
            this.updateVolumeDisplay();
        });
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyPress(e) {
        // Only handle shortcuts when not typing in input fields
        if (e.target.tagName === 'INPUT') return;

        switch(e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'KeyS':
                e.preventDefault();
                this.stopStream();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.adjustVolume(10);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.adjustVolume(-10);
                break;
        }
    }

    /**
     * Handle page visibility change
     */
    handleVisibilityChange() {
        // Optional: pause when tab becomes hidden
        // Uncomment the next line if you want this behavior
        // if (document.hidden && this.isPlaying) this.pauseStream();
    }

    /**
     * Set initial volume
     */
    setInitialVolume() {
        const savedVolume = localStorage.getItem('radioPlayer_volume') || 50;
        this.volumeSlider.value = savedVolume;
        this.updateVolume(savedVolume);
    }

    /**
     * Load streams from localStorage
     */
    loadStreams() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.streams = saved ? JSON.parse(saved) : this.getDefaultStreams();
            console.log(`Loaded ${this.streams.length} streams from storage`);
        } catch (error) {
            console.error('Error loading streams:', error);
            this.streams = this.getDefaultStreams();
            this.showError('Error loading saved streams. Using defaults.');
        }
    }

    /**
     * Get default sample streams
     */
    getDefaultStreams() {
        return [
            {
                id: 'sample1',
                name: 'BBC Radio 1',
                url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_radio_one'
            },
            {
                id: 'sample2',
                name: 'Jazz Radio',
                url: 'http://jazz-wr11.ice.infomaniak.ch/jazz-wr11-128.mp3'
            }
        ];
    }

    /**
     * Save streams to localStorage
     */
    saveStreams() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.streams));
            console.log('Streams saved to storage');
        } catch (error) {
            console.error('Error saving streams:', error);
            this.showError('Error saving streams to local storage.');
        }
    }

    /**
     * Handle stream form submission
     */
    handleStreamSubmission(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('streamName');
        const urlInput = document.getElementById('streamUrl');
        
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();

        if (!name || !url) {
            this.showError('Please enter both stream name and URL.');
            return;
        }

        // Validate URL format
        if (!this.isValidStreamUrl(url)) {
            this.showError('Please enter a valid stream URL (http:// or https://).');
            return;
        }

        // Check for duplicate names
        if (this.streams.some(stream => stream.name.toLowerCase() === name.toLowerCase())) {
            this.showError('A stream with this name already exists.');
            return;
        }

        // Add new stream
        const newStream = {
            id: Date.now().toString(),
            name: name,
            url: url
        };

        this.streams.push(newStream);
        this.saveStreams();
        this.renderStreams();

        // Clear form
        nameInput.value = '';
        urlInput.value = '';

        this.showSuccess(`Stream "${name}" added successfully!`);
    }

    /**
     * Validate stream URL
     */
    isValidStreamUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    /**
     * Render streams list
     */
    renderStreams() {
        if (this.streams.length === 0) {
            this.streamsContainer.innerHTML = `
                <div class="empty-streams">
                    <p class="empty-text">No streams saved yet</p>
                    <p class="empty-subtext">Add your first stream above to get started</p>
                </div>
            `;
            return;
        }

        this.streamsContainer.innerHTML = this.streams
            .map(stream => this.createStreamItemHTML(stream))
            .join('');

        // Add event listeners to stream items
        this.streams.forEach(stream => {
            const selectBtn = document.getElementById(`select-${stream.id}`);
            const deleteBtn = document.getElementById(`delete-${stream.id}`);

            selectBtn.addEventListener('click', () => this.selectStream(stream));
            deleteBtn.addEventListener('click', () => this.deleteStream(stream.id));
        });
    }

    /**
     * Create HTML for a stream item
     */
    createStreamItemHTML(stream) {
        const isActive = this.currentStream && this.currentStream.id === stream.id;
        
        return `
            <div class="stream-item ${isActive ? 'active' : ''}" data-stream-id="${stream.id}">
                <div class="stream-details">
                    <div class="stream-item-name">${this.escapeHtml(stream.name)}</div>
                    <div class="stream-item-url">${this.escapeHtml(stream.url)}</div>
                </div>
                <div class="stream-actions">
                    <button class="action-btn select-btn" id="select-${stream.id}">
                        ${isActive ? 'Selected' : 'Select'}
                    </button>
                    <button class="action-btn delete-btn" id="delete-${stream.id}">Delete</button>
                </div>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Select a stream
     */
    selectStream(stream) {
        console.log(`Selecting stream: ${stream.name}`);
        
        const wasPlaying = this.isPlaying;
        
        if (this.isPlaying) {
            this.audioPlayer.pause();
        }

        this.currentStream = stream;
        this.audioPlayer.src = stream.url;
        
        this.updateCurrentStreamDisplay();
        this.renderStreams(); // Re-render to update active state
        this.enableControls();

        // Auto-play if we were already playing
        if (wasPlaying) {
            this.playStream();
        }

        this.updateStatus('ready', 'Stream selected');
    }

    /**
     * Delete a stream
     */
    deleteStream(streamId) {
        const stream = this.streams.find(s => s.id === streamId);
        
        if (!stream) return;

        if (confirm(`Are you sure you want to delete "${stream.name}"?`)) {
            // If this is the current stream, stop playback
            if (this.currentStream && this.currentStream.id === streamId) {
                this.stopStream();
                this.currentStream = null;
                this.updateCurrentStreamDisplay();
                this.disableControls();
            }

            // Remove from streams array
            this.streams = this.streams.filter(s => s.id !== streamId);
            this.saveStreams();
            this.renderStreams();

            console.log(`Deleted stream: ${stream.name}`);
        }
    }

    /**
     * Toggle play/pause
     */
    togglePlayPause() {
        if (!this.currentStream) {
            this.showError('Please select a stream first.');
            return;
        }

        if (this.isPlaying) {
            this.pauseStream();
        } else {
            this.playStream();
        }
    }

    /**
     * Play current stream
     */
    async playStream() {
        if (!this.currentStream) return;

        try {
            this.updateStatus('loading', 'Connecting...');
            await this.audioPlayer.play();
            console.log(`Playing: ${this.currentStream.name}`);
        } catch (error) {
            console.error('Play error:', error);
            this.handlePlayError(error);
        }
    }

    /**
     * Pause current stream
     */
    pauseStream() {
        this.audioPlayer.pause();
        console.log('Stream paused');
    }

    /**
     * Stop current stream
     */
    stopStream() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.audioPlayer.src = '';
        this.isPlaying = false;
        this.updatePlayButton();
        this.updateStatus('stopped', 'Stopped');
        console.log('Stream stopped');
    }

    /**
     * Update volume
     */
    updateVolume(value) {
        const volume = value / 100;
        this.audioPlayer.volume = volume;
        this.volumeValue.textContent = `${value}%`;
        
        // Save to localStorage
        localStorage.setItem('radioPlayer_volume', value);
        
        console.log(`Volume set to: ${value}%`);
    }

    /**
     * Adjust volume by delta
     */
    adjustVolume(delta) {
        const currentValue = parseInt(this.volumeSlider.value);
        const newValue = Math.max(0, Math.min(100, currentValue + delta));
        this.volumeSlider.value = newValue;
        this.updateVolume(newValue);
    }

    /**
     * Update volume display
     */
    updateVolumeDisplay() {
        const volume = Math.round(this.audioPlayer.volume * 100);
        this.volumeSlider.value = volume;
        this.volumeValue.textContent = `${volume}%`;
    }

    /**
     * Update play/pause button
     */
    updatePlayButton() {
        const icon = this.playPauseBtn.querySelector('.btn-icon');
        const text = this.playPauseBtn.querySelector('.btn-text');
        
        if (this.isPlaying) {
            icon.textContent = '⏸️';
            text.textContent = 'Pause';
        } else {
            icon.textContent = '▶️';
            text.textContent = 'Play';
        }
    }

    /**
     * Update current stream display
     */
    updateCurrentStreamDisplay() {
        if (this.currentStream) {
            this.currentStreamName.textContent = this.currentStream.name;
            this.currentStreamUrl.textContent = this.currentStream.url;
        } else {
            this.currentStreamName.textContent = 'No stream selected';
            this.currentStreamUrl.textContent = 'Select a stream to begin';
        }
    }

    /**
     * Update status indicator
     */
    updateStatus(type, text) {
        this.statusText.textContent = text;
        this.statusDot.className = `status-dot ${type}`;
        console.log(`Status: ${text}`);
    }

    /**
     * Enable playback controls
     */
    enableControls() {
        this.playPauseBtn.disabled = false;
        this.stopBtn.disabled = false;
    }

    /**
     * Disable playback controls
     */
    disableControls() {
        this.playPauseBtn.disabled = true;
        this.stopBtn.disabled = true;
    }

    /**
     * Update UI state
     */
    updateUI() {
        this.renderStreams();
        this.updateCurrentStreamDisplay();
        this.updatePlayButton();
        
        if (this.currentStream) {
            this.enableControls();
        } else {
            this.disableControls();
        }
    }

    /**
     * Handle audio errors
     */
    handleAudioError(e) {
        const error = e.target.error;
        let message = 'Audio error occurred';
        
        if (error) {
            switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                    message = 'Stream loading was aborted';
                    break;
                case error.MEDIA_ERR_NETWORK:
                    message = 'Network error while loading stream';
                    break;
                case error.MEDIA_ERR_DECODE:
                    message = 'Error decoding audio stream';
                    break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    message = 'Stream format not supported';
                    break;
                default:
                    message = 'Unknown audio error';
            }
        }

        console.error('Audio error:', error);
        this.isPlaying = false;
        this.updatePlayButton();
        this.updateStatus('error', 'Error');
        this.showError(message);
    }

    /**
     * Handle play errors
     */
    handlePlayError(error) {
        let message = 'Failed to play stream';
        
        if (error.name === 'NotAllowedError') {
            message = 'Please interact with the page before playing audio';
        } else if (error.name === 'NotSupportedError') {
            message = 'This stream format is not supported';
        }

        this.updateStatus('error', 'Play error');
        this.showError(message);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hideError(), 5000);
        
        console.error('Error:', message);
    }

    /**
     * Show success message (reusing error styling with green color)
     */
    showSuccess(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'block';
        this.errorMessage.querySelector('.error-content').style.background = '#27ae60';
        
        // Auto-hide after 3 seconds
        setTimeout(() => this.hideError(), 3000);
        
        console.log('Success:', message);
    }

    /**
     * Hide error/success message
     */
    hideError() {
        this.errorMessage.style.display = 'none';
        // Reset to error color
        this.errorMessage.querySelector('.error-content').style.background = '#e74c3c';
    }
}

// Initialize the radio player when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.radioPlayer = new RadioPlayer();
    
    // Expose some methods globally for debugging
    if (typeof window !== 'undefined') {
        window.debugRadio = {
            player: window.radioPlayer,
            streams: () => window.radioPlayer.streams,
            currentStream: () => window.radioPlayer.currentStream,
            clearStreams: () => {
                localStorage.removeItem('radioStreamPlayer_streams');
                location.reload();
            }
        };
    }
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment the next lines if you want to add a service worker
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}