// /* ============================================================
//    sunita-tour.js
//    Auto-playing Sunita Tai voice guide: the 7-step scripted tour,
//    its play/pause/next/prev controller, app language switching, and
//    launch-page <-> app-shell navigation.
//    ============================================================ */

// const sunitaTourSteps = [
//   {
//     tab: 'tab-home',
//     navIndex: 0,
//     badge: '1 / 7 · Welcome',
//     text: {
//       hi: "नमस्ते! मैं सुनिता ताई हूँ। ग्राम आरोग्य कनेक्ट हमारे पूरे गाँव को बिना लाइन में लगे तुरंत और आसान स्वास्थ्य सेवा देता है। चलिए, मैं आपको सभी सुविधाएँ धीरे-धीरे दिखाती हूँ।",
//       mr: "नमस्कार! मी सुनिता ताई. ग्राम आरोग्य कनेक्ट आपल्या गावाला उन्हात न थांबता जलद आरोग्य सेवा देते. चला, मी तुम्हाला सर्व सुविधा सावकाश दाखवते.",
//       en: "Namaskar! I am Sunita Tai. Gram Arogya Connect gives our entire village fast, simple healthcare without the long wait. Let me calmly guide you through every function step by step."
//     },
//     action: async () => {
//       await sleep(1500);
//     }
//   },
//   {
//     tab: 'tab-triage',
//     navIndex: 1,
//     badge: '2 / 7 · Triage & Doctor Call',
//     text: {
//       hi: "पहला है डिजिटल ट्रायज! बीमार होने पर कुछ भी लिखने की जरूरत नहीं। बस बीमारी के चित्र पर टैप करें या बोलकर बताएं। आप तुरंत डॉक्टर से फोन पर बात कर सकते हैं!",
//       mr: "पहिले म्हणजे डिजिटल ट्रायज! आजारी असाल तर काहीही टाईप न करता फक्त चित्रावर बोट ठेवा किंवा तोंडाने बोला. थेट सरकारी डॉक्टरांशी ऑडिओ कॉलवर बोलता येते!",
//       en: "First, Digital Triage. If you feel unwell, simply tap the illness picture or speak aloud. You can immediately consult with the government doctor over an audio call."
//     },
//     action: async () => {
//       await sleep(1500);
//       document.querySelectorAll('.chip')[0]?.click();
//       await sleep(1500);
//       runTriage();
//       await sleep(2500);
//       connectDoctor();
//     }
//   },
//   {
//     tab: 'tab-appt',
//     navIndex: 2,
//     badge: '3 / 7 · Appointments & Live Queue',
//     text: {
//       hi: "दूसरा है लाइव टोकन! घर से ही समय बुक करें और स्क्रीन पर चालू टोकन नंबर देखें। अब धूप में ३ घंटे लाइन में लगने की जरूरत नहीं, आपका नंबर आने पर ही जाएं!",
//       mr: "दुसरे म्हणजे थेट रांग व्यवस्थापन! घरातूनच वेळ बुक करा आणि स्क्रीनवर चालू असलेला नंबर पहा. उन्हात ३ तास थांबण्याची अजिबात गरज नाही!",
//       en: "Next is Live Queue. Book your appointment slot from home and track your live token number on screen so you never wait in the hospital line."
//     },
//     action: async () => {
//       await sleep(1500);
//       document.querySelectorAll('#slot-grid button')[1]?.click();
//       await sleep(1500);
//       bookAppointment();
//     }
//   },
//   {
//     tab: 'tab-passport',
//     navIndex: 3,
//     badge: '4 / 7 · ABHA Digital Passport',
//     text: {
//       hi: "यह हमारा अलग और खास १४ अंकों का ABHA डिजिटल हेल्थ पासपोर्ट है! बिना इंटरनेट भी क्यूआर कोड में पूरा पर्चा रहता है, और बोलकर भी खुराक बताता है!",
//       mr: "हा आपला वेगळा १४ अंकी ABHA डिजिटल हेल्थ पासपोर्ट! सर्व आजाराची माहिती या ऑफलाइन क्यूआर कोडमध्ये साठवली जाते आणि बोलूनही सांगते!",
//       en: "This is our dedicated 14-digit ABHA Digital Health Passport. All your medical history and prescriptions are securely saved in this offline QR code."
//     },
//     action: async () => {
//       await sleep(1800);
//       playAudioRx();
//     }
//   },
//   {
//     tab: 'tab-schemes',
//     navIndex: 4,
//     badge: '5 / 7 · Govt Health Schemes',
//     text: {
//       hi: "यह हमारा सरकारी स्वास्थ्य योजना विभाग है! यहाँ आयुष्मान भारत PM-JAY और महात्मा ज्योतिराव फुले योजना में पूरे ५ लाख रुपये का मुफ़्त इलाज मिलता है।",
//       mr: "हा आपला सरकारी आरोग्य योजना विभाग आहे! येथे महात्मा ज्योतिराव फुले आणि आयुष्मान भारत योजनेतून कुटुंबासाठी ५ लाख रुपयांचे मोफत उपचार मिळतात.",
//       en: "This is our dedicated Government Health Schemes section. Check your family's eligibility for up to ₹5 Lakhs free cashless coverage under PM-JAY and MJPJAY."
//     },
//     action: async () => {
//       await sleep(1500);
//       renderSchemes();
//     }
//   },
//   {
//     tab: 'tab-medicine',
//     navIndex: 6,
//     badge: '6 / 7 · Daily Medicines Tracker',
//     text: {
//       hi: "दवाओं के लिए यह खास डोज़ ट्रैकर है! अगर दवा दिन में दो बार खानी है तो दो गोले दिखेंगे, टैप करते ही डोज़ पूरी हो जाएगी और अलार्म भी बोलेगा!",
//       mr: "औषधांसाठी हा खास डोस ट्रॅकर आहे! दिवसातून २ गोळ्या असतील तर २ गोल दिसतील, गोळी घेतल्यानंतर फक्त बोट ठेवा आणि डोस पूर्ण होईल!",
//       en: "Here is our Daily Medicines Tracker. If a medicine is prescribed twice daily, you see 2 interactive circles. Tapping them marks your dose as complete."
//     },
//     action: async () => {
//       await sleep(1500);
//       renderDoseTracker();
//       await sleep(2500);
//       triggerDoseNotificationSimulation();
//     }
//   },
//   {
//     tab: 'tab-dash',
//     navIndex: 7,
//     badge: '7 / 7 · ASHA & 24x7 Night Care',
//     text: {
//       hi: "अंत में, हमारी आशा दीदी इस लिस्ट से घर-घर जाकर मरीजों की देखभाल करती हैं। और कोई भी परेशानी हो तो नीचे मेरे चैटबॉट से सीधे बात करें!",
//       mr: "शेवटी, आपल्या गावातील आशा ताई गरोदर माता व रुग्णांच्या गृहभेटीसाठी ही यादी वापरतात. काहीही अडचण असल्यास माझ्या चॅटबॉटशी बोला!",
//       en: "Finally, our frontline ASHA workers use this priority list for maternal and home visits. If you ever need help, tap my assistant button anytime."
//     },
//     action: async () => {
//       await sleep(1500);
//       switchDash('asha', document.querySelectorAll('.dash-tab-btn')[0]);
//     }
//   }
// ];

// let currentTourIndex = 0;
// let isTourActive = false;
// let isTourPaused = false;
// let autoTourTimer = null;
// // Bumped on stop/advance so any pending step-completion callback captured
// // before the change can recognize it's stale and discard itself.
// let tourSessionId = 0;

// function setAppLanguage(lang){
//   currentLanguage = lang;

//   const launchSelect = document.getElementById('launch-lang-select');
//   if(launchSelect) launchSelect.value = lang;

//   const topSelect = document.getElementById('lang-select');
//   if(topSelect && topSelect.value !== lang) topSelect.value = lang;

//   const chatBadge = document.getElementById('chat-active-lang-badge');
//   if(chatBadge) chatBadge.innerText = `Online · Active: ${lang.toUpperCase()}`;

//   updateTourLanguageLabels();

//   const combo = document.querySelector('#google_translate_element select.goog-te-combo');
//   if(combo){
//     combo.value = (lang === 'en') ? '' : lang;
//     combo.dispatchEvent(new Event('change'));
//   }
// }

// function updateTourLanguageLabels(){
//   const labels = {
//     hi: { ctaLabel: 'आवाज़ से ऑटो टूर (धीमी गति)', ctaTitle: 'सुनिता ताई के साथ शांत व सहज ऑटो टूर', sub: 'गाँव वालों, आशा दीदी और डॉक्टरों के लिए आसान स्वास्थ्य सेवा।' },
//     mr: { ctaLabel: 'ध्वनी ऑटो टूर (सावकाश)', ctaTitle: 'सुनिता ताईंसोबत सावकाश व सोपा ऑटो टूर', sub: 'गावकऱ्यांसाठी, आशाताईंसाठी आणि डॉक्टरांसाठी सोपी आरोग्य यंत्रणा.' },
//     en: { ctaLabel: 'Slow Voice Walkthrough', ctaTitle: 'Start Calm Auto Tour with Sunita Tai', sub: 'A simple healthcare companion for villagers, ASHA workers, and doctors.' }
//   };
//   const l = labels[currentLanguage] || labels['en'];
//   document.getElementById('tour-cta-label').innerText = l.ctaLabel;
//   document.getElementById('tour-cta-title').innerText = l.ctaTitle;
//   document.getElementById('launch-subtext').innerText = l.sub;
// }

