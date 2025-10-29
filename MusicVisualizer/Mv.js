// ============================================
// STEP 1: SET UP VARIABLES AND GET DOM ELEMENTS
// ============================================

// Get references to all HTML elements we'll interact with
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d'); // 2D drawing context for the canvas
const audioFileInput = document.getElementById('audioFile');
const folderInput = document.getElementById('folderInput'); // Folder input
const playPauseBtn = document.getElementById('playPause');
const prevBtn = document.getElementById('prevBtn'); // Previous button
const nextBtn = document.getElementById('nextBtn'); // Next button
const volumeSlider = document.getElementById('volume');
const volumeDisplay = document.getElementById('volumeDisplay'); // Volume display
const nowPlayingDisplay = document.getElementById('nowPlaying'); // Now playing display
const playlistElement = document.getElementById('playlist'); // Playlist container
const playlistCount = document.getElementById('playlistCount'); // Playlist count
const modeButtons = document.querySelectorAll('.mode-btn');

// Audio-related variables
let audioContext; // The main audio processing context
let analyser; // Analyser node for frequency analysis
let audioSource; // Source node for our audio
let audioElement = new Audio(); // HTML5 audio element
let dataArray; // Array to store frequency data
let bufferLength; // Length of the frequency data array
let isPlaying = false; // Track play/pause state
let currentMode = 'bars'; // Current visualization mode
let particles = []; // Array for particle mode

let playlist = []; // Array to store all songs
let currentSongIndex = 0; // Index of currently playing song

// ============================================
// STEP 2: INITIALIZE WEB AUDIO API
// ============================================

/**
 * This function sets up the Web Audio API components
 * CONCEPT: Web Audio API uses a node-based system where audio flows through connected nodes
 */
function initAudio() {
  // Create an AudioContext - this is the main audio processing environment
  // Think of it as a factory that creates and connects audio nodes
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Create an AnalyserNode - this extracts frequency and time-domain data from audio
  // CONCEPT: The analyser doesn't change the audio, it just reads it
  analyser = audioContext.createAnalyser();
  
  // FFT (Fast Fourier Transform) size determines frequency resolution
  // Higher = more detailed but slower. Must be power of 2 (256, 512, 1024, 2048, etc.)
  analyser.fftSize = 512; // Increased for better circle visualization
  
  // bufferLength is half of fftSize (Nyquist frequency)
  // This is how many frequency "bins" we get
  bufferLength = analyser.frequencyBinCount;
  
  // Create a Uint8Array to hold the frequency data (values 0-255)
  dataArray = new Uint8Array(bufferLength);
  
  // Create a source node from our audio element
  // CONCEPT: This connects the HTML5 audio to the Web Audio API
  audioSource = audioContext.createMediaElementSource(audioElement);
  
  // Connect the audio flow: source → analyser → destination (speakers)
  // CONCEPT: Audio flows through connected nodes like water through pipes
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);
  
  console.log('[v0] Audio API initialized! Buffer length:', bufferLength);
}

// ============================================
// STEP 3: FILE UPLOAD AND PLAYLIST MANAGEMENT
// ============================================

/**
 * Handle single file upload
 * CONCEPT: FileReader API allows reading files from user's computer
 */
audioFileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  
  if (file && file.type.startsWith('audio/')) {
    // Clear existing playlist and add single file
    playlist = [file];
    currentSongIndex = 0;
    updatePlaylistUI();
    loadSong(0);
  }
});

/**
 * Handle folder upload
 * CONCEPT: webkitdirectory attribute allows selecting entire folders
 * This gives us access to all files in the folder
 */
folderInput.addEventListener('change', function(e) {
  const files = Array.from(e.target.files);
  
  // Filter only audio files
  // CONCEPT: MIME types starting with 'audio/' are audio files
  const audioFiles = files.filter(file => file.type.startsWith('audio/'));
  
  if (audioFiles.length > 0) {
    // Sort files alphabetically by name
    audioFiles.sort((a, b) => a.name.localeCompare(b.name));
    
    playlist = audioFiles;
    currentSongIndex = 0;
    updatePlaylistUI();
    loadSong(0);
    
    console.log('[v0] Loaded', audioFiles.length, 'songs from folder');
  } else {
    alert('No audio files found in the selected folder!');
  }
});

/**
 * Load a specific song from the playlist
 * CONCEPT: URL.createObjectURL creates a temporary URL for the file
 * This allows the browser to play it without uploading to a server
 */
function loadSong(index) {
  if (index < 0 || index >= playlist.length) return;
  
  const file = playlist[index];
  currentSongIndex = index;
  
  // Create URL for the file
  const fileURL = URL.createObjectURL(file);
  
  // Set as audio source
  audioElement.src = fileURL;
  
  // Initialize audio API if not already done
  if (!audioContext) {
    initAudio();
  }
  
  // Update UI
  nowPlayingDisplay.textContent = file.name;
  updatePlaylistUI();
  
  // Enable controls
  playPauseBtn.disabled = false;
  prevBtn.disabled = currentSongIndex === 0;
  nextBtn.disabled = currentSongIndex === playlist.length - 1;
  
  // Auto-play if something was already playing
  if (isPlaying) {
    audioElement.play().catch(e => console.error('Play failed:', e));
  }
  
  console.log('[v0] Loaded song:', file.name);
}

/**
 * Update the playlist UI to show all songs
 * CONCEPT: DOM manipulation - creating HTML elements dynamically
 */
function updatePlaylistUI() {
  if (playlist.length === 0) {
    playlistElement.innerHTML = `
      <div class="text-slate-400 text-center py-8 text-sm">
        Upload songs to see your playlist here
      </div>
    `;
    playlistCount.textContent = '(0 songs)';
    return;
  }
  
  // Update count
  playlistCount.textContent = `(${playlist.length} songs)`;
  
  // Clear playlist
  playlistElement.innerHTML = '';
  
  // Add each song to the playlist
  playlist.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = `playlist-item p-3 rounded-lg cursor-pointer ${index === currentSongIndex ? 'active' : 'bg-slate-700/30'}`;
    
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-blue-400 font-bold text-sm w-6">${index + 1}</div>
        <div class="flex-1 min-w-0">
          <div class="text-white text-sm font-medium truncate">${file.name}</div>
          <div class="text-slate-400 text-xs">${formatFileSize(file.size)}</div>
        </div>
        ${index === currentSongIndex && isPlaying ? '<div class="text-blue-400">▶️</div>' : ''}
      </div>
    `;
    
    // Click to play this song
    item.addEventListener('click', () => {
      loadSong(index);
      if (!isPlaying) {
        playPauseBtn.click();
      }
    });
    
    playlistElement.appendChild(item);
  });
}

/**
 * Format file size for display
 * CONCEPT: Converting bytes to human-readable format
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================
// STEP 4: PLAYBACK CONTROLS
// ============================================

playPauseBtn.addEventListener('click', function() {
  if (isPlaying) {
    audioElement.pause();
    playPauseBtn.textContent = '▶️ Play';
    isPlaying = false;
  } else {
    // Resume audio context if it was suspended (browser autoplay policy)
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    audioElement.play().then(() => {
      playPauseBtn.textContent = '⏸️ Pause';
      isPlaying = true;
      
      // Start the visualization loop
      visualize();
    }).catch(e => {
      console.error('Play failed:', e);
      alert('Failed to play audio. Please interact with the page first or check browser permissions.');
    });
  }
  updatePlaylistUI();
});

/**
 * Previous song button
 * CONCEPT: Decrement index and load previous song
 */
prevBtn.addEventListener('click', function() {
  if (currentSongIndex > 0) {
    loadSong(currentSongIndex - 1);
    if (isPlaying) {
      audioElement.play().catch(e => console.error('Play failed:', e));
    }
  }
});

/**
 * Next song button
 * CONCEPT: Increment index and load next song
 */
nextBtn.addEventListener('click', function() {
  if (currentSongIndex < playlist.length - 1) {
    loadSong(currentSongIndex + 1);
    if (isPlaying) {
      audioElement.play().catch(e => console.error('Play failed:', e));
    }
  }
});

/**
 * Auto-play next song when current song ends
 * CONCEPT: 'ended' event fires when audio finishes playing
 */
audioElement.addEventListener('ended', function() {
  if (currentSongIndex < playlist.length - 1) {
    // Play next song
    nextBtn.click();
  } else {
    // End of playlist
    isPlaying = false;
    playPauseBtn.textContent = '▶️ Play';
    updatePlaylistUI();
  }
});

// ============================================
// STEP 5: VOLUME CONTROL
// ============================================

volumeSlider.addEventListener('input', function(e) {
  const volume = e.target.value / 100; // Convert 0-100 to 0-1
  audioElement.volume = volume;
  
  // Update volume display
  volumeDisplay.textContent = e.target.value + '%';
});

// ============================================
// STEP 6: VISUALIZATION MODE SWITCHING
// ============================================

modeButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    // Remove active class from all buttons
    modeButtons.forEach(b => b.classList.remove('active'));
    
    // Add active class to clicked button
    this.classList.add('active');
    
    // Update current mode
    currentMode = this.dataset.mode;
    
    // Reset particles when switching to particle mode
    if (currentMode === 'particles') {
      initParticles();
    }
    
    console.log('[v0] Visualization mode changed to:', currentMode);
  });
});

// ============================================
// STEP 7: MAIN VISUALIZATION LOOP
// ============================================

/**
 * This function runs continuously while audio is playing
 * CONCEPT: requestAnimationFrame creates a smooth 60fps animation loop
 */
function visualize() {
  if (!isPlaying) return; // Stop if paused
  
  // Request next frame - this creates the animation loop
  requestAnimationFrame(visualize);
  
  // Get current frequency data from the analyser
  // CONCEPT: This fills dataArray with current frequency values (0-255)
  analyser.getByteFrequencyData(dataArray);
  
  // Clear the canvas with solid black (no trail effect)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw based on current mode
  switch(currentMode) {
    case 'bars':
      drawBars();
      break;
    case 'waveform':
      drawWaveform();
      break;
    case 'circle':
      drawCircle();
      break;
    case 'particles':
      drawParticles();
      break;
  }
}

// ============================================
// STEP 8: BARS VISUALIZATION
// ============================================

/**
 * Classic frequency bars visualization
 * CONCEPT: Each bar represents a frequency range, height = amplitude
 */
function drawBars() {
  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;
  
  // Loop through each frequency bin
  for (let i = 0; i < bufferLength; i++) {
    // Get frequency value (0-255)
    const barHeight = (dataArray[i] / 255) * canvas.height;
    
    // Create gradient color based on frequency
    // Low frequencies = blue, high frequencies = purple/pink
    const hue = (i / bufferLength) * 360;
    ctx.fillStyle = `hsl(${200 + hue * 0.5}, 80%, 60%)`;
    
    // Draw the bar from bottom up
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    
    // Move to next bar position
    x += barWidth + 1;
  }
}

// ============================================
// STEP 9: WAVEFORM VISUALIZATION
// ============================================

/**
 * Smooth waveform visualization
 * CONCEPT: Connects frequency points with lines to show audio shape
 */
function drawWaveform() {
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  
  const sliceWidth = canvas.width / bufferLength;
  let x = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    // Map frequency value to canvas height
    const y = (dataArray[i] / 255) * canvas.height;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  ctx.stroke();
  
  // Add glow effect
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#3b82f6';
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// ============================================
// STEP 10: ENHANCED CIRCLE VISUALIZATION
// ============================================

function drawCircle() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(canvas.width, canvas.height) * 0.35;

  // Create a soft, fading background for smoother trails
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Compute average amplitude for pulse effects
  const avgAmplitude = dataArray.reduce((a, b) => a + b) / dataArray.length;
  const pulse = (avgAmplitude / 255) * 25;



  // ==== Frequency bars in circle ====
  for (let i = 0; i < bufferLength; i++) {
    if (i % 1 !== 0) continue; // control density

    const angle = (i / bufferLength) * Math.PI * 2;
    const radius = maxRadius * 0.4;
    const amplitude = dataArray[i] / 255;
    const barLength = amplitude * (maxRadius * 0.6);

    const x1 = centerX + Math.cos(angle) * radius;
    const y1 = centerY + Math.sin(angle) * radius;
    const x2 = centerX + Math.cos(angle) * (radius + barLength);
    const y2 = centerY + Math.sin(angle) * (radius + barLength);

    const hue = 200 + amplitude * 160; // blue–purple gradient
    const saturation = 70 + amplitude * 30;
    const lightness = 45 + amplitude * 25;

    ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.lineWidth = 2 + amplitude * 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ==== Inner pulsing core ====
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 0.3 + pulse);
  gradient.addColorStop(0, 'rgba(99,102,241,0.9)');
  gradient.addColorStop(1, 'rgba(99,102,241,0.1)');
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxRadius * 0.25 + pulse, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // ==== Reactive outer ring (bass response) ====
  const bass = dataArray.slice(0, 20).reduce((a, b) => a + b) / 20;
  const bassScale = (bass / 255) * 10 + 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxRadius * 0.9, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + (bass / 255) * 0.5})`;
  ctx.lineWidth = bassScale;
  ctx.stroke();
}


// ============================================
// STEP 11: PARTICLE VISUALIZATION
// ============================================

/**
 * Particle system that reacts to audio
 * CONCEPT: Particles move and change based on frequency data
 */

// Particle class definition
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 3 + 1;
    this.speedX = Math.random() * 2 - 1;
    this.speedY = Math.random() * 2 - 1;
    this.hue = Math.random() * 360;
  }
  
  update(audioData) {
    // Move particle
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Bounce off edges
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    
    // React to audio - size changes with amplitude
    const avgAmplitude = audioData.reduce((a, b) => a + b) / audioData.length;
    this.size = (avgAmplitude / 255) * 5 + 1;
  }
  
  draw() {
    ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, 0.8)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
  }
}

function drawParticles() {
  particles.forEach(particle => {
    particle.update(dataArray);
    particle.draw();
  });
  
  // Draw connections between nearby particles
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 100) {
        ctx.strokeStyle = `rgba(59, 130, 246, ${1 - distance / 100})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

// ============================================
// STEP 12: CANVAS RESIZE HANDLING
// ============================================

/**
 * Make canvas responsive to window size
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Reinitialize particles if in particle mode
  if (currentMode === 'particles') {
    initParticles();
  }
}

window.addEventListener('resize', resizeCanvas);

// ============================================
// STEP 13: POPUP MENU FUNCTIONALITY
// ============================================

const menuBtn = document.getElementById('menuBtn');
const popupMenu = document.getElementById('popupMenu');
const popupContent = document.getElementById('popupContent');
const closeBtn = document.getElementById('closeBtn');

menuBtn.addEventListener('click', () => {
  popupMenu.classList.remove('hidden');
  setTimeout(() => popupContent.classList.remove('translate-x-full'), 10);
});

closeBtn.addEventListener('click', closeMenu);
popupMenu.addEventListener('click', (e) => {
  if (e.target === popupMenu) closeMenu();
});

function closeMenu() {
  popupContent.classList.add('translate-x-full');
  setTimeout(() => popupMenu.classList.add('hidden'), 300);
}

// ============================================
// STEP 14: INITIALIZATION AND TAB CONTINUITY
// ============================================

// Initialize the canvas size when the page loads
window.addEventListener('load', () => {
  resizeCanvas();
  console.log('[v0] Music Visualizer initialized!');
});

// Handle page visibility changes - DON'T pause audio when switching tabs
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden (tab switched), but we keep audio playing
    console.log('[v0] Tab switched, audio continues playing');
  } else {
    // Page is visible again, ensure visualization continues
    if (isPlaying) {
      visualize();
    }
  }
});

// Prevent browser from throttling timers when tab is inactive
audioElement.addEventListener('play', () => {
  if (document.hidden) {
    console.log('[v0] Audio playing in background tab');
  }
});