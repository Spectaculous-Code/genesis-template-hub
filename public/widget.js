(function() {
  'use strict';

  // API configuration
  const API_BASE_URL = 'https://iryqgmjauybluwnqhxbg.supabase.co/functions/v1/embed';

  // Widget styles (will be injected into Shadow DOM)
  const WIDGET_STYLES = `
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .rn-bible-widget {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin: 16px 0;
    }
    .rn-bible-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .rn-bible-reference {
      font-weight: 600;
      font-size: 16px;
      color: #1e293b;
    }
    .rn-bible-version {
      font-size: 12px;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .rn-bible-verses {
      color: #334155;
      line-height: 1.6;
      font-size: 15px;
      margin-bottom: 12px;
    }
    .rn-bible-verse {
      margin-bottom: 8px;
    }
    .rn-bible-verse-number {
      font-weight: 600;
      color: #64748b;
      margin-right: 4px;
      font-size: 13px;
      vertical-align: super;
      font-size: 11px;
    }
    .rn-bible-audio {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      background: #f8fafc;
      border-radius: 6px;
    }
    .rn-bible-audio-btn {
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.2s;
    }
    .rn-bible-audio-btn:hover:not(:disabled) {
      background: #2563eb;
    }
    .rn-bible-audio-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
      opacity: 0.6;
    }
    .rn-bible-audio-btn.playing {
      background: #ef4444;
    }
    .rn-bible-audio-btn.playing:hover {
      background: #dc2626;
    }
    .rn-bible-audio-time {
      font-size: 12px;
      color: #64748b;
      font-family: monospace;
    }
    .rn-bible-error {
      color: #ef4444;
      font-size: 14px;
      padding: 12px;
      background: #fee2e2;
      border-radius: 6px;
      border-left: 4px solid #ef4444;
    }
    .rn-bible-loading {
      color: #64748b;
      font-size: 14px;
      padding: 12px;
      text-align: center;
    }
    .rn-bible-link {
      font-size: 12px;
      color: #3b82f6;
      text-decoration: none;
      margin-top: 8px;
      display: inline-block;
    }
    .rn-bible-link:hover {
      text-decoration: underline;
    }
  `;

  /**
   * Format time in MM:SS format
   */
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Fetch Bible verses from embed API
   */
  async function fetchVerses(ref, version) {
    const params = new URLSearchParams({ ref });
    if (version) params.append('version', version);
    
    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  }

  /**
   * Create audio player with time-based playback control
   */
  function createAudioPlayer(audioData, container) {
    if (!audioData.available || !audioData.url) {
      return null;
    }

    const audio = new Audio(audioData.url);
    const startTime = audioData.startTime || 0;
    const endTime = audioData.endTime || audio.duration;
    
    let isPlaying = false;
    
    const button = container.querySelector('.rn-bible-audio-btn');
    const timeDisplay = container.querySelector('.rn-bible-audio-time');
    
    // Update button state
    function updateButton() {
      if (isPlaying) {
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" />
            <rect x="9" y="2" width="4" height="12" />
          </svg>
          <span>Pysäytä</span>
        `;
        button.classList.add('playing');
      } else {
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2l10 6-10 6z" />
          </svg>
          <span>Toista</span>
        `;
        button.classList.remove('playing');
      }
    }

    // Time update handler
    audio.addEventListener('timeupdate', () => {
      if (audio.currentTime >= endTime) {
        audio.pause();
        audio.currentTime = startTime;
        isPlaying = false;
        updateButton();
      }
      
      if (timeDisplay) {
        const current = audio.currentTime - startTime;
        const total = endTime - startTime;
        timeDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;
      }
    });

    // Play/pause handler
    button.addEventListener('click', () => {
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
      } else {
        audio.currentTime = startTime;
        audio.play();
        isPlaying = true;
      }
      updateButton();
    });

    // Audio ended handler
    audio.addEventListener('ended', () => {
      audio.currentTime = startTime;
      isPlaying = false;
      updateButton();
    });

    // Audio paused handler
    audio.addEventListener('pause', () => {
      isPlaying = false;
      updateButton();
    });

    // Audio playing handler
    audio.addEventListener('play', () => {
      isPlaying = true;
      updateButton();
    });

    updateButton();
    
    return audio;
  }

  /**
   * Render Bible widget into shadow DOM
   */
  function renderWidget(element, data) {
    // Create shadow root
    const shadow = element.attachShadow({ mode: 'open' });
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = WIDGET_STYLES;
    shadow.appendChild(style);
    
    // Create widget container
    const widget = document.createElement('div');
    widget.className = 'rn-bible-widget';
    
    // Header
    const header = document.createElement('div');
    header.className = 'rn-bible-header';
    header.innerHTML = `
      <span class="rn-bible-reference">${data.reference}</span>
      <span class="rn-bible-version">${data.versionCode}</span>
    `;
    widget.appendChild(header);
    
    // Verses
    const verses = document.createElement('div');
    verses.className = 'rn-bible-verses';
    data.verses.forEach(verse => {
      const verseEl = document.createElement('div');
      verseEl.className = 'rn-bible-verse';
      verseEl.innerHTML = `
        <sup class="rn-bible-verse-number">${verse.number}</sup>
        <span>${verse.text}</span>
      `;
      verses.appendChild(verseEl);
    });
    widget.appendChild(verses);
    
    // Audio player
    if (data.audio && data.audio.available) {
      const audioContainer = document.createElement('div');
      audioContainer.className = 'rn-bible-audio';
      audioContainer.innerHTML = `
        <button class="rn-bible-audio-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2l10 6-10 6z" />
          </svg>
          <span>Toista</span>
        </button>
        <span class="rn-bible-audio-time">0:00 / 0:00</span>
      `;
      widget.appendChild(audioContainer);
      
      // Initialize audio player after DOM is ready
      setTimeout(() => {
        createAudioPlayer(data.audio, audioContainer);
      }, 0);
    } else {
      const noAudio = document.createElement('div');
      noAudio.className = 'rn-bible-audio';
      noAudio.innerHTML = `
        <button class="rn-bible-audio-btn" disabled title="Ääni ei saatavilla tälle käännökselle">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2l10 6-10 6z" />
          </svg>
          <span>Ääni ei saatavilla</span>
        </button>
      `;
      widget.appendChild(noAudio);
    }
    
    // Link to app
    if (data.link) {
      const link = document.createElement('a');
      link.href = data.link;
      link.target = '_blank';
      link.className = 'rn-bible-link';
      link.textContent = 'Avaa sovelluksessa →';
      widget.appendChild(link);
    }
    
    shadow.appendChild(widget);
  }

  /**
   * Show error in widget
   */
  function renderError(element, message) {
    const shadow = element.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = WIDGET_STYLES;
    shadow.appendChild(style);
    
    const error = document.createElement('div');
    error.className = 'rn-bible-error';
    error.textContent = `Virhe: ${message}`;
    shadow.appendChild(error);
  }

  /**
   * Show loading state
   */
  function renderLoading(element) {
    const shadow = element.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = WIDGET_STYLES;
    shadow.appendChild(style);
    
    const loading = document.createElement('div');
    loading.className = 'rn-bible-loading';
    loading.textContent = 'Ladataan...';
    shadow.appendChild(loading);
  }

  /**
   * Initialize a single widget
   */
  async function initWidget(element) {
    const ref = element.getAttribute('data-ref');
    const version = element.getAttribute('data-version');
    
    if (!ref) {
      renderError(element, 'data-ref attribuutti puuttuu');
      return;
    }
    
    try {
      renderLoading(element);
      const data = await fetchVerses(ref, version);
      
      // Clear shadow root and render widget
      element.shadowRoot.innerHTML = '';
      renderWidget(element, data);
    } catch (error) {
      console.error('Widget error:', error);
      element.shadowRoot.innerHTML = '';
      renderError(element, error.message);
    }
  }

  /**
   * Initialize all widgets on page
   */
  function initAllWidgets() {
    const widgets = document.querySelectorAll('.rn-bible[data-ref]');
    widgets.forEach(widget => initWidget(widget));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllWidgets);
  } else {
    initAllWidgets();
  }

  // Also watch for dynamically added widgets
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          if (node.matches && node.matches('.rn-bible[data-ref]')) {
            initWidget(node);
          }
          // Check children
          if (node.querySelectorAll) {
            node.querySelectorAll('.rn-bible[data-ref]').forEach(initWidget);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Expose init function globally for manual initialization
  window.RNBibleWidget = {
    init: initAllWidgets,
    initElement: initWidget
  };
})();
