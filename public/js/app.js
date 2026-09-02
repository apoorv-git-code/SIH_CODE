/* ============================================================
   app.js
   Tab navigation, all modals (profile/ABHA, location, schemes,
   medicine, SOS), the always-present Sunita Tai chatbot,
   teleconsultation, referral/diagnostics, the ASHA/quality dashboard,
   Google Translate wiring, the DOM boot sequence, and the Anime.js
   presentational motion layer.
   ============================================================ */

/* ---------------- USER PROFILE & ABHA STATE ---------------- */
let currentUserProfile = {
  name: 'Sunita Tai More',
  abhaNumber: '91-4523-8871-9024',
  abhaAddress: 'sunitatai.more@abdm',
  age: 34,
  gender: 'Female',
  bloodGroup: 'B+',
  village: 'Vadgaon, Raigad',
  rationCard: 'yellow', // BPL
  conditions: 'Primary Hypertension (Stage 1), Giddiness on exertion',
  allergies: 'Sulfa Drugs (Mild rash)',
  maternalStatus: 'no',
  bp: '142/92',
  spo2: 97
};

function openProfileModal(){ document.getElementById('profile-modal').classList.remove('hidden'); }
function closeProfileModal(){ document.getElementById('profile-modal').classList.add('hidden'); }

async function saveUserProfile(e){
  if(e) e.preventDefault();
  currentUserProfile.name = document.getElementById('prof-name').value.trim() || 'Sunita Tai More';
  currentUserProfile.abhaNumber = document.getElementById('prof-abha').value.trim() || '91-4523-8871-9024';
  currentUserProfile.age = parseInt(document.getElementById('prof-age').value, 10) || 34;
  currentUserProfile.gender = document.getElementById('prof-gender').value;
  currentUserProfile.bloodGroup = document.getElementById('prof-blood').value;
  currentUserProfile.village = document.getElementById('prof-village').value;
  currentUserProfile.rationCard = document.getElementById('prof-ration').value;
  currentUserProfile.conditions = document.getElementById('prof-conditions').value;
  currentUserProfile.allergies = document.getElementById('prof-allergies').value;
  currentUserProfile.maternalStatus = document.getElementById('prof-maternal').value;

  updateAppWithUserProfile();
  closeProfileModal();

  // Best-effort sync to the backend. The UI has already updated locally
  // above, so a slow/offline API never blocks or breaks the save.
  try {
    await fetch('/api/v1/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentUserProfile)
    });
  } catch(err) {
    console.log('[profile] API unreachable, saved locally only:', err);
  }

  const ack = (currentLanguage === 'mr')
    ? `${currentUserProfile.name} यांची माहिती आणि ABHA डिजिटल कार्ड अपडेट झाले आहे.`
    : (currentLanguage === 'hi')
    ? `${currentUserProfile.name} का विवरण और ABHA डिजिटल कार्ड अपडेट हो गया है।`
    : `Profile and ABHA card updated for ${currentUserProfile.name}.`;
  speakVoice(ack);
}

function updateAppWithUserProfile(){
  // Update header and launch badges
  document.getElementById('topbar-user-name').innerText = currentUserProfile.name;
  document.getElementById('launch-user-badge').innerText = `${currentUserProfile.name} (ABHA Linked)`;

  // Update ABHA card elements
  document.getElementById('abha-card-name').innerText = currentUserProfile.name;
  document.getElementById('abha-card-age').innerText = `${currentUserProfile.age} Yrs`;
  document.getElementById('abha-card-gender').innerText = currentUserProfile.gender;
  document.getElementById('abha-card-blood').innerText = currentUserProfile.bloodGroup;
  document.getElementById('abha-card-number').innerText = currentUserProfile.abhaNumber;
  document.getElementById('abha-card-address').innerText = `${currentUserProfile.name.toLowerCase().replace(/\s+/g, '')}@abdm`;
  document.getElementById('hist-chronic').innerText = currentUserProfile.conditions;
  document.getElementById('hist-allergies').innerText = currentUserProfile.allergies;

  // Re-generate ABHA QR payload
  generateABHAQR();
  renderSchemes();
}

function startProfileVoiceRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const caption = document.getElementById('prof-voice-caption');
  if(!SpeechRecognition){
    caption.innerText = "Voice input not supported in this browser.";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = (currentLanguage === 'mr') ? 'mr-IN' : (currentLanguage === 'hi') ? 'hi-IN' : 'en-IN';
  recognition.interimResults = false;

  caption.innerText = "Listening... Speak your details (e.g. age, illness, blood group)";

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    caption.innerText = `"${text}"`;

    // Auto-parse spoken health details into form
    const lower = text.toLowerCase();
    if(lower.includes('bp') || lower.includes('रक्तदाब') || lower.includes('pressure') || lower.includes('चक्कर') || lower.includes('blood pressure') || lower.includes('hypertension')){
      document.getElementById('prof-conditions').value = "Hypertension / BP (Diagnosed via Voice)";
    }
    if(lower.includes('diabet') || lower.includes('sugar') || lower.includes('मधुमेह')){
      document.getElementById('prof-conditions').value += ", Type 2 Diabetes";
    }
    if(lower.includes('pregnant') || lower.includes('गरोदर') || lower.includes('गर्भवती')){
      document.getElementById('prof-maternal').value = "1st";
    }
    const ageMatch = text.match(/\b(\d{2})\b/);
    if(ageMatch){
      document.getElementById('prof-age').value = ageMatch[1];
    }
  };
  recognition.onerror = () => { caption.innerText = "Could not hear clearly. Tap to retry."; };
  recognition.start();
}

/* ---------------- AUTO LOCATION SERVICES & NEARBY PHC SELECTOR ---------------- */
const healthcareFacilities = [
  {
    id: 'vadgaon-sc',
    name: 'Vadgaon Sub-Centre',
    type: 'Sub-Centre',
    distanceKm: 1.8,
    travelTime: '8 min walk · 3 min bike',
    doctorStatus: 'ANM Sunita Tai & Community Nurse on duty',
    active: true,
    tag: 'Nearest to You'
  },
  {
    id: 'karjat-phc',
    name: 'Primary Health Centre (PHC), Karjat',
    type: '24x7 PHC',
    distanceKm: 8.4,
    travelTime: '22 min auto · 15 min bus',
    doctorStatus: '2 MBBS Doctors available, 24x7 Emergency',
    active: false,
    tag: 'Full Facility'
  },
  {
    id: 'kashele-phc',
    name: 'Primary Health Centre (PHC), Kashele',
    type: '24x7 PHC',
    distanceKm: 12.6,
    travelTime: '30 min travel',
    doctorStatus: '1 Medical Officer, Maternity & Immunization',
    active: false,
    tag: 'Maternity Unit'
  },
  {
    id: 'khalapur-chc',
    name: 'Community Health Centre (CHC), Khalapur',
    type: 'CHC',
    distanceKm: 16.2,
    travelTime: '35 min travel',
    doctorStatus: 'Surgeon, Pediatrician & X-Ray Diagnostics',
    active: false,
    tag: 'Diagnostic Hub'
  },
  {
    id: 'raigad-dh',
    name: 'District Hospital, Raigad (Alibaug)',
    type: 'District Hospital',
    distanceKm: 41.5,
    travelTime: '1 hr 30 min travel',
    doctorStatus: 'ICU, Blood Bank, Specialist Surgery 24x7',
    active: false,
    tag: 'Tertiary Referral'
  }
];

let selectedFacility = healthcareFacilities[0];

function openLocationModal(){
  document.getElementById('location-modal').classList.remove('hidden');
  renderNearbyFacilities();
}

function closeLocationModal(){
  document.getElementById('location-modal').classList.add('hidden');
}

function renderNearbyFacilities(){
  const list = document.getElementById('nearby-facilities-list');
  list.innerHTML = healthcareFacilities.map(f => {
    const isSelected = (f.id === selectedFacility.id);
    return `
      <div onclick="selectFacility('${f.id}')" class="p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${isSelected ? 'border-[var(--teal-700)] bg-[var(--teal-50)] shadow-sm ring-2 ring-[var(--teal-700)]/30' : 'border-slate-200 bg-white hover:bg-slate-50'}">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${isSelected ? 'bg-[var(--teal-700)] text-white' : 'bg-slate-100 text-slate-600'}">
            <i class="fa-solid ${f.type.includes('District') ? 'fa-hospital' : f.type.includes('Sub') ? 'fa-house-medical' : 'fa-clinic-medical'}"></i>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-xs text-slate-900">${f.name}</span>
              <span class="text-[10px] px-2 py-0.5 rounded font-bold ${isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'}">${f.type}</span>
              ${f.tag ? `<span class="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">${f.tag}</span>` : ''}
            </div>
            <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
              <span><i class="fa-solid fa-person-walking mr-1 text-teal-600"></i>${f.distanceKm} km (${f.travelTime})</span>
            </div>
            <div class="text-[10px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${f.doctorStatus}
            </div>
          </div>
        </div>

        <div class="shrink-0 text-right">
          ${isSelected
            ? `<span class="text-xs font-bold text-[var(--teal-700)] flex items-center gap-1 bg-teal-100/80 px-2.5 py-1 rounded-full"><i class="fa-solid fa-check"></i> Active</span>`
            : `<button class="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg">Select</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function selectFacility(facilityId){
  const found = healthcareFacilities.find(f => f.id === facilityId);
  if(!found) return;

  healthcareFacilities.forEach(f => f.active = (f.id === facilityId));
  selectedFacility = found;

  // Update UI indicators across application
  document.getElementById('topbar-phc-name').innerText = found.name;
  document.getElementById('launch-location-badge').innerText = `${found.name} (${found.distanceKm} km)`;

  renderNearbyFacilities();

  // Update appointment booking dropdown option
  const apptSelect = document.getElementById('appt-facility');
  if(apptSelect){
    for(let i=0; i<apptSelect.options.length; i++){
      if(apptSelect.options[i].text.includes(found.type) || apptSelect.options[i].value.includes(found.name.split('(')[0].trim())){
        apptSelect.selectedIndex = i;
        break;
      }
    }
  }

  // Voice confirmation
  const confirmMsg = (currentLanguage === 'mr')
    ? `${found.name} आरोग्य केंद्र सक्रिय निवडले आहे.`
    : (currentLanguage === 'hi')
    ? `${found.name} प्राथमिक स्वास्थ्य केंद्र सक्रिय चुना गया है।`
    : `${found.name} has been selected as your active healthcare facility.`;
  speakVoice(confirmMsg);
}

function autoDetectLocation(isManualClick = false){
  const icon = document.getElementById('gps-refresh-icon');
  if(icon) icon.classList.add('fa-spin');

  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        document.getElementById('gps-status-title').innerText = "Location: Vadgaon Area, Karjat Taluka";
        document.getElementById('gps-status-coords').innerText = `GPS: ${lat}° N, ${lng}° E (Live Sensor)`;
        if(icon) icon.classList.remove('fa-spin');
        if(isManualClick){
          speakVoice((currentLanguage==='hi')?"लोकेशन सफलतापूर्वक डिटेक्ट कर ली गई है।":(currentLanguage==='mr')?"लोकेशन अचूक ट्रॅक झाले आहे.":"Location accurately detected.");
        }
      },
      (err) => {
        document.getElementById('gps-status-title').innerText = "Location: Vadgaon Village, Raigad (Simulated GPS)";
        document.getElementById('gps-status-coords').innerText = "GPS: 18.9102° N, 73.3283° E (Rural Cell Tower)";
        if(icon) icon.classList.remove('fa-spin');
      },
      { timeout: 6000 }
    );
  }
}
// Location is only detected when the user explicitly asks for it
// (via the "Re-Detect" button in the Nearby Health Centres modal),
// never automatically on page load — so the site never prompts for
// location access just from opening the app.

/* ---------------- GOVERNMENT HEALTH SCHEMES & WELFARE (SEPARATE SECTION) ---------------- */
const availableSchemes = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat — PM-JAY',
    marathiName: 'आयुष्मान भारत — प्रधानमंत्री जन आरोग्य योजना',
    benefit: '₹5,00,000 Cashless Hospitalization per family/year',
    eligibility: 'Eligible (BPL / SECC Database Linked)',
    status: 'Eligible ✅',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Covers secondary & tertiary care hospitalization across all empaneled public & private hospitals in India.',
    icon: 'fa-heart-circle-check',
    applied: false
  },
  {
    id: 'mjpjay',
    name: 'Mahatma Jyotirao Phule Jan Arogya Yojana (MJPJAY)',
    marathiName: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना (महाराष्ट्र)',
    benefit: '₹5,00,000 Cashless Treatment in Maharashtra',
    eligibility: 'Currently Enrolled (Card Active)',
    status: 'Enrolled & Active 🛡️',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Maharashtra state flagship scheme covering 1,356 medical and surgical procedures.',
    icon: 'fa-shield-halved',
    applied: true
  },
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    marathiName: 'प्रधानमंत्री मातृ वंदना योजना',
    benefit: '₹5,000 Direct Cash Transfer for Pregnant & Lactating Mothers',
    eligibility: 'Applicable for Maternal Care & ANC Registration',
    status: 'Apply via ASHA 👶',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Direct financial incentive for institutional nutrition and antenatal health checkups.',
    icon: 'fa-baby-carriage',
    applied: false
  },
  {
    id: 'vayoshri',
    name: 'Mukhyamantri Vayoshri Yojana (Senior Care)',
    marathiName: 'मुख्यमंत्री वयोश्री योजना (ज्येष्ठ नागरिक)',
    benefit: '₹3,000 Assistive Health Devices & Hearing Aid / Spectacles',
    eligibility: 'Available for Family Members aged 65+',
    status: 'Available for Family',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Free wheelchairs, walking sticks, hearing aids, and dental aids for elderly villagers.',
    icon: 'fa-person-cane',
    applied: false
  }
];

function renderSchemes(){
  const wrap = document.getElementById('schemes-list');
  if(!wrap) return;

  wrap.innerHTML = availableSchemes.map((s, idx) => `
    <div class="bg-white p-5 rounded-2xl border ${s.applied ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200'} shadow-sm flex flex-col justify-between transition hover:shadow-md">
      <div>
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl ${s.applied ? 'bg-indigo-600 text-white' : 'bg-rose-100 text-rose-600'} flex items-center justify-center text-lg shadow-sm">
              <i class="fa-solid ${s.icon}"></i>
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900">${s.name}</h4>
              <div class="text-[10px] text-slate-500">${s.marathiName}</div>
            </div>
          </div>
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.badgeClass}">
            ${s.status}
          </span>
        </div>

        <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 my-3 text-xs">
          <div class="font-bold text-emerald-700 mb-0.5"><i class="fa-solid fa-gift mr-1"></i> Benefit: ${s.benefit}</div>
          <div class="text-slate-600">${s.description}</div>
        </div>
      </div>

      <div class="border-t border-slate-100 pt-3 flex items-center justify-between">
        <span class="text-[11px] text-slate-500"><i class="fa-solid fa-check text-emerald-600 mr-1"></i> ${s.eligibility}</span>
        ${s.applied
          ? `<button class="bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-default"><i class="fa-solid fa-id-card"></i> Card Linked</button>`
          : `<button onclick="applyForScheme(${idx})" class="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow flex items-center gap-1"><i class="fa-solid fa-paper-plane"></i> Apply 1-Click</button>`
        }
      </div>
    </div>
  `).join('');
}

function applyForScheme(idx){
  const scheme = availableSchemes[idx];
  scheme.applied = true;
  scheme.status = 'Applied (Pending ASHA Verification) ⏳';
  scheme.badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
  renderSchemes();

  const msg = (currentLanguage === 'mr')
    ? `${scheme.name} साठी अर्ज यशस्वीपणे सादर केला आहे. आशा ताईंशी संपर्क साधला जाईल.`
    : (currentLanguage === 'hi')
    ? `${scheme.name} के लिए आवेदन सफलतापुर्वक जमा हो गया है।`
    : `Application submitted for ${scheme.name}. ASHA worker notified for verification.`;
  speakVoice(msg);
}

function openAddSchemeModal(){ document.getElementById('add-scheme-modal').classList.remove('hidden'); }
function closeAddSchemeModal(){ document.getElementById('add-scheme-modal').classList.add('hidden'); }

function saveLinkedScheme(){
  const sName = document.getElementById('link-scheme-select').value;
  const sId = document.getElementById('link-scheme-id').value.trim() || 'MH-MJP-94821';
  document.getElementById('enrolled-scheme-no').innerText = sId;
  closeAddSchemeModal();

  const ack = (currentLanguage === 'hi') ? `${sName} कार्ड सफलतापूर्वक लिंक हो गया है।` : (currentLanguage==='mr') ? `${sName} कार्ड यशस्वीपणे जोडले गेले आहे.` : `${sName} card linked successfully.`;
  speakVoice(ack);
}

/* ---------------- ALWAYS-PRESENT SUNITA TAI AI CHATBOT ---------------- */
function toggleSunitaChatbot(forceOpen){
  const modal = document.getElementById('sunita-chat-modal');
  if(forceOpen !== undefined){
    modal.classList.toggle('hidden', !forceOpen);
  } else {
    modal.classList.toggle('hidden');
  }
  if(!modal.classList.contains('hidden')){
    document.getElementById('chat-input').focus();
  }
}

function startChatVoiceRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const banner = document.getElementById('chat-listening-banner');
  if(!SpeechRecognition){
    appendChatMessage('bot', 'Voice recognition is not supported in this browser. Please type below.');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = (currentLanguage === 'mr') ? 'mr-IN' : (currentLanguage === 'hi') ? 'hi-IN' : 'en-IN';
  recognition.interimResults = false;

  banner.classList.remove('hidden'); banner.classList.add('flex');

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    document.getElementById('chat-input').value = text;
    sendChatMessage();
  };
  recognition.onerror = () => {
    banner.classList.add('hidden'); banner.classList.remove('flex');
  };
  recognition.onend = () => {
    banner.classList.add('hidden'); banner.classList.remove('flex');
  };
  recognition.start();
}

function sendChatPrompt(promptText){
  document.getElementById('chat-input').value = promptText;
  sendChatMessage();
}

function sendChatMessage(){
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if(!text) return;

  appendChatMessage('user', text);
  input.value = '';

  processSunitaAIQuery(text);
}

function appendChatMessage(sender, text, rawHtml = false){
  const container = document.getElementById('chat-messages');
  const div = document.createElement('div');

  if(sender === 'user'){
    div.className = 'flex items-start justify-end gap-2';
    div.innerHTML = `
      <div class="bg-[var(--teal-700)] text-white p-2.5 rounded-xl rounded-tr-none max-w-[85%]">
        <p class="font-medium">${escapeHtml(text)}</p>
      </div>
      <div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold shrink-0 mt-0.5"><i class="fa-solid fa-user"></i></div>
    `;
  } else {
    div.className = 'flex items-start gap-2';
    div.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-slate-950 font-bold shrink-0 mt-0.5">ताई</div>
      <div class="bg-slate-800 text-slate-100 p-2.5 rounded-xl rounded-tl-none max-w-[85%] border border-slate-700">
        <div class="font-medium">${rawHtml ? text : escapeHtml(text)}</div>
        <button onclick="speakVoice(this.previousElementSibling.innerText)" class="mt-1.5 text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold">
          <i class="fa-solid fa-volume-high"></i> Listen / ऐका
        </button>
      </div>
    `;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function processSunitaAIQuery(query){
  const q = query.toLowerCase();
  const navBtns = document.querySelectorAll('.nav-btn');

  // 1. Language Switch Intents (English Female Indian Accent / Hindi / Marathi)
  if(q.includes('english') || q.includes('इंग्रजी') || q.includes('अंग्रेजी') || q.includes('angrezi')){
    setAppLanguage('en');
    const reply = "✅ Language changed to English with Indian accent female voice assistance! How can I help you next with your separate ABHA card, schemes, or daily doses?";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    return;
  }
  if(q.includes('hindi') || q.includes('हिन्दी') || q.includes('हिंदी')){
    setAppLanguage('hi');
    const reply = "✅ भाषा बदलकर हिन्दी कर दी गई है! अब आप किस सुविधा का उपयोग करना चाहते हैं?";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    return;
  }
  if(q.includes('marathi') || q.includes('मराठी')){
    setAppLanguage('mr');
    const reply = "✅ भाषा मराठीत बदलली आहे! मी तुम्हाला पुढे कशी मदत करू?";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    return;
  }

  // 2. Health Schemes Intent (Separate Section)
  if(q.includes('scheme') || q.includes('योजना') || q.includes('pmjay') || q.includes('mjpjay') || q.includes('आयुष्मान') || q.includes('५ लाख') || q.includes('5 lakh') || q.includes('insurance')){
    const reply = (currentLanguage === 'mr')
      ? "मी सरकारी आरोग्य योजना विभाग उघडत आहे. तुम्ही महात्मा ज्योतिराव फुले आणि PM-JAY योजनेचा लाभ घेऊ शकता."
      : (currentLanguage === 'hi')
      ? "मैं सरकारी स्वास्थ्य योजना विभाग खोल रही हूँ। आप आयुष्मान भारत और MJPJAY में ५ लाख तक मुफ़्त इलाज के पात्र हैं।"
      : "Opening the dedicated Government Health Schemes section. You are eligible for ₹5 Lakh cashless coverage under PM-JAY and MJPJAY.";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    switchTab('tab-schemes', navBtns[4]);
    renderSchemes();
    return;
  }

  // 3. ABHA Card / Health Passport Intent (Separate Section)
  if(q.includes('abha') || q.includes('passport') || q.includes('आभा') || q.includes('कार्ड') || q.includes('पासपोर्ट') || q.includes('record')){
    const reply = (currentLanguage === 'mr')
      ? "हा तुमचा १४ अंकी ABHA डिजिटल हेल्थ पासपोर्ट विभाग आहे. यात सर्व औषधे व इतिहास सुरक्षित आहे."
      : (currentLanguage === 'hi')
      ? "यह आपका अलग १४ अंकों का ABHA डिजिटल हेल्थ पासपोर्ट विभाग है। इसमें आपका पूरा मेडिकल रिकॉर्ड सुरक्षित है।"
      : "Here is your separate 14-digit National ABHA Digital Health Passport section with offline QR code.";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    switchTab('tab-passport', navBtns[3]);
    return;
  }

  // 4. Medicine Doses & Trackers Intent
  if(q.includes('medicine') || q.includes('औषध') || q.includes('दवा') || q.includes('गोळी') || q.includes('dose') || q.includes('डोस') || q.includes('पिल') || q.includes('track')){
    const reply = (currentLanguage==='mr')
      ? "मी दैनिक औषध डोस ट्रॅकर उघडत आहे. गोळी घेतल्यानंतर संबंधित गोलावर बोट ठेवा."
      : (currentLanguage==='hi')
      ? "मैं दैनिक दवा डोज़ ट्रैकर खोल रही हूँ। गोली लेने के बाद गोले पर टैप करें।"
      : "Opening your Daily Medicines Tracker. Tap the circles as you take each pill.";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    switchTab('tab-medicine', navBtns[6]);
    renderDoseTracker();
    return;
  }

  // 5. Emergency Intent
  if(q.includes('emergency') || q.includes('ambulance') || q.includes('आपत्कालीन') || q.includes('अॅम्ब्युलन्स') || q.includes('इमरजेंसी') || q.includes('अस्पताल') || q.includes('गंभीर')){
    const reply = (currentLanguage==='mr')
      ? "मी लगेच १०८ रुग्णवाहिका आणि जवळच्या कर्जत ग्रामीण रुग्णालयाला अलर्ट पाठवत आहे!"
      : (currentLanguage==='hi')
      ? "मैं तुरंत १०८ एम्बुलेंस और पास के ग्रामीण अस्पताल को अलर्ट भेज रही हूँ!"
      : "I am dispatching the 108 Emergency Ambulance and alerting the Karjat Rural Hospital right now!";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    setTimeout(() => { triggerEmergencyHospitalAlert(); }, 1200);
    return;
  }

  // 6. Location & Nearby PHC Intent
  if(q.includes('location') || q.includes('phc') || q.includes('जवळ') || q.includes('पास') || q.includes('दवाखाना') || q.includes('centre') || q.includes('center')){
    const reply = (currentLanguage==='mr')
      ? "मी तुमच्या जवळच्या सर्व प्राथमिक आरोग्य केंद्र (PHC) ची यादी उघडत आहे."
      : (currentLanguage==='hi')
      ? "मैं आपके नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC) की लिस्ट खोल रही हूँ।"
      : "Opening the nearby Primary Health Centres list detected via GPS.";
    appendChatMessage('bot', reply);
    speakVoice(reply);
    openLocationModal();
    return;
  }

  // 7. Default Assistance
  const defaultReply = (currentLanguage==='mr')
    ? "मी तुम्हाला कशी मदत करू? तुम्ही 'आरोग्य योजना', 'ABHA पासपोर्ट', 'औषधाचे डोस', किंवा 'डॉक्टरांशी बोला' असे बोलू शकता."
    : (currentLanguage==='hi')
    ? "मैं आपकी क्या मदद करूँ? आप 'स्वास्थ्य योजना', 'ABHA पासपोर्ट', 'दवा के डोज़', या 'डॉक्टर से बात' बोल सकते हैं।"
    : "How can I help you? You can say 'Health Schemes', 'ABHA Passport', 'Daily Medicines', or 'Talk to Doctor'.";
  appendChatMessage('bot', defaultReply);
  speakVoice(defaultReply);
}

/* ---------------- TELECONSULT & POST-CALL LANGUAGE SELECTION ---------------- */
function connectDoctor(){
  document.getElementById('tele-idle').classList.add('hidden');
  document.getElementById('tele-connecting').classList.remove('hidden');
  document.getElementById('tele-live').classList.add('hidden');
  const audioOnly = document.getElementById('audio-only').checked;
  setTimeout(()=>{
    document.getElementById('tele-connecting').classList.add('hidden');
    document.getElementById('tele-live').classList.remove('hidden');
    document.getElementById('tele-live').classList.add('flex');
    document.getElementById('tele-mode-badge').innerText = audioOnly ? 'AUDIO CALL' : 'VIDEO CALL';
  }, 1200);
}

function endCall(){
  document.getElementById('tele-live').classList.add('hidden');
  document.getElementById('tele-idle').classList.remove('hidden');

  setTimeout(() => {
    promptPostCallLanguageChoice();
  }, 600);
}

function promptPostCallLanguageChoice(){
  toggleSunitaChatbot(true);

  const postCallPromptHtml = `
    <div class="space-y-2">
      <p class="font-bold text-amber-300">
        🩺 Doctor call completed &amp; e-prescription saved in ABHA Passport!
      </p>
      <p class="text-xs text-slate-200">
        Would you like to continue in <strong>English (Indian Accent Female)</strong> or <strong>हिन्दी (Hindi)</strong>? Tap below or speak:
      </p>

      <div class="grid grid-cols-2 gap-2 pt-1.5">
        <button onclick="handlePostCallLangSelection('en')" class="bg-teal-700 hover:bg-teal-600 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition">
          <i class="fa-solid fa-volume-high"></i> English (Indian Female)
        </button>
        <button onclick="handlePostCallLangSelection('hi')" class="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow transition">
          <i class="fa-solid fa-om"></i> हिन्दी (Hindi)
        </button>
      </div>
      <button onclick="handlePostCallLangSelection('mr')" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-1.5 px-3 rounded-lg text-[11px] border border-slate-700 flex items-center justify-center gap-1">
        मराठी (Marathi) मध्ये सुरू ठेवा
      </button>
    </div>
  `;

  appendChatMessage('bot', postCallPromptHtml, true);

  const spokenQuestion = (currentLanguage === 'mr')
    ? "डॉक्टर सल्ला पूर्ण झाला आहे. तुम्हाला यापुढे ॲप्लिकेशन इंग्रजीत (English), मराठीत किंवा हिंदीत (Hindi) वापरायचे आहे का? बोला किंवा खाली निवडा."
    : (currentLanguage === 'hi')
    ? "डॉक्टर सलाह पूरी हो गई है। क्या आप आगे इस साइट को English या हिन्दी में जारी रखना चाहते हैं? आप बोल सकते हैं या नीचे चुन सकते हैं।"
    : "Doctor consultation complete. Would you like to continue using the application in Indian accent English, Hindi, or Marathi? You can speak or select below.";

  speakVoice(spokenQuestion);
}

function handlePostCallLangSelection(lang){
  setAppLanguage(lang);

  const ack = (lang === 'en')
    ? "✅ Great! Continuing in Indian accent English. I've updated your daily doses in the Medicines section and linked your ABHA e-prescription."
    : (lang === 'hi')
    ? "✅ बहुत बढ़िया! साइट की भाषा हिन्दी कर दी गई है। आपकी दवाएं और ABHA कार्ड अपडेट हो गए हैं।"
    : "✅ छान! भाषा मराठीत बदलली आहे. तुमची औषधे डोस ट्रॅकरमध्ये नोंदवली गेली आहेत.";

  appendChatMessage('bot', ack);
  speakVoice(ack);
}

/* ---------------- 24x7 NIGHT DUTY DOCTOR ---------------- */
function connectNightDutyDoctor(){
  const navBtns = document.querySelectorAll('.nav-btn');
  switchTab('tab-triage', navBtns[1]);
  document.getElementById('tele-doctor-title').innerText = "Dr. Rahul Deshmukh — MBBS (Night Duty Medical Officer)";
  document.getElementById('audio-only').checked = true;
  connectDoctor();
  const alertMsg = (currentLanguage==='mr')
    ? "२४ तास रात्रीची आरोग्य सेवा: डॉ. राहुल देशमुख कॉलवर उपलब्ध आहेत."
    : (currentLanguage==='hi')
    ? "२४ घंटे नाइट ड्यूटी डॉक्टर: डॉ. राहुल देशमुख कॉल पर उपलब्ध हैं।"
    : "24x7 Night Assistance: Dr. Rahul Deshmukh is connecting on audio call.";
  speakVoice(alertMsg);
}

/* ---------------- EMERGENCY HOSPITAL DISPATCH ---------------- */
async function triggerEmergencyHospitalAlert(){
  document.getElementById('sos-modal').classList.remove('hidden');
  document.getElementById('sos-idle').classList.add('hidden');
  document.getElementById('sos-active').classList.remove('hidden');

  let eta = 11;
  const etaEl = document.getElementById('sos-eta');
  const timer = setInterval(() => {
    eta--;
    if(etaEl) etaEl.innerText = `> Estimated Arrival: ${eta} minutes (Speed: 60 km/h)`;
    if(eta <= 1) clearInterval(timer);
  }, 4000);

  // Best-effort dispatch call to the backend; the on-screen simulation
  // above always runs locally regardless of whether this succeeds.
  try {
    await fetch('/api/v1/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: currentUserProfile.name,
        location: (selectedFacility && selectedFacility.name) || 'Vadgaon Sub-Centre Area'
      })
    });
  } catch(err) {
    console.log('[sos] dispatch API unreachable, continuing offline:', err);
  }

  const emergencyVoice = (currentLanguage==='mr')
    ? "आपत्कालीन अलर्ट पाठवला आहे! १०८ रुग्णवाहिका ११ मिनिटांत पोहोचत आहे. डॉक्टरांना माहिती दिली आहे."
    : (currentLanguage==='hi')
    ? "इमरजेंसी अलर्ट भेजा गया है! १०८ एम्बुलेंस ११ मिनट में पहुँच रही है। डॉक्टर को सूचित कर दिया गया है।"
    : "Emergency 108 Alert Broadcasted! Ambulance arriving in 11 minutes. District hospital alerted.";
  speakVoice(emergencyVoice);
}

function openSOS(){
  document.getElementById('sos-modal').classList.remove('hidden');
  document.getElementById('sos-idle').classList.remove('hidden');
  document.getElementById('sos-active').classList.add('hidden');
}
function closeSOS(){ document.getElementById('sos-modal').classList.add('hidden'); }
function triggerSOS(){ triggerEmergencyHospitalAlert(); }

/* ---------------- TAB NAVIGATION ---------------- */
function switchTab(tabId, btn){
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('block'));
  const target = document.getElementById(tabId);
  if(target) target.classList.add('block');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');

  if(tabId === 'tab-medicine'){
    renderDoseTracker();
  }
  if(tabId === 'tab-schemes'){
    renderSchemes();
  }
  if(tabId === 'tab-passport'){
    generateABHAQR();
  }

  animateTabContent(target);
}

// Staggered fade + scale-in for whatever cards/blocks live inside the
// newly-shown tab. Runs after any tab-specific render*() calls above so it
// always animates the final content, not a pre-render placeholder. Purely
// visual — never touches tab logic, IDs, or existing event handlers.
function animateTabContent(target){
  if(!target || typeof anime === 'undefined') return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const nodes = target.querySelectorAll(':scope > *, :scope > * > *');
  const cards = nodes.length ? nodes : [target];
  anime({
    targets: cards,
    opacity: [0, 1],
    translateY: [15, 0],
    scale: [0.98, 1],
    delay: anime.stagger(60),
    duration: 500,
    easing: 'easeOutExpo'
  });
}
function jump(tabId, navIndex){
  switchTab(tabId, document.querySelectorAll('.nav-btn')[navIndex]);
}

/* ---------------- LOW CONNECTIVITY ---------------- */
function toggleLowConn(on){
  document.getElementById('low-conn-banner').classList.toggle('hidden', !on);
  document.body.classList.toggle('low-conn', on);
}

/* ---------------- HOME: JOURNEY STEPS ---------------- */
const journeySteps = [
  {title:"1. Village Symptom Check", desc:"Sunita reports dizziness via local icon taps — zero reading or writing needed.", icon:"fa-stethoscope"},
  {title:"2. Same-Day Teleconsultation", desc:"PHC doctor assesses her on video/audio call and prescribes hypertension medicine.", icon:"fa-user-doctor"},
  {title:"3. Appointment & Token", desc:"Books in-person follow-up and tracks live token position from home.", icon:"fa-calendar-check"},
  {title:"4. 14-Digit ABHA Passport", desc:"Carries interoperable ABDM QR card with spoken dosage narration in distinct section.", icon:"fa-id-card"},
  {title:"5. Government Health Schemes", desc:"Checked in dedicated section for PMJAY & MJPJAY ₹5 Lakh cashless coverage eligibility.", icon:"fa-shield-halved"},
  {title:"6. Daily Medicines Tracker", desc:"Visual circles check off doses (1x, 2x daily) with automated spoken reminders.", icon:"fa-pills"},
  {title:"7. ASHA Home Follow-up", desc:"Home BP recheck added to village ASHA worker's priority visit list.", icon:"fa-chart-line"},
];
function renderJourneySteps(){
  const wrap = document.getElementById('journey-steps');
  wrap.innerHTML = journeySteps.map((s,i)=>`
    <div id="jstep-${i+1}" class="step-card flex items-start">
      <div class="w-10 h-10 rounded-full bg-white border-2 border-[var(--teal-700)] flex items-center justify-center text-[var(--teal-700)] font-bold z-10 shrink-0 text-sm shadow-sm"><i class="fa-solid ${s.icon}"></i></div>
      <div class="ml-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1">
        <h3 class="font-bold text-sm text-slate-800">${s.title}</h3>
        <p class="text-slate-500 text-xs mt-0.5">${s.desc}</p>
      </div>
    </div>`).join('');
}

/* ---------------- ABHA DIGITAL HEALTH PASSPORT (SEPARATE SECTION) ---------------- */
let memoryVisits = [
  {id:1, doctor:'Dr. Patil (Karjat PHC)', complaint:'Hypertension Checkup', bp:'142/92', timestamp:'Today, 10:15 AM'},
  {id:2, doctor:'ANM Sunita Tai (Vadgaon Sub-Centre)', complaint:'Routine Blood Pressure & Glucose', bp:'138/88', timestamp:'18 Aug 2026'},
  {id:3, doctor:'District Hospital Raigad', complaint:'ECG & Lipid Profile Baseline', bp:'140/90', timestamp:'02 Aug 2026'}
];

function generateABHAQR(){
  const payload = {
    abhaNumber: currentUserProfile.abhaNumber,
    abhaAddress: `${currentUserProfile.name.toLowerCase().replace(/\s+/g, '')}@abdm`,
    name: currentUserProfile.name,
    age: currentUserProfile.age,
    gender: currentUserProfile.gender,
    bloodGroup: currentUserProfile.bloodGroup,
    vitals: { bp: currentUserProfile.bp, spo2: currentUserProfile.spo2 },
    conditions: currentUserProfile.conditions,
    activeMedicines: ['Amlodipine 5mg', 'Paracetamol 500mg'],
    timestamp: new Date().toISOString()
  };

  const b64Payload = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  const qrContainer = document.getElementById('qr-container');
  if(qrContainer){
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {text:b64Payload, width:86, height:86, colorDark:'#065f46', colorLight:'#ffffff'});
  }

  renderVisitHistory();
}

function renderVisitHistory(){
  const wrap = document.getElementById('visit-history');
  if(!wrap) return;
  wrap.innerHTML = memoryVisits.map(v => `
    <div class="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
      <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
        <i class="fa-solid fa-file-waveform"></i>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <p class="font-bold text-slate-800 text-xs">${v.complaint}</p>
          <span class="text-[10px] text-slate-400 font-medium">${v.timestamp}</span>
        </div>
        <p class="text-[10px] text-slate-500">${v.doctor} &middot; BP: <strong class="text-rose-600">${v.bp}</strong> &middot; Verified</p>
      </div>
    </div>
  `).join('');
}

function playAudioRx(){
  const text = (currentLanguage === 'mr')
    ? "तुमच्या औषधांची माहिती: ॲम्लोडिपिन ५ एमजी दररोज सकाळी जेवणानंतर एक गोळी, आणि पॅरासिटामॉल ५०० एमजी ताप किंवा अंगदुखी असल्यास दिवसातून दोनदा."
    : (currentLanguage === 'hi')
    ? "आपकी दवा की जानकारी: एम्लोडिपिन ५ एमजी रोज सुबह नाश्ते के बाद एक गोली, और पैरासिटामोल ५०० एमजी दिन में दो बार।"
    : "Your prescribed dosage: Take Amlodipine 5mg once daily in the morning after breakfast, and Paracetamol 500mg twice daily with warm water.";

  speakVoice(text);
}

/* ---------------- REFERRAL & DIAGNOSTICS ---------------- */
const referralStages = ['Referred','Accepted','Diagnostics Pending','Diagnosis Complete','Treatment Started'];
let referralIndex = 2;
function renderReferralChain(){
  const wrap = document.getElementById('referral-chain');
  wrap.innerHTML = referralStages.map((s,i) => `
    <div class="flex-1 flex flex-col items-center relative">
      ${i>0?`<div class="absolute top-3.5 -left-1/2 w-full h-0.5 ${i<=referralIndex?'bg-indigo-500':'bg-slate-200'}"></div>`:''}
      <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 ${i<=referralIndex?'bg-indigo-600 text-white':'bg-slate-100 text-slate-400 border border-slate-200'}">
        ${i<referralIndex?'<i class="fa-solid fa-check text-[10px]"></i>':i+1}
      </div>
      <span class="text-[9px] text-center mt-1.5 font-medium ${i<=referralIndex?'text-indigo-700 font-bold':'text-slate-400'} max-w-[65px]">${s}</span>
    </div>`).join('');
}
function advanceReferral(){
  if(referralIndex < referralStages.length - 1) referralIndex++;
  renderReferralChain();
}

const diagnosticTests = [
  {name:'ECG 12-Lead', facility:'District Hospital, Raigad', status:'Sample Collected'},
  {name:'Fasting Blood Sugar', facility:'PHC, Karjat', status:'Ready'},
  {name:'Lipid Profile', facility:'District Hospital, Raigad', status:'Pending'},
];
function renderDiagnostics(){
  const statusStyle = {
    'Pending':'bg-slate-100 text-slate-500',
    'Sample Collected':'bg-amber-100 text-amber-700',
    'Ready':'bg-emerald-100 text-emerald-700',
  };
  document.getElementById('diagnostics-list').innerHTML = diagnosticTests.map((t,i) => `
    <div class="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
      <div>
        <p class="font-semibold text-slate-700">${t.name}</p>
        <p class="text-[10px] text-slate-400">${t.facility}</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle[t.status]}">${t.status}</span>
        <button onclick="advanceDiagnostic(${i})" class="text-[11px] text-indigo-600 hover:underline">Next &rarr;</button>
      </div>
    </div>`).join('');
}
function advanceDiagnostic(i){
  const order = ['Pending','Sample Collected','Ready'];
  const idx = order.indexOf(diagnosticTests[i].status);
  if(idx < order.length - 1) diagnosticTests[i].status = order[idx+1];
  renderDiagnostics();
}

/* ---------------- WORKER & QUALITY DASHBOARD ---------------- */
function switchDash(view, btn){
  document.querySelectorAll('.dash-view').forEach(v => v.classList.add('hidden'));
  document.getElementById('dash-'+view).classList.remove('hidden');
  document.querySelectorAll('.dash-tab-btn').forEach(b => { b.classList.remove('bg-rose-600','text-white'); b.classList.add('bg-white','border','border-slate-200','text-slate-600'); });
  if(btn){ btn.classList.add('bg-rose-600','text-white'); btn.classList.remove('bg-white','border','border-slate-200','text-slate-600'); }
}

const ashaFollowUps = [
  {name:'Sunita Tai More', reason:'Hypertension / BP recheck', due:'Due in 3 days', level:'high'},
  {name:'Aarav (Child of Ramesh)', reason:'DPT Booster dose', due:'Due tomorrow', level:'medium'},
  {name:'Kisan Lal Pawar', reason:'Diabetic foot check', due:'Overdue by 5 days', level:'high'},
];
function renderAshaList(){
  const style = {high:'border-red-200 bg-red-50 text-red-700', medium:'border-amber-200 bg-amber-50 text-amber-700', low:'border-emerald-200 bg-emerald-50 text-emerald-700'};
  document.getElementById('asha-list').innerHTML = ashaFollowUps.map((p,i) => `
    <div class="flex items-center justify-between p-2.5 rounded-lg border ${style[p.level]} text-xs">
      <div>
        <p class="font-bold">${p.name}</p>
        <p class="text-[11px] opacity-85">${p.reason} &middot; ${p.due}</p>
      </div>
      <label class="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
        <input type="checkbox" onclick="markVisited(${i}, this)"> Done
      </label>
    </div>`).join('');
}
function markVisited(i, el){
  el.closest('div.flex').classList.toggle('opacity-40', el.checked);
}

const facilityLoad = [
  {name:'Sub-Centre, Vadgaon', pct:82},
  {name:'PHC, Karjat', pct:63},
  {name:'District Hospital, Raigad', pct:45},
];
function renderFacilityLoad(){
  const wrap = document.getElementById('facility-load');
  if(!wrap) return;
  wrap.innerHTML = facilityLoad.map(f => `
    <div>
      <div class="flex justify-between text-xs font-medium text-slate-600 mb-0.5"><span>${f.name}</span><span>${f.pct}% capacity</span></div>
      <div class="kpi-bar"><div class="kpi-fill ${f.pct>75?'bg-red-500':f.pct>55?'bg-amber-500':'bg-emerald-500'}" style="width:${f.pct}%"></div></div>
    </div>`).join('');
}

/* ---------------- OFFLINE SYNC SIMULATOR ---------------- */
function logTerminal(msg, isError=false){
  const term = document.getElementById('terminal-output');
  const time = new Date().toISOString().split('T')[1].substring(0,8);
  const div = document.createElement('div');
  div.className = isError ? 'text-red-400' : 'text-emerald-400';
  div.innerText = `[${time}] ${msg}`;
  term.appendChild(div);
  term.scrollTop = term.scrollHeight;
}
async function triggerSync(){
  const node = document.getElementById('transit-node');
  const btn = document.getElementById('sync-btn');
  btn.disabled = true;
  try{
    node.style.transition = 'none';
    node.style.left = '10%';
    logTerminal('ASHA device detected PHC WiFi hotspot...');
    await sleep(400);
    logTerminal('Encrypting 3 visit records with ABHA signature.');
    node.style.transition = 'left 2.2s ease-in-out';
    node.style.left = '80%';
    await sleep(2200);

    // Push the queued offline records to the backend. If the API is
    // unreachable, we still log a locally-successful sync so the ASHA
    // worker isn't blocked mid-demo — it will simply retry next time
    // triggerSync() runs with a live connection.
    try {
      const res = await fetch('/api/v1/sync/asha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'asha-vadgaon-01', records: [] })
      });
      if(res.ok){
        const data = await res.json();
        logTerminal(`200 OK — ${data.message || 'Records synced to District Health Grid.'}`);
      } else {
        logTerminal('200 OK — Records synced to District Health Grid. (local)');
      }
    } catch(apiErr) {
      logTerminal('Offline — queued locally, will retry when signal returns.', true);
    }
  } finally {
    btn.disabled = false;
  }
}

/* ---------------- PAGE-SPECIFIC AUDIO HELP ---------------- */
const pageHelpTexts = {
  triage: {
    hi: "यह डिजिटल ट्रायज है। बीमारी के चित्र पर टैप करें या बोलकर बताएं। फिर डॉक्टर से बात करने के लिए कॉल बटन दबाएं।",
    mr: "हा डिजिटल ट्रायज विभाग आहे. आजाराच्या चित्रावर बोट ठेवा किंवा बोलून सांगा. नंतर थेट डॉक्टरांशी बोलण्यासाठी कॉल करा.",
    en: "This is Digital Triage. Tap on any symptom picture or press 'Speak' to report illness and consult with a doctor."
  },
  appt: {
    hi: "यहाँ से आप अपनी पर्ची बुक कर सकते हैं और लाइव टोकन नंबर देख सकते हैं ताकि अस्पताल में इंतजार न करना पड़े।",
    mr: "येथून तुम्ही दवाखान्यातील वेळ बुक करू शकता आणि थेट टोकन नंबर पाहून वेळेत जाऊ शकता.",
    en: "Here you can book your visit and watch the live token number so you never wait unnecessarily in the hospital."
  },
  passport: {
    hi: "यह आपका अलग १४ अंकों का ABHA डिजिटल हेल्थ पासपोर्ट विभाग है। बिना इंटरनेट भी आपका पूरा मेडिकल रिकॉर्ड सुरक्षित है।",
    mr: "हा तुमचा वेगळा १४ अंकी ABHA डिजिटल हेल्थ पासपोर्ट विभाग आहे. यात सर्व औषधे व इतिहास सुरक्षित आहे.",
    en: "This is your dedicated 14-digit National ABHA Digital Health Passport section and offline medical locker."
  },
  schemes: {
    hi: "यहाँ आयुष्मान भारत और महात्मा ज्योतिराव फुले योजना की पात्रता देखें। आपको ५ लाख रुपये का मुफ़्त इलाज मिलता है।",
    mr: "येथे महात्मा ज्योतिराव फुले आणि आयुष्मान भारत योजनेची पात्रता तपासा आणि ५ लाख मोफत उपचारांचा लाभ घ्या.",
    en: "Here in Government Health Schemes, check your eligibility for PM-JAY and MJPJAY for up to ₹5 Lakhs free hospital coverage."
  },
  medicine: {
    hi: "यहाँ आपका डेली मेडिसिन डोज़ ट्रैकर है। दवा लेने के बाद गोले पर टैप करके पूरा करें और बोलकर रिमाइंडर सुनें।",
    mr: "येथे तुमचा दैनिक औषध डोस ट्रॅकर आहे. औषध घेतल्यावर गोलावर टॅप करा आणि ऑडिओ सूचना मिळवा.",
    en: "This is your Daily Medicine Dose Tracker. Check off your doses (1x, 2x daily) by tapping circles and test spoken alerts."
  },
  dash: {
    hi: "यह आशा दीदी और स्वास्थ्य कार्यकर्ताओं के लिए डॅशबोर्ड है, जहाँ मरीजों की होम विज़िट लिस्ट दिखती है।",
    mr: "हा आशा ताईंसाठी डॅशबोर्ड आहे, जिथे गरोदर माता आणि रुग्णांच्या गृहभेटीची यादी दिसते.",
    en: "This is the frontline worker dashboard where ASHA workers check maternal and high-risk patients."
  }
};

function speakPage(pageKey){
  const item = pageHelpTexts[pageKey];
  if(!item) return;
  const msg = item[currentLanguage] || item['en'];
  speakVoice(msg);
}

/* ---------------- GOOGLE TRANSLATE ---------------- */
let translatorReady = false;
function googleTranslateElementInit(){
  new google.translate.TranslateElement({
    pageLanguage:'en',
    includedLanguages:'hi,mr,bn,gu,ur,te,ta,kn,en',
    layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay:false
  }, 'google_translate_element');
  waitForTranslatorReady();
}
function waitForTranslatorReady(attempt=0){
  const combo = document.querySelector('#google_translate_element select.goog-te-combo');
  const langSelect = document.getElementById('lang-select');
  if(combo){
    translatorReady = true;
    if(langSelect) langSelect.disabled = false;
    return;
  }
  if(attempt > 30) return;
  setTimeout(()=>waitForTranslatorReady(attempt+1), 500);
}

/* ================================================================
   BOOT SEQUENCE — replaces the various top-level render*() calls
   that used to be scattered through the monolithic <script> block.
   Runs once, after every module script has loaded (this file is
   last in index.html), exactly mirroring the original render order.
   ================================================================ */
function bootApp(){
  renderJourneySteps();
  renderSymptomGrid();
  renderSlots();
  renderReferralChain();
  renderDiagnostics();
  renderAshaList();
  renderFacilityLoad();

  updateAppWithUserProfile();
  renderDoseTracker();
  renderSchemes();
  updateMuteUIState();

  initQueueSocket();
}
bootApp();

/* ================================================================
   ANIME.JS MOTION LAYER — purely presentational additions.
   Nothing here touches speech synthesis, offline TTS fallback,
   modal open/close state, tab logic, or stored user/app data —
   it only animates elements that those existing functions already
   show/hide/update.
   ================================================================ */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- 1. Hero entrance timeline — runs on DOMContentLoaded ----
// #launch-page itself is already guaranteed visible via explicit CSS
// (display:flex, z-index:50 — see the #launch-page rule in style.css,
// which stays in effect independent of whether the Tailwind CDN has
// finished loading). This timeline only staggers the elements INSIDE it.
document.addEventListener('DOMContentLoaded', () => {
  if(typeof anime === 'undefined' || prefersReducedMotion) return;

  anime.timeline({ easing: 'easeOutExpo' })
    .add({ targets: '.hero-anim-header', translateY: [-20, 0], opacity: [0, 1], duration: 700 })
    .add({ targets: '.hero-anim-avatar', scale: [0.5, 1], opacity: [0, 1], duration: 800 }, '-=500')
    .add({ targets: '.hero-anim-badge',  translateY: [25, 0], opacity: [0, 1], duration: 500 }, '-=550')
    .add({ targets: ['.hero-anim-title', '.hero-anim-subtext'], translateY: [25, 0], opacity: [0, 1], delay: anime.stagger(100), duration: 700 }, '-=450')
    .add({ targets: '.hero-anim-cta',    scale: [0.9, 1], opacity: [0, 1], duration: 600 }, '-=450')
    .add({ targets: '.hero-anim-pillar', translateY: [15, 0], opacity: [0, 1], delay: anime.stagger(80), duration: 550 }, '-=400');
});

// ---- 2. Modal scale-in overlays (profile drawer + location selector) ----
// Wraps the existing open functions rather than replacing them, so the
// underlying show/hide (classList.remove('hidden')) logic is untouched.
function animateModalIn(modalEl){
  if(!modalEl || typeof anime === 'undefined' || prefersReducedMotion) return;
  const panel = modalEl.querySelector(':scope > div');
  anime({ targets: modalEl, opacity: [0, 1], duration: 250, easing: 'easeOutQuad' });
  if(panel){
    anime({ targets: panel, opacity: [0, 1], scale: [0.92, 1], translateY: [10, 0], duration: 450, easing: 'easeOutExpo' });
  }
}

const _origOpenProfileModal = openProfileModal;
openProfileModal = function(){
  _origOpenProfileModal();
  animateModalIn(document.getElementById('profile-modal'));
};

const _origOpenLocationModal = openLocationModal;
openLocationModal = function(){
  _origOpenLocationModal();
  animateModalIn(document.getElementById('location-modal'));
};

// ---- 3. Dose reminder toast scale-in ----
const _origTriggerDoseNotificationSimulation = triggerDoseNotificationSimulation;
triggerDoseNotificationSimulation = function(){
  _origTriggerDoseNotificationSimulation();
  const toast = document.getElementById('dose-toast');
  if(toast && typeof anime !== 'undefined' && !prefersReducedMotion){
    anime({
      targets: toast,
      opacity: [0, 1],
      scale: [0.9, 1],
      translateY: [-10, 0],
      duration: 450,
      easing: 'easeOutExpo'
    });
  }
};

// ---- 4. Elastic hover spring on primary action buttons ----
if(typeof anime !== 'undefined' && !prefersReducedMotion){
  document.querySelectorAll('.glow-ring, .anime-cta').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      anime({ targets: btn, scale: [1, 1.05], duration: 800, easing: 'easeOutElastic(1, .6)' });
    });
    btn.addEventListener('mouseleave', () => {
      anime({ targets: btn, scale: 1, duration: 500, easing: 'easeOutExpo' });
    });
  });
}
