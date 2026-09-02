/* ============================================================
   audio-engine.js
   Global mute state + the full fail-safe multi-tier audio engine:
   Tier 1 = native SpeechSynthesis (Indian-accent female voice picker)
   Tier 2 = online Google-Translate TTS streaming fallback
   Plus a synthesized Web Audio "chime" played before every utterance.

   Everything here is attached to the global (window) scope on purpose —
   the rest of the app (triage.js, dose-tracker.js, sunita-tour.js, app.js)
   calls speakVoice(), toggleGlobalMute(), etc. as plain globals, exactly
   like the original single-file version.
   ============================================================ */

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- GLOBAL AUDIO & MUTE STATE ---------------- */
let isVoiceMuted = false;
let currentLanguage = 'en';

function toggleGlobalMute(){
  isVoiceMuted = !isVoiceMuted;

  if(isVoiceMuted && window.speechSynthesis){
    window.speechSynthesis.cancel();
  }

  updateMuteUIState();

  // If unmuted, give a polite audio confirmation
  if(!isVoiceMuted){
    const ack = (currentLanguage === 'mr') ? "ध्वनी चालू केला आहे." : (currentLanguage === 'hi') ? "आवाज़ चालू कर दी गई है।" : "Voice audio enabled.";
    speakVoice(ack);
  }
}

function updateMuteUIState(){
  // 1. Topbar Button
  const topBtn = document.getElementById('topbar-mute-btn');
  const topIcon = document.getElementById('topbar-mute-icon');
  const topText = document.getElementById('topbar-mute-text');

  if(topBtn && topIcon && topText){
    if(isVoiceMuted){
      topBtn.classList.add('mute-btn-active');
      topIcon.className = 'fa-solid fa-volume-xmark text-white';
      topText.innerText = 'Unmute Voice';
    } else {
      topBtn.classList.remove('mute-btn-active');
      topIcon.className = 'fa-solid fa-volume-high text-amber-400';
      topText.innerText = 'Mute Voice';
    }
  }

  // 2. Launch Screen Button
  const launchBtn = document.getElementById('launch-mute-btn');
  const launchIcon = document.getElementById('launch-mute-icon');
  const launchText = document.getElementById('launch-mute-text');
  if(launchBtn && launchIcon && launchText){
    if(isVoiceMuted){
      launchBtn.classList.add('mute-btn-active');
      launchIcon.className = 'fa-solid fa-volume-xmark text-white';
      launchText.innerText = 'Sound Muted';
    } else {
      launchBtn.classList.remove('mute-btn-active');
      launchIcon.className = 'fa-solid fa-volume-high text-amber-400';
      launchText.innerText = 'Sound ON';
    }
  }

  // 3. Tour Bar Button
  const tourIcon = document.getElementById('tour-mute-icon');
  if(tourIcon){
    tourIcon.className = isVoiceMuted ? 'fa-solid fa-volume-xmark text-red-400' : 'fa-solid fa-volume-high text-amber-300';
  }

  // 4. Chat Modal Button
  const chatIcon = document.getElementById('chat-mute-icon');
  if(chatIcon){
    chatIcon.className = isVoiceMuted ? 'fa-solid fa-volume-xmark text-red-400' : 'fa-solid fa-volume-high text-amber-300';
  }
}

/* ---------------- FULL FAIL-SAFE MULTI-TIER AUDIO ENGINE ---------------- */
window._activeUtterance = null; // Prevent Chrome/Safari GC bug
let audioCtx = null;
let activeOnlineAudio = null;

// Initialize & unlock Web Audio Context on user click/interaction
function unlockAudioContext(){
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if(!audioCtx && AudioContext){
      audioCtx = new AudioContext();
    }
    if(audioCtx && audioCtx.state === 'suspended'){
      audioCtx.resume();
    }
    // Also unlock speech synthesis if paused
    if(window.speechSynthesis && window.speechSynthesis.paused){
      window.speechSynthesis.resume();
    }
  } catch(e) {
    console.log('AudioContext init notice:', e);
  }
}

// Global user interaction hooks so ANY touch/click instantly activates browser audio
if(typeof window !== 'undefined'){
  window.addEventListener('click', unlockAudioContext, { passive: true });
  window.addEventListener('touchstart', unlockAudioContext, { passive: true });
  window.addEventListener('keydown', unlockAudioContext, { passive: true });
}

// Gentle pleasant 3-tone chime synthesized in browser as audible acoustic feedback
function playChime(freq = 560, duration = 0.22){
  if(isVoiceMuted) return;
  try {
    unlockAudioContext();
    if(!audioCtx) return;

    // Play a friendly warm 2-tone melodic harmonic chime [523Hz (C5), 659Hz (E5)]
    const now = audioCtx.currentTime;

    // Tone 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // Tone 2 (Harmonic)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08);
    gain2.gain.setValueAtTime(0.10, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.38);

  } catch(e) {
    console.log('Chime sound notice:', e);
  }
}

// Online HTML5 Audio TTS Fallback (Streams crystal-clear human speech if OS speech engine is missing)
function playOnlineTTS(text, langCode, onComplete){
  try {
    if(isVoiceMuted){
      if(onComplete) onComplete();
      return null;
    }
    if(activeOnlineAudio){
      try { activeOnlineAudio.pause(); } catch(e){}
    }

    const tl = langCode.startsWith('mr') ? 'mr' : langCode.startsWith('hi') ? 'hi' : 'en-IN';
    const cleanText = text.replace(/[\n\r]+/g, ' ').substring(0, 190);
    const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(cleanText)}`;

    const audio = new Audio(audioUrl);
    activeOnlineAudio = audio;
    audio.playbackRate = 0.88; // Calm, clear pacing

    const wave = document.getElementById('speech-wave');
    audio.onplay = () => {
      if(wave && !isVoiceMuted) wave.style.opacity = '1';
    };
    audio.onended = () => {
      if(wave) wave.style.opacity = '0.3';
      activeOnlineAudio = null;
      if(onComplete) onComplete();
    };
    audio.onerror = (err) => {
      console.log('Online audio fallback notice:', err);
      if(wave) wave.style.opacity = '0.3';
      activeOnlineAudio = null;
      if(onComplete) onComplete();
    };

    audio.play().catch(err => {
      console.log('Audio autoplay policy or stream error:', err);
      if(wave) wave.style.opacity = '0.3';
      activeOnlineAudio = null;
      if(onComplete) onComplete();
    });

    return audio;
  } catch(e) {
    console.log('playOnlineTTS exception:', e);
    if(onComplete) onComplete();
    return null;
  }
}

// Known male voice names across Windows/macOS/Chrome/Android TTS engines,
// used to keep every fallback tier below from ever silently picking a
// male voice when nothing explicitly female is available.
const KNOWN_MALE_VOICE_NAMES = ['male','david','mark','james','ravi','rishi','prabhat','hemant','george','daniel','alex','fred','aaron','arthur','gordon','oliver','tom','guy'];
function isLikelyMaleVoice(v){
  const n = v.name.toLowerCase();
  return KNOWN_MALE_VOICE_NAMES.some(m => n.includes(m));
}

function getFemaleVoice(langCode){
  if(!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if(!voices || !voices.length) return null;

  let voice = null;

  // 1. Marathi Voice (female-first, then any non-male Marathi voice)
  if(langCode.startsWith('mr')){
    voice = voices.find(v => {
      const n = v.name.toLowerCase();
      return (v.lang === 'mr-IN' || v.lang.includes('mr') || n.includes('marathi')) && (n.includes('female') || !isLikelyMaleVoice(v));
    }) || voices.find(v => (v.lang === 'mr-IN' || v.lang.includes('mr') || v.name.toLowerCase().includes('marathi')) && !isLikelyMaleVoice(v));
  }

  // 2. Hindi Voice (Female prioritized, never fall back to a known-male Hindi voice)
  if(!voice && langCode.startsWith('hi')){
    voice = voices.find(v => {
      const n = v.name.toLowerCase();
      return (v.lang === 'hi-IN' || v.lang.includes('hi')) && (n.includes('female') || n.includes('lekha') || n.includes('swara') || n.includes('kalpana') || n.includes('google'));
    }) || voices.find(v => (v.lang === 'hi-IN' || v.lang.includes('hi')) && !isLikelyMaleVoice(v));
  }

  // 3. STRICT INDIAN ACCENT FEMALE VOICE FOR ENGLISH
  if(!voice && langCode.startsWith('en')){
    // Priority 1: Specifically Indian English Female Voices (Heera, Veena, Neerja, Priya, Swara, Google English India)
    voice = voices.find(v => {
      const n = v.name.toLowerCase();
      const isIndianLang = (v.lang === 'en-IN' || v.lang === 'en_IN' || v.lang.toLowerCase().includes('en-in'));
      const isFemale = (n.includes('female') || n.includes('heera') || n.includes('veena') || n.includes('neerja') || n.includes('priya') || n.includes('swara') || n.includes('ananya') || n.includes('aditi') || n.includes('lekha') || (n.includes('google') && !n.includes('male')));
      const isMale = (n.includes('male') || n.includes('rishi') || n.includes('ravi') || n.includes('david') || n.includes('george'));
      return isIndianLang && isFemale && !isMale;
    });

    // Priority 2: Any Indian English Voice (en-IN)
    if(!voice){
      voice = voices.find(v => {
        const isIndianLang = (v.lang === 'en-IN' || v.lang === 'en_IN' || v.lang.toLowerCase().includes('en-in'));
        const n = v.name.toLowerCase();
        return isIndianLang && !n.includes('male');
      }) || voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN');
    }

    // Priority 3: Other Clean Female English voices if en-IN is absent in OS
    if(!voice){
      voice = voices.find(v => {
        const n = v.name.toLowerCase();
        const isEnglish = v.lang.startsWith('en');
        const isFemale = (n.includes('female') || n.includes('samantha') || n.includes('zira') || n.includes('karen') || n.includes('victoria') || n.includes('tessa') || n.includes('moira'));
        const isMale = (n.includes('male') || n.includes('david') || n.includes('alex') || n.includes('daniel'));
        return isEnglish && isFemale && !isMale;
      });
    }
  }

  // Same language family, avoiding a known-male voice
  if(!voice){
    voice = voices.find(v => v.lang.startsWith(langCode.substring(0,2)) && !isLikelyMaleVoice(v));
  }
  // Any voice at all that looks explicitly female, regardless of language
  if(!voice){
    voice = voices.find(v => v.name.toLowerCase().includes('female'));
  }
  // Last resort: same language family even if gender is unknown, then any
  // non-male-named voice, and only truly blind voices[0] if nothing else exists
  if(!voice){
    voice = voices.find(v => v.lang.startsWith(langCode.substring(0,2))) || voices.find(v => !isLikelyMaleVoice(v)) || voices[0];
  }

  return voice || voices[0] || null;
}

function speakVoice(text, onCompleteCallback){
  unlockAudioContext();

  // Check if globally muted
  if(isVoiceMuted){
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    if(activeOnlineAudio){ try{ activeOnlineAudio.pause(); }catch(e){} }
    if(onCompleteCallback) onCompleteCallback();
    return;
  }

  // Play auditory chime indicator
  playChime();

  const cleanText = (text || '').replace(/[<>'"]/g, '').trim();
  if(!cleanText){
    if(onCompleteCallback) onCompleteCallback();
    return;
  }

  // Stop absolutely any currently-playing speech before starting new speech,
  // whether it's the native engine or a prior online-TTS fallback stream —
  // prevents two voices overlapping when speakVoice is triggered again
  // before the previous message finished.
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  if(activeOnlineAudio){
    try { activeOnlineAudio.pause(); activeOnlineAudio.currentTime = 0; } catch(e){}
    activeOnlineAudio = null;
  }

  let callbackCalled = false;
  const safeCallback = () => {
    if(callbackCalled) return;
    callbackCalled = true;
    const wave = document.getElementById('speech-wave');
    if(wave) wave.style.opacity = '0.3';
    window._activeUtterance = null;
    if(onCompleteCallback) onCompleteCallback();
  };

  const targetLang = (currentLanguage === 'mr') ? 'mr-IN' : (currentLanguage === 'hi') ? 'hi-IN' : 'en-IN';

  // TIER 1: Native SpeechSynthesis Engine
  if(window.speechSynthesis){
    try {
      if(window.speechSynthesis.paused){
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          window._activeUtterance = utterance; // Prevent GC bug

          const matchedVoice = getFemaleVoice(targetLang);
          if(matchedVoice){
            utterance.voice = matchedVoice;
            utterance.lang = matchedVoice.lang || targetLang;
          } else {
            utterance.lang = (targetLang.startsWith('en')) ? 'en-US' : targetLang;
          }

          // SLOW, CALM, SOOTHING RATE FOR MAXIMUM CLARITY (User requested slow pacing)
          utterance.rate = 0.80;
          utterance.pitch = 1.08;
          utterance.volume = 1.0;

          const wave = document.getElementById('speech-wave');
          let speechStarted = false;

          utterance.onstart = () => {
            speechStarted = true;
            if(wave && !isVoiceMuted) wave.style.opacity = '1';
          };

          utterance.onend = () => {
            safeCallback();
          };

          utterance.onerror = (e) => {
            console.log('Utterance error, falling back to online audio stream:', e);
            playOnlineTTS(cleanText, targetLang, safeCallback);
          };

          // Watchdog: If browser drops the speech silently without starting within 500ms, fallback to online audio stream
          setTimeout(() => {
            if(!speechStarted && !callbackCalled){
              console.log('SpeechSynthesis watchdog triggered. Streaming audio fallback...');
              playOnlineTTS(cleanText, targetLang, safeCallback);
            }
          }, 500);

          if(window.speechSynthesis.paused){
            window.speechSynthesis.resume();
          }

          window.speechSynthesis.speak(utterance);
        } catch(err) {
          console.log('Speech Synthesis Exception, fallback:', err);
          playOnlineTTS(cleanText, targetLang, safeCallback);
        }
      }, 50);
      return;
    } catch(err) {
      console.log('Speech Synthesis Outer Exception, fallback:', err);
    }
  }

  // TIER 2: Online Audio Streaming Fallback
  playOnlineTTS(cleanText, targetLang, safeCallback);
}

// Sound Test Function
function testAudioSound(){
  unlockAudioContext();
  if(isVoiceMuted){
    toggleGlobalMute();
  }
  const testMsg = (currentLanguage === 'mr')
    ? "नमस्कार! आवाज चालू आहे आणि सुनिता ताई आपल्या सेवेत हजर आहे."
    : (currentLanguage === 'hi')
    ? "नमस्ते! आवाज़ चालू है और सुनिता ताई आपकी सेवा में उपस्थित हैं।"
    : "Namaskar! Audio is working clearly, and Sunita Tai is speaking in Indian accent English.";
  speakVoice(testMsg);
}

if(typeof window !== 'undefined' && window.speechSynthesis){
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}