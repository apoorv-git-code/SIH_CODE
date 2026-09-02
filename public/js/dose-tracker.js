/* ============================================================
   dose-tracker.js
   Daily Medicines & Dose Tracker tab: interactive dose circles,
   add-medicine modal, and the floating dose-reminder toast.
   Purely local/offline state — no server round-trip is required for
   a village worker ticking off doses with a weak or absent signal.
   ============================================================ */

let prescribedMedicines = [
  {
    id: 'med-1',
    name: 'Amlodipine 5mg (BP)',
    condition: 'Hypertension Control',
    frequency: 1, // 1 time a day (1 circle)
    timingLabels: ['Morning 8:00 AM (सकाळ)'],
    mealInstruction: 'After breakfast with water',
    duration: '30 Days Course',
    dosesTaken: [true], // index 0 completed
    color: 'amber'
  },
  {
    id: 'med-2',
    name: 'Paracetamol 500mg',
    condition: 'Fever & Body Pain',
    frequency: 2, // 2 times a day (2 circles)
    timingLabels: ['Morning 8:00 AM (सकाळ)', 'Night 8:00 PM (रात्र)'],
    mealInstruction: 'After meals',
    duration: '5 Days Course',
    dosesTaken: [true, false], // morning taken, night pending
    color: 'teal'
  },
  {
    id: 'med-3',
    name: 'Iron & Folic Acid Tablet',
    condition: 'Anemia & Vitality',
    frequency: 1, // 1 circle
    timingLabels: ['Afternoon 1:00 PM (दुपार)'],
    mealInstruction: 'Do not take with tea/milk',
    duration: '60 Days Course',
    dosesTaken: [false], // pending
    color: 'rose'
  },
  {
    id: 'med-4',
    name: 'ORS Electrolyte Solution',
    condition: 'Hydration Recovery',
    frequency: 2, // 2 circles
    timingLabels: ['Morning 10:00 AM', 'Evening 4:00 PM'],
    mealInstruction: 'Mix 1 sachet in 1 Litre clean water',
    duration: '3 Days Course',
    dosesTaken: [false, false],
    color: 'blue'
  }
];

function renderDoseTracker(){
  const list = document.getElementById('prescribed-medicines-list');
  if(!list) return;

  let totalDoses = 0;
  let takenDoses = 0;

  list.innerHTML = prescribedMedicines.map(med => {
    totalDoses += med.frequency;
    const completedCount = med.dosesTaken.filter(Boolean).length;
    takenDoses += completedCount;
    const isAllDone = (completedCount === med.frequency);

    return `
      <div class="bg-white rounded-2xl border ${isAllDone ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200'} p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md">

        <div>
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${med.condition}</span>
              <h4 class="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span>${med.name}</span>
                ${isAllDone ? '<span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full"><i class="fa-solid fa-check mr-0.5"></i>Done</span>' : ''}
              </h4>
            </div>
            <span class="text-[11px] font-bold px-2.5 py-1 rounded-lg ${isAllDone ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}">
              ${med.frequency}x Daily (${med.frequency} ${med.frequency===1?'Dose':'Doses'})
            </span>
          </div>

          <p class="text-xs text-slate-500 mb-3"><i class="fa-solid fa-utensils text-slate-400 mr-1"></i>${med.mealInstruction} &middot; <span class="text-slate-400">${med.duration}</span></p>
        </div>

        <!-- DOSE CIRCLES CONTAINER -->
        <div class="border-t border-slate-100 pt-3">
          <div class="text-[11px] font-semibold text-slate-700 mb-2 flex items-center justify-between">
            <span>Daily Dose Check-off:</span>
            <span class="text-slate-400 text-[10px]">Tap circle when taken</span>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            ${Array.from({ length: med.frequency }).map((_, idx) => {
              const isTaken = med.dosesTaken[idx] === true;
              const timingLabel = med.timingLabels[idx] || `Dose #${idx + 1}`;
              return `
                <div class="flex items-center gap-2">
                  <div onclick="toggleDoseCompletion('${med.id}', ${idx})"
                       data-med-id="${med.id}" data-dose-idx="${idx}"
                       class="dose-circle w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isTaken ? 'taken' : 'pending'}"
                       title="${timingLabel}">
                    ${isTaken ? '<i class="fa-solid fa-check"></i>' : (idx + 1)}
                  </div>
                  <div class="text-[10px] leading-tight">
                    <div class="font-semibold ${isTaken ? 'text-emerald-700' : 'text-slate-700'}">${timingLabel.split('(')[0]}</div>
                    <div class="${isTaken ? 'text-emerald-600 font-bold' : 'text-slate-400'}">${isTaken ? '✓ Taken' : 'Pending'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }).join('');

  // Update progress bar
  const pct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
  const pBar = document.getElementById('dose-progress-bar');
  const pBadge = document.getElementById('dose-progress-badge');
  const pSummary = document.getElementById('dose-status-summary');

  if(pBar) pBar.style.width = `${pct}%`;
  if(pBadge) pBadge.innerText = `${takenDoses} / ${totalDoses} Doses (${pct}%)`;

  const remaining = totalDoses - takenDoses;
  if(pSummary){
    if(remaining === 0){
      pSummary.innerHTML = '<span class="text-emerald-300 font-bold">🎉 All daily doses completed! Great health!</span>';
    } else {
      pSummary.innerText = `${remaining} dose${remaining>1?'s':''} remaining today`;
    }
  }
}

function toggleDoseCompletion(medId, doseIndex){
  const med = prescribedMedicines.find(m => m.id === medId);
  if(!med) return;

  const newState = !med.dosesTaken[doseIndex];
  med.dosesTaken[doseIndex] = newState;

  renderDoseTracker();
  bounceDoseCircle(medId, doseIndex);

  if(newState){
    const timing = med.timingLabels[doseIndex] || `Dose #${doseIndex+1}`;
    const msg = (currentLanguage === 'mr')
      ? `${med.name} चे ${timing} औषध पूर्ण झाले.`
      : (currentLanguage === 'hi')
      ? `${med.name} की ${timing} खुराक पूरी हो गई।`
      : `${med.name} ${timing} marked as taken.`;
    speakVoice(msg);
  }
}

// Spring bounce micro-interaction on the tapped dose circle. Runs after
// renderDoseTracker() has already redrawn it in its new taken/pending
// state, so the checkmark (or number) shown mid-bounce is always correct.
function bounceDoseCircle(medId, doseIndex){
  if(typeof anime === 'undefined') return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const el = document.querySelector(`[data-med-id="${medId}"][data-dose-idx="${doseIndex}"]`);
  if(!el) return;
  anime({
    targets: el,
    scale: [1, 1.35, 1],
    rotate: [0, 15, -15, 0],
    easing: 'easeInOutBack',
    duration: 500
  });
}

function resetDailyDoses(){
  prescribedMedicines.forEach(m => {
    m.dosesTaken = m.dosesTaken.map(() => false);
  });
  renderDoseTracker();
  speakVoice((currentLanguage==='hi')?"सभी खुराक रीसेट कर दी गई हैं।":(currentLanguage==='mr')?"सर्व डोस रीसेट केले गेले आहेत.":"All daily doses have been reset.");
}

function openAddMedicineModal(){ document.getElementById('add-med-modal').classList.remove('hidden'); }
function closeAddMedicineModal(){ document.getElementById('add-med-modal').classList.add('hidden'); }

function saveNewPrescribedMedicine(){
  const name = document.getElementById('new-med-name').value.trim();
  const freq = parseInt(document.getElementById('new-med-freq').value, 10) || 1;
  const timing = document.getElementById('new-med-timing').value;
  const duration = document.getElementById('new-med-duration').value.trim() || '14 Days';

  if(!name){
    alert('Please enter a medicine name');
    return;
  }

  const timingMap = {
    1: ['Morning 8:00 AM'],
    2: ['Morning 8:00 AM', 'Night 8:00 PM'],
    3: ['Morning 8:00 AM', 'Afternoon 1:00 PM', 'Night 8:00 PM'],
    4: ['8:00 AM', '1:00 PM', '5:00 PM', '9:00 PM']
  };

  const newMed = {
    id: `med-${Date.now()}`,
    name: name,
    condition: 'Prescribed Care',
    frequency: freq,
    timingLabels: timingMap[freq] || ['Dose 1'],
    mealInstruction: timing,
    duration: duration,
    dosesTaken: Array(freq).fill(false),
    color: 'teal'
  };

  prescribedMedicines.unshift(newMed);
  renderDoseTracker();
  closeAddMedicineModal();

  const ack = (currentLanguage==='hi') ? `${name} ट्रैकर में जोड़ दिया गया है।` : (currentLanguage==='mr') ? `${name} ट्रॅकरमध्ये जोडले गेले आहे.` : `${name} added to your daily dose tracker.`;
  speakVoice(ack);
}

/* ---------------- DOSE NOTIFICATION & REMINDER TOAST ---------------- */
function triggerDoseNotificationSimulation(){
  const toast = document.getElementById('dose-toast');
  toast.classList.remove('hidden');

  const pendingMed = prescribedMedicines.find(m => m.dosesTaken.some(d => !d)) || prescribedMedicines[0];
  document.getElementById('toast-med-name').innerText = `Time for ${pendingMed.name}!`;
  document.getElementById('toast-med-sub').innerText = `${pendingMed.mealInstruction} &middot; ${pendingMed.duration}`;

  const reminderVoice = (currentLanguage === 'mr')
    ? `औषधाची वेळ झाली आहे! कृपया ${pendingMed.name} चा डोस पाण्यासोबत घ्या.`
    : (currentLanguage === 'hi')
    ? `दवा का समय हो गया है! कृपया ${pendingMed.name} की खुराक लें।`
    : `Medicine reminder! Time to take your prescribed dose of ${pendingMed.name}.`;

  speakVoice(reminderVoice);

  setTimeout(() => { dismissDoseToast(); }, 12000);
}

function dismissDoseToast(){
  document.getElementById('dose-toast').classList.add('hidden');
}

function markDoseFromToast(){
  const pendingMed = prescribedMedicines.find(m => m.dosesTaken.some(d => !d));
  if(pendingMed){
    const idx = pendingMed.dosesTaken.findIndex(d => !d);
    if(idx !== -1) toggleDoseCompletion(pendingMed.id, idx);
  }
  dismissDoseToast();
}