// function showLaunchPage(){
//   stopSunitaTour();
//   const launchEl = document.getElementById('launch-page');
//   launchEl.classList.remove('hidden');
//   if(typeof anime !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
//     launchEl.style.opacity = 0;
//     anime({ targets: launchEl, opacity: [0, 1], duration: 400, easing: 'easeOutExpo' });
//   }
// }

// function enterAppDirectly(){
//   unlockAudioContext();
//   const launchEl = document.getElementById('launch-page');
//   if(typeof anime !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
//     anime({
//       targets: launchEl,
//       opacity: [1, 0],
//       duration: 350,
//       easing: 'easeInExpo',
//       complete: () => {
//         launchEl.classList.add('hidden');
//         launchEl.style.opacity = '';
//       }
//     });
//   } else {
//     launchEl.classList.add('hidden');
//   }
// }

// // Stops every possible audio channel at once — the native speechSynthesis
// // engine AND the online-TTS fallback stream — so pausing or changing a
// // tour step can never leave a stray voice still playing underneath.
// function haltAllAudio(){
//   if(window.speechSynthesis) window.speechSynthesis.cancel();
//   if(activeOnlineAudio){
//     try { activeOnlineAudio.pause(); activeOnlineAudio.currentTime = 0; } catch(e){}
//     activeOnlineAudio = null;
//   }
// }

// function startSunitaAutoTour(){
//   unlockAudioContext();
//   enterAppDirectly();
//   isTourActive = true;
//   isTourPaused = false;
//   currentTourIndex = 0;
//   document.getElementById('sunita-guide-bar').classList.remove('hidden');
//   runTourStep(0);
// }

// function stopSunitaTour(){
//   isTourActive = false;
//   clearTimeout(autoTourTimer);
//   document.getElementById('sunita-guide-bar').classList.add('hidden');
//   haltAllAudio();
// }

// function toggleTourPause(){
//   isTourPaused = !isTourPaused;
//   const icon = document.getElementById('tour-pause-icon');
//   if(isTourPaused){
//     icon.className = 'fa-solid fa-play';
//     clearTimeout(autoTourTimer);
//     if(window.speechSynthesis) window.speechSynthesis.pause();
//     if(activeOnlineAudio){ try{ activeOnlineAudio.pause(); }catch(e){} }
//   } else {
//     icon.className = 'fa-solid fa-pause';
//     // Resume only the channel that was actually speaking — never both —
//     // so we never accidentally start a second overlapping stream.
//     if(activeOnlineAudio){
//       try{ activeOnlineAudio.play(); }catch(e){}
//     } else if(window.speechSynthesis){
//       window.speechSynthesis.resume();
//     }
//   }
// }

// async function runTourStep(idx){
//   if(!isTourActive) return;
//   currentTourIndex = idx;
//   const step = sunitaTourSteps[idx];
//   const navBtns = document.querySelectorAll('.nav-btn');

//   switchTab(step.tab, navBtns[step.navIndex]);

//   document.getElementById('tour-step-badge').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Slow Auto Tour (${idx+1}/7)`;
//   const textMsg = step.text[currentLanguage] || step.text['en'];
//   document.getElementById('tour-speech-text').innerText = `"${textMsg}"`;

//   document.getElementById('tour-prev-btn').disabled = (idx === 0);

//   try {
//     await step.action();
//   } catch(e) {
//     console.log(e);
//   }

//   speakVoice(textMsg, () => {
//     if(isTourActive && !isTourPaused){
//       // RELAXED, SLOW 4.5 SECONDS PAUSE FOR MAXIMUM COMPREHENSION
//       autoTourTimer = setTimeout(() => {
//         if(currentTourIndex < sunitaTourSteps.length - 1){
//           runTourStep(currentTourIndex + 1);
//         } else {
//           stopSunitaTour();
//           toggleSunitaChatbot(true);
//         }
//       }, 4500);
//     }
//   });
// }

// function nextTourStep(){
//   clearTimeout(autoTourTimer);
//   haltAllAudio();
//   if(currentTourIndex < sunitaTourSteps.length - 1){
//     runTourStep(currentTourIndex + 1);
//   } else {
//     stopSunitaTour();
//   }
// }

// function prevTourStep(){
//   clearTimeout(autoTourTimer);
//   haltAllAudio();
//   if(currentTourIndex > 0){
//     runTourStep(currentTourIndex - 1);
//   }
// }


/* ============================================================
   sunita-tour.js
   Auto-playing Sunita Tai voice guide: the 7-step scripted tour,
   its play/pause/next/prev controller, app language switching, and
   launch-page <-> app-shell navigation.
   ============================================================ */

const sunitaTourSteps = [
  {
    tab: 'tab-home',
    navIndex: 0,
    badge: '1 / 7 · Welcome',
    text: {
      hi: "नमस्ते! मैं सुनिता ताई हूँ। ग्राम आरोग्य कनेक्ट हमारे पूरे गाँव को बिना लाइन में लगे तुरंत और आसान स्वास्थ्य सेवा देता है। चलिए, मैं आपको सभी सुविधाएँ धीरे-धीरे दिखाती हूँ।",
      mr: "नमस्कार! मी सुनिता ताई. ग्राम आरोग्य कनेक्ट आपल्या गावाला उन्हात न थांबता जलद आरोग्य सेवा देते. चला, मी तुम्हाला सर्व सुविधा सावकाश दाखवते.",
      en: "Namaskar! I am Sunita Tai. Gram Arogya Connect gives our entire village fast, simple healthcare without the long wait. Let me calmly guide you through every function step by step."
    },
    action: async () => {
      await sleep(1500);
    }
  },
  {
    tab: 'tab-triage',
    navIndex: 1,
    badge: '2 / 7 · Triage & Doctor Call',
    text: {
      hi: "पहला है डिजिटल ट्रायज! बीमार होने पर कुछ भी लिखने की जरूरत नहीं। बस बीमारी के चित्र पर टैप करें या बोलकर बताएं। आप तुरंत डॉक्टर से फोन पर बात कर सकते हैं!",
      mr: "पहिले म्हणजे डिजिटल ट्रायज! आजारी असाल तर काहीही टाईप न करता फक्त चित्रावर बोट ठेवा किंवा तोंडाने बोला. थेट सरकारी डॉक्टरांशी ऑडिओ कॉलवर बोलता येते!",
      en: "First, Digital Triage. If you feel unwell, simply tap the illness picture or speak aloud. You can immediately consult with the government doctor over an audio call."
    },
    action: async () => {
      await sleep(1500);
      document.querySelectorAll('.chip')[0]?.click();
      await sleep(1500);
      runTriage();
      await sleep(2500);
      connectDoctor();
    }
  },
  {
    tab: 'tab-appt',
    navIndex: 2,
    badge: '3 / 7 · Appointments & Live Queue',
    text: {
      hi: "दूसरा है लाइव टोकन! घर से ही समय बुक करें और स्क्रीन पर चालू टोकन नंबर देखें। अब धूप में ३ घंटे लाइन में लगने की जरूरत नहीं, आपका नंबर आने पर ही जाएं!",
      mr: "दुसरे म्हणजे थेट रांग व्यवस्थापन! घरातूनच वेळ बुक करा आणि स्क्रीनवर चालू असलेला नंबर पहा. उन्हात ३ तास थांबण्याची अजिबात गरज नाही!",
      en: "Next is Live Queue. Book your appointment slot from home and track your live token number on screen so you never wait in the hospital line."
    },
    action: async () => {
      await sleep(1500);
      document.querySelectorAll('#slot-grid button')[1]?.click();
      await sleep(1500);
      bookAppointment();
    }
  },
  {
    tab: 'tab-passport',
    navIndex: 3,
    badge: '4 / 7 · ABHA Digital Passport',
    text: {
      hi: "यह हमारा अलग और खास १४ अंकों का ABHA डिजिटल हेल्थ पासपोर्ट है! बिना इंटरनेट भी क्यूआर कोड में पूरा पर्चा रहता है, और बोलकर भी खुराक बताता है!",
      mr: "हा आपला वेगळा १४ अंकी ABHA डिजिटल हेल्थ पासपोर्ट! सर्व आजाराची माहिती या ऑफलाइन क्यूआर कोडमध्ये साठवली जाते आणि बोलूनही सांगते!",
      en: "This is our dedicated 14-digit ABHA Digital Health Passport. All your medical history and prescriptions are securely saved in this offline QR code."
    },
    action: async () => {
      await sleep(1800);
      playAudioRx();
    }
  },
  {
    tab: 'tab-schemes',
    navIndex: 4,
    badge: '5 / 7 · Govt Health Schemes',
    text: {
      hi: "यह हमारा सरकारी स्वास्थ्य योजना विभाग है! यहाँ आयुष्मान भारत PM-JAY और महात्मा ज्योतिराव फुले योजना में पूरे ५ लाख रुपये का मुफ़्त इलाज मिलता है।",
      mr: "हा आपला सरकारी आरोग्य योजना विभाग आहे! येथे महात्मा ज्योतिराव फुले आणि आयुष्मान भारत योजनेतून कुटुंबासाठी ५ लाख रुपयांचे मोफत उपचार मिळतात.",
      en: "This is our dedicated Government Health Schemes section. Check your family's eligibility for up to ₹5 Lakhs free cashless coverage under PM-JAY and MJPJAY."
    },
    action: async () => {
      await sleep(1500);
      renderSchemes();
    }
  },
  {
    tab: 'tab-medicine',
    navIndex: 6,
    badge: '6 / 7 · Daily Medicines Tracker',
    text: {
      hi: "दवाओं के लिए यह खास डोज़ ट्रैकर है! अगर दवा दिन में दो बार खानी है तो दो गोले दिखेंगे, टैप करते ही डोज़ पूरी हो जाएगी और अलार्म भी बोलेगा!",
      mr: "औषधांसाठी हा खास डोस ट्रॅकर आहे! दिवसातून २ गोळ्या असतील तर २ गोल दिसतील, गोळी घेतल्यानंतर फक्त बोट ठेवा आणि डोस पूर्ण होईल!",
      en: "Here is our Daily Medicines Tracker. If a medicine is prescribed twice daily, you see 2 interactive circles. Tapping them marks your dose as complete."
    },
    action: async () => {
      await sleep(1500);
      renderDoseTracker();
      await sleep(2500);
      triggerDoseNotificationSimulation();
    }
  },
  {
    tab: 'tab-dash',
    navIndex: 7,
    badge: '7 / 7 · ASHA & 24x7 Night Care',
    text: {
      hi: "अंत में, हमारी आशा दीदी इस लिस्ट से घर-घर जाकर मरीजों की देखभाल करती हैं। और कोई भी परेशानी हो तो नीचे मेरे चैटबॉट से सीधे बात करें!",
      mr: "शेवटी, आपल्या गावातील आशा ताई गरोदर माता व रुग्णांच्या गृहभेटीसाठी ही यादी वापरतात. काहीही अडचण असल्यास माझ्या चॅटबॉटशी बोला!",
      en: "Finally, our frontline ASHA workers use this priority list for maternal and home visits. If you ever need help, tap my assistant button anytime."
    },
    action: async () => {
      await sleep(1500);
      switchDash('asha', document.querySelectorAll('.dash-tab-btn')[0]);
    }
  }
];

let currentTourIndex = 0;
let isTourActive = false;
let isTourPaused = false;
let autoTourTimer = null;
// Bumped on start/stop/next/prev so any pending step-completion callback
// captured before the change can recognize it's stale and discard itself.
let tourSessionId = 0;

function setAppLanguage(lang){
  currentLanguage = lang;

  const launchSelect = document.getElementById('launch-lang-select');
  if(launchSelect) launchSelect.value = lang;

  const topSelect = document.getElementById('lang-select');
  if(topSelect && topSelect.value !== lang) topSelect.value = lang;

  const chatBadge = document.getElementById('chat-active-lang-badge');
  if(chatBadge) chatBadge.innerText = `Online · Active: ${lang.toUpperCase()}`;

  updateTourLanguageLabels();

  const combo = document.querySelector('#google_translate_element select.goog-te-combo');
  if(combo){
    combo.value = (lang === 'en') ? '' : lang;
    combo.dispatchEvent(new Event('change'));
  }
}

function updateTourLanguageLabels(){
  const labels = {
    hi: { ctaLabel: 'आवाज़ से ऑटो टूर (धीमी गति)', ctaTitle: 'सुनिता ताई के साथ शांत व सहज ऑटो टूर', sub: 'गाँव वालों, आशा दीदी और डॉक्टरों के लिए आसान स्वास्थ्य सेवा।' },
    mr: { ctaLabel: 'ध्वनी ऑटो टूर (सावकाश)', ctaTitle: 'सुनिता ताईंसोबत सावकाश व सोपा ऑटो टूर', sub: 'गावकऱ्यांसाठी, आशाताईंसाठी आणि डॉक्टरांसाठी सोपी आरोग्य यंत्रणा.' },
    en: { ctaLabel: 'Slow Voice Walkthrough', ctaTitle: 'Start Calm Auto Tour with Sunita Tai', sub: 'A simple healthcare companion for villagers, ASHA workers, and doctors.' }
  };
  const l = labels[currentLanguage] || labels['en'];
  document.getElementById('tour-cta-label').innerText = l.ctaLabel;
  document.getElementById('tour-cta-title').innerText = l.ctaTitle;
  document.getElementById('launch-subtext').innerText = l.sub;
}

function showLaunchPage(){
  stopSunitaTour();
  const launchEl = document.getElementById('launch-page');
  launchEl.classList.remove('hidden');
  if(typeof anime !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    launchEl.style.opacity = 0;
    anime({ targets: launchEl, opacity: [0, 1], duration: 400, easing: 'easeOutExpo' });
  }
}

function enterAppDirectly(){
  unlockAudioContext();
  const launchEl = document.getElementById('launch-page');
  if(typeof anime !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    anime({
      targets: launchEl,
      opacity: [1, 0],
      duration: 350,
      easing: 'easeInExpo',
      complete: () => {
        launchEl.classList.add('hidden');
        launchEl.style.opacity = '';
      }
    });
  } else {
    launchEl.classList.add('hidden');
  }
}

// Stops every possible audio channel at once — the native speechSynthesis
// engine AND the online-TTS fallback stream — so pausing or changing a
// tour step can never leave a stray voice still playing underneath.
function haltAllAudio(){
  if(window.speechSynthesis) window.speechSynthesis.cancel();
  if(activeOnlineAudio){
    try { activeOnlineAudio.pause(); activeOnlineAudio.currentTime = 0; } catch(e){}
    activeOnlineAudio = null;
  }
}

function startSunitaAutoTour(){
  unlockAudioContext();
  enterAppDirectly();
  tourSessionId++; // invalidate any callback still in flight from a prior tour run
  isTourActive = true;
  isTourPaused = false;
  currentTourIndex = 0;
  document.getElementById('sunita-guide-bar').classList.remove('hidden');
  runTourStep(0);
}

function stopSunitaTour(){
  tourSessionId++; // invalidate any callback still in flight from the step that was running
  isTourActive = false;
  clearTimeout(autoTourTimer);
  document.getElementById('sunita-guide-bar').classList.add('hidden');
  haltAllAudio();
}

function toggleTourPause(){
  isTourPaused = !isTourPaused;
  const icon = document.getElementById('tour-pause-icon');
  if(isTourPaused){
    icon.className = 'fa-solid fa-play';
    clearTimeout(autoTourTimer);
    if(window.speechSynthesis) window.speechSynthesis.pause();
    if(activeOnlineAudio){ try{ activeOnlineAudio.pause(); }catch(e){} }
  } else {
    icon.className = 'fa-solid fa-pause';
    // Resume only the channel that was actually speaking — never both —
    // so we never accidentally start a second overlapping stream.
    if(activeOnlineAudio){
      try{ activeOnlineAudio.play(); }catch(e){}
    } else if(window.speechSynthesis){
      window.speechSynthesis.resume();
    }
  }
}

async function runTourStep(idx){
  if(!isTourActive) return;
  currentTourIndex = idx;
  // Snapshot the session id for this run of runTourStep. If startSunitaAutoTour,
  // stopSunitaTour, nextTourStep, or prevTourStep fire while this step's async
  // action() or speakVoice() is still in flight, tourSessionId will have moved
  // on and this stale invocation's completion callback becomes a no-op instead
  // of scheduling a duplicate/racing advance to the next step.
  const mySessionId = tourSessionId;
  const step = sunitaTourSteps[idx];
  const navBtns = document.querySelectorAll('.nav-btn');

  switchTab(step.tab, navBtns[step.navIndex]);

  document.getElementById('tour-step-badge').innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Slow Auto Tour (${idx+1}/7)`;
  const textMsg = step.text[currentLanguage] || step.text['en'];
  document.getElementById('tour-speech-text').innerText = `"${textMsg}"`;

  document.getElementById('tour-prev-btn').disabled = (idx === 0);

  try {
    await step.action();
  } catch(e) {
    console.log(e);
  }

  // If the tour was stopped/advanced/rewound while step.action() was awaiting,
  // this invocation is stale — bail out before kicking off speech for a step
  // the user has already left.
  if(mySessionId !== tourSessionId) return;

  speakVoice(textMsg, () => {
    // Re-check after the (possibly long) speech finishes — the session may
    // have moved on in the meantime via next/prev/stop.
    if(mySessionId !== tourSessionId) return;
    if(isTourActive && !isTourPaused){
      // RELAXED, SLOW 4.5 SECONDS PAUSE FOR MAXIMUM COMPREHENSION
      autoTourTimer = setTimeout(() => {
        if(mySessionId !== tourSessionId) return;
        if(currentTourIndex < sunitaTourSteps.length - 1){
          runTourStep(currentTourIndex + 1);
        } else {
          stopSunitaTour();
          toggleSunitaChatbot(true);
        }
      }, 4500);
    }
  });
}

function nextTourStep(){
  tourSessionId++; // invalidate the step we're leaving
  clearTimeout(autoTourTimer);
  haltAllAudio();
  if(currentTourIndex < sunitaTourSteps.length - 1){
    runTourStep(currentTourIndex + 1);
  } else {
    stopSunitaTour();
  }
}

function prevTourStep(){
  tourSessionId++; // invalidate the step we're leaving
  clearTimeout(autoTourTimer);
  haltAllAudio();
  if(currentTourIndex > 0){
    runTourStep(currentTourIndex - 1);
  }
}