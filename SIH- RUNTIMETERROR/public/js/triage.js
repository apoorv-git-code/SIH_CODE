/* ============================================================
   triage.js
   Digital Triage & Teleconsultation tab: symptom chips, the rule-based
   triage engine, and speech-to-text symptom capture.
   ============================================================ */

const symptoms = [
  {id:'fever', label:'Fever (ताप)', icon:'fa-thermometer-full'},
  {id:'cough', label:'Cough (खोकला)', icon:'fa-head-side-cough'},
  {id:'bodypain', label:'Pain (अंगदुखी)', icon:'fa-bone'},
  {id:'pregnancy', label:'Pregnancy (गरोदर)', icon:'fa-baby-carriage'},
  {id:'childillness', label:'Child (बाळ आजारी)', icon:'fa-child'},
  {id:'injury', label:'Injury (जखम)', icon:'fa-hand-holding-medical'},
  {id:'chronic', label:'BP / Sugar', icon:'fa-heart-pulse'},
  {id:'other', label:'Other (इतर)', icon:'fa-comment-medical'},
];
let selectedSymptoms = new Set();
let voiceText = '';

function renderSymptomGrid(){
  const grid = document.getElementById('symptom-grid');
  if(!grid) return;
  grid.innerHTML = symptoms.map(s => `
    <button type="button" data-id="${s.id}" onclick="toggleSymptom('${s.id}', this)" class="chip big-tap rounded-xl flex flex-col items-center justify-center gap-1 py-2 text-xs font-semibold text-slate-700 bg-white">
      <i class="fa-solid ${s.icon} text-base text-[var(--teal-700)]"></i> ${s.label}
    </button>`).join('');
}

function toggleSymptom(id, el){
  if(selectedSymptoms.has(id)){ selectedSymptoms.delete(id); el.classList.remove('selected'); }
  else { selectedSymptoms.add(id); el.classList.add('selected'); }
}

const triageRules = [
  {match:['injury','bodypain'], keywords:['injur','accident','fall','wound','bleed','जखम','चोट'], urgency:'priority', action:'Visit the Sub-Centre today for wound dressing.'},
  {match:['chronic'], keywords:['bp','sugar','pressure','diabet','giddiness','dizz','चक्कर','hypertension'], urgency:'priority', action:'Book a same-day teleconsultation to review your BP/sugar reading.'},
  {match:['pregnancy'], keywords:['pregnan','baby','labour','labor','गरोदर'], urgency:'priority', action:'Connect to an ANC-trained provider now for maternal checkup.'},
  {match:['childillness'], keywords:['child','baby','infant','fever','बाळ'], urgency:'emergency', action:'Escalate to Medical Officer immediately — infants require urgent evaluation.'},
  {match:['fever','cough'], keywords:['fever','cough','cold','breath','ताप','खोकला'], urgency:'routine', action:'A routine teleconsultation is sufficient — rest at home and drink fluids.'},
];

function runTriage(){
  const resultBox = document.getElementById('triage-result');
  if(!resultBox) return;
  let urgency = 'routine', action = 'A routine teleconsultation is recommended.';
  for(const rule of triageRules){
    const symptomHit = rule.match.some(m => selectedSymptoms.has(m));
    const textHit = rule.keywords.some(k => voiceText.toLowerCase().includes(k));
    if(symptomHit || textHit){ urgency = rule.urgency; action = rule.action; break; }
  }
  if(selectedSymptoms.size === 0 && !voiceText){ urgency = 'routine'; action = 'Select a symptom above or speak to get advice.'; }

  const styles = {
    routine: {bg:'bg-emerald-50', border:'border-emerald-200', text:'text-emerald-700', label:'Routine · Routine Care'},
    priority:{bg:'bg-amber-50', border:'border-amber-200', text:'text-amber-700', label:'Priority · Consult Today'},
    emergency:{bg:'bg-red-50', border:'border-red-200', text:'text-red-700', label:'Emergency · Escalate Now'},
  };
  const st = styles[urgency];
  resultBox.className = `mt-4 ${st.bg} border ${st.border} rounded-xl p-3.5`;
  resultBox.innerHTML = `
    <p class="text-[11px] font-bold uppercase tracking-wider ${st.text} mb-0.5">${st.label}</p>
    <p class="text-xs text-slate-700">${action}</p>`;
  resultBox.classList.remove('hidden');

  if(urgency === 'emergency'){ triggerEmergencyHospitalAlert(); }
}

function startVoiceRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const caption = document.getElementById('voice-caption');
  if(!SpeechRecognition){ caption.innerText = 'Voice input not supported in this browser.'; return; }
  const recognition = new SpeechRecognition();
  recognition.lang = (currentLanguage === 'mr') ? 'mr-IN' : (currentLanguage === 'hi') ? 'hi-IN' : 'en-IN';
  recognition.interimResults = false;
  recognition.onstart = () => caption.innerText = 'Listening… (ऐकत आहे / सुन रहे हैं / Speak now)';
  recognition.onresult = (e) => { voiceText = e.results[0][0].transcript; caption.innerText = `"${voiceText}"`; runTriage(); };
  recognition.onerror = () => caption.innerText = 'Could not hear clearly — tap to try again.';
  recognition.start();
}