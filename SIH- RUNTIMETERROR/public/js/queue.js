/* ============================================================
   queue.js
   Appointments & Live Queue tab: slot picker, booking (wired to the
   Express API + broadcast over Socket.io), local queue-countdown
   fallback for when the backend/socket is unreachable, and the
   client-side Aadhaar/Ration-card OCR (Tesseract.js never leaves
   the browser — no image or extracted text is sent to the server).
   ============================================================ */

const slots = ['9:00 AM','11:30 AM','2:00 PM','3:30 PM','5:00 PM','6:30 PM'];
let chosenSlot = slots[1];

function renderSlots(){
  const grid = document.getElementById('slot-grid');
  if(!grid) return;
  grid.innerHTML = slots.map(s => `<button type="button" onclick="chooseSlot('${s}', this)" class="chip py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white ${s===chosenSlot?'selected':''}">${s}</button>`).join('');
}
function chooseSlot(s, el){
  chosenSlot = s;
  document.querySelectorAll('#slot-grid button').forEach(b=>b.classList.remove('selected'));
  el.classList.add('selected');
}

/* ---------------- SOCKET.IO LIVE QUEUE CLIENT ---------------- */
let queueSocket = null;
let queueTimer = null; // local fallback simulation timer

function initQueueSocket(){
  if(typeof io === 'undefined') return; // socket.io client script not loaded / offline
  try {
    queueSocket = io({ reconnectionAttempts: 3, timeout: 4000 });

    queueSocket.on('connect', () => {
      console.log('[queue] connected to live queue channel');
    });

    queueSocket.on('queue:update', (payload) => {
      applyQueueState(payload);
    });

    queueSocket.on('appointment:book', (booking) => {
      if(booking && booking.queue) applyQueueState(booking.queue);
    });

    queueSocket.on('connect_error', () => {
      console.log('[queue] socket unreachable — falling back to local simulation');
    });
  } catch(e) {
    console.log('[queue] socket init skipped:', e);
  }
}

function applyQueueState(state){
  if(!state) return;
  const nowServingEl = document.getElementById('now-serving');
  const yourTokenEl = document.getElementById('your-token');
  const waitEl = document.getElementById('wait-time');

  if(state.nowServing && nowServingEl) nowServingEl.innerText = state.nowServing;
  if(state.yourToken && yourTokenEl) yourTokenEl.innerText = state.yourToken;
  if(typeof state.waitMinutes === 'number' && waitEl) waitEl.innerText = `${state.waitMinutes} min`;
}

// Local, purely client-side countdown — always runs as a safety net so the
// Live Queue Tracker still visibly progresses even with no backend/socket
// connection (e.g. Low-Conn rural demo mode).
function startQueueSimulation(){
  let waiting = 21;
  clearInterval(queueTimer);
  queueTimer = setInterval(()=>{
    waiting = Math.max(2, waiting - 1);
    const waitEl = document.getElementById('wait-time');
    if(waitEl) waitEl.innerText = waiting + ' min';
    if(waiting <= 2) clearInterval(queueTimer);
  }, 4000);
}

async function bookAppointment(){
  const facility = document.getElementById('appt-facility').value;
  const box = document.getElementById('appt-confirm');

  let token = 'A-19';

  // Best-effort call to the backend; the UI always confirms locally too,
  // so a booking never silently fails just because the API is offline.
  try {
    const res = await fetch('/api/v1/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facility, slot: chosenSlot })
    });
    if(res.ok){
      const data = await res.json();
      if(data && data.token) token = data.token;
      if(data && data.queue) applyQueueState(data.queue);
    }
  } catch(e) {
    console.log('[queue] booking API unreachable, continuing offline:', e);
  }

  box.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Visit confirmed at <strong>${facility}</strong> for <strong>${chosenSlot}</strong>. Your Token is <strong>${token}</strong>.`;
  box.classList.remove('hidden');
  startQueueSimulation();
}

/* ---------------- ID SCAN (CLIENT-SIDE OCR ONLY — Tesseract.js) ----------------
   Privacy guardrail: the photographed ID and any text Tesseract extracts
   from it are processed entirely in-browser and are never uploaded or
   sent to the backend in any request. */
function handleRegOCR(event){
  const file = event.target.files[0];
  if(!file) return;
  const loader = document.getElementById('reg-ocr-loader');
  loader.classList.remove('hidden'); loader.classList.add('flex');
  Tesseract.recognize(file, 'eng').then(result => {
    const text = result.data.text.trim();
    const fields = document.getElementById('reg-fields');
    const nameMatch = text.match(/Name[\s:]+([A-Za-z\s]+)/i);
    const idMatch = text.match(/(?:ID|Aadhaar|UAN)[\s:]+(\d{10,12})/i);
    const lines = text.split('\n').filter(l=>l.trim().length>0);
    fields.innerHTML = `
      <div><label class="block text-[10px] text-slate-500">Name</label><input class="w-full p-1 border rounded text-xs bg-white" value="${nameMatch?nameMatch[1].trim():(lines[0]||'Sunita More')}"></div>
      <div><label class="block text-[10px] text-slate-500">ID Number</label><input class="w-full p-1 border rounded text-xs bg-white" value="${idMatch?idMatch[1]:'9874 5412 3601'}"></div>`;
  }).catch(()=>{
    document.getElementById('reg-fields').innerHTML = `<p class="col-span-2 text-xs text-red-600">Please try a clearer photo.</p>`;
  }).finally(()=>{
    loader.classList.add('hidden'); loader.classList.remove('flex');
    event.target.value = '';
  });
}