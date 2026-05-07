/**
 * VOCAL COMMENTS INTEGRATION GUIDE
 * ================================
 * 
 * This file shows how to integrate vocal comments in the UI
 * 
 * Backend API:
 * - ActusAPI.addVocalComment(post_id, audioFile, duration, parent_id, is_anonym)
 * - ActusAPI.getComments(post_id) - now returns audio_url and duration
 * 
 * Audio Recording Implementation Example:
 */

class VocalCommentRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingStartTime = null;
    this.isRecording = false;
  }

  /**
   * Initialize audio recording
   */
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.recordingStartTime = Date.now();
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstart = () => {
        console.log('🎙️ Recording started...');
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        console.log('🎙️ Recording stopped');
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      return false;
    }
  }

  /**
   * Stop recording and return audio file
   */
  stopRecording() {
    if (!this.mediaRecorder) return null;
    
    this.mediaRecorder.stop();
    const duration = Math.round((Date.now() - this.recordingStartTime) / 1000);
    
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const audioFile = new File(
          [audioBlob],
          `vocal_comment_${Date.now()}.wav`,
          { type: 'audio/wav' }
        );
        resolve({ file: audioFile, duration });
      };
    });
  }

  /**
   * Cancel recording without saving
   */
  cancelRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.audioChunks = [];
      this.isRecording = false;
      console.log('🎙️ Recording cancelled');
      return true;
    }
    return false;
  }

  /**
   * Play audio for preview
   */
  playPreview(audioFile) {
    const url = URL.createObjectURL(audioFile);
    const audio = new Audio(url);
    audio.play();
    return audio;
  }
}

/**
 * EXAMPLE HTML STRUCTURE FOR VOCAL COMMENT UI
 * ============================================
 * 
 * <!-- Add Vocal Comment Button -->
 * <button id="vocal-comment-btn" class="btn-vocal" title="Add vocal comment">
 *   <i class="fas fa-microphone"></i>
 * </button>
 * 
 * <!-- Vocal Comment Recorder Modal -->
 * <div id="vocal-recorder-modal" class="modal hidden">
 *   <div class="modal-content">
 *     <h3>Record Vocal Comment</h3>
 *     
 *     <div id="recording-status" class="recording-status hidden">
 *       <span class="recording-indicator">● REC</span>
 *       <span id="recording-timer">00:00</span>
 *     </div>
 *     
 *     <div class="recorder-controls">
 *       <button id="record-start-btn" class="btn btn-primary">
 *         <i class="fas fa-microphone"></i> Start Recording
 *       </button>
 *       <button id="record-stop-btn" class="btn btn-danger hidden">
 *         <i class="fas fa-stop-circle"></i> Stop Recording
 *       </button>
 *       <button id="record-cancel-btn" class="btn btn-secondary">
 *         <i class="fas fa-times"></i> Cancel
 *       </button>
 *     </div>
 *     
 *     <div id="preview-section" class="hidden">
 *       <p>Preview your recording:</p>
 *       <audio id="audio-preview" controls></audio>
 *       <button id="record-submit-btn" class="btn btn-primary">
 *         <i class="fas fa-check"></i> Post Comment
 *       </button>
 *     </div>
 *   </div>
 * </div>
 */

/**
 * EXAMPLE JAVASCRIPT INTEGRATION
 * ==============================
 */

// Example: Add event listeners for vocal comment recording
function setupVocalCommentUI(postId) {
  const recorder = new VocalCommentRecorder();
  let recordedData = null;

  document.getElementById('record-start-btn')?.addEventListener('click', async () => {
    const success = await recorder.startRecording();
    if (success) {
      // Update UI to show recording state
      document.getElementById('recording-status').classList.remove('hidden');
      document.getElementById('record-start-btn').classList.add('hidden');
      document.getElementById('record-stop-btn').classList.remove('hidden');
      
      // Start timer
      let seconds = 0;
      const timerInterval = setInterval(() => {
        seconds++;
        document.getElementById('recording-timer').textContent = 
          `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
      }, 1000);
      
      document.getElementById('record-stop-btn').onclick = async () => {
        clearInterval(timerInterval);
        recordedData = await recorder.stopRecording();
        
        // Show preview
        document.getElementById('recording-status').classList.add('hidden');
        document.getElementById('record-stop-btn').classList.add('hidden');
        document.getElementById('record-start-btn').classList.remove('hidden');
        document.getElementById('preview-section').classList.remove('hidden');
        
        const audioPreview = document.getElementById('audio-preview');
        audioPreview.src = URL.createObjectURL(recordedData.file);
      };
    }
  });

  document.getElementById('record-cancel-btn')?.addEventListener('click', () => {
    recorder.cancelRecording();
    document.getElementById('vocal-recorder-modal').classList.add('hidden');
  });

  document.getElementById('record-submit-btn')?.addEventListener('click', async () => {
    if (!recordedData) return;
    
    // Submit via API
    const result = await ActusAPI.addVocalComment(
      postId,
      recordedData.file,
      recordedData.duration,
      null, // No parent comment
      false // Not anonymous
    );
    
    if (result.success) {
      console.log('✅ Vocal comment submitted!');
      document.getElementById('vocal-recorder-modal').classList.add('hidden');
      // Refresh comments
      await loadComments(postId);
    } else {
      alert('Error: ' + result.message);
    }
  });
}

/**
 * DISPLAY VOCAL COMMENTS IN UI
 * ============================
 * 
 * When getComments returns comments with audio_url:
 */

function renderCommentWithAudio(comment) {
  if (comment.audio_url) {
    // Render as audio player
    return `
      <div class="comment comment-vocal">
        <div class="comment-author">${comment.author}</div>
        <audio controls class="comment-audio">
          <source src="${comment.audio_url}" type="audio/wav">
          Your browser does not support the audio element.
        </audio>
        <div class="comment-duration">${formatDuration(comment.duration)}</div>
        <div class="comment-timestamp">${formatTime(comment.timestamp)}</div>
      </div>
    `;
  } else {
    // Render as text comment (existing behavior)
    return `
      <div class="comment comment-text">
        <div class="comment-author">${comment.author}</div>
        <div class="comment-text">${comment.text}</div>
        <div class="comment-timestamp">${formatTime(comment.timestamp)}</div>
      </div>
    `;
  }
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}
