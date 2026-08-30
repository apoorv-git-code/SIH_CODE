# Gram Arogya Connect — SIH 2026 · PS #26133

Rural healthcare companion app (village patients, ASHA workers, PHC doctors).
This repo is split into a static/modular **frontend** (`public/`) and a small
**Node.js + Express + Socket.io** backend (`src/`) that the frontend talks to
over `/api/v1/*` and a websocket channel for the live token queue.

The app is **offline-first**: every backend call is wrapped in try/catch on
the client, and if the API is unreachable (or "Low-Conn" mode is toggled on)
the UI keeps working from local/in-memory state exactly as before — nothing
requires the backend to be running for the demo to work.

## Folder structure

```
├── public/                 # Static frontend, served by Express
│   ├── index.html
│   ├── css/style.css
│   └── js/
│       ├── audio-engine.js   # Speech synthesis + Web Audio chime engine
│       ├── triage.js         # Symptom picker + triage rules + voice input
│       ├── dose-tracker.js   # Medicine dose circles + reminder toast
│       ├── queue.js          # Appointment booking + live queue (Socket.io)
│       ├── sunita-tour.js    # Sunita Tai guided auto-tour + language switch
│       └── app.js            # Tab nav, modals, profile/ABHA/schemes, boot
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── queueController.js
│   │   ├── syncController.js
│   │   └── sosController.js
│   ├── routes/api.js
│   └── server.js
├── package.json
└── README.md
```

## Quick start

```bash
npm install
cp .env.example .env
npm run dev        # nodemon, auto-restart
# or
npm start
```

Then open **http://localhost:4000** in a browser (Chrome recommended, for
the Web Speech API voice features).

## API (all under `/api/v1`)

| Method | Endpoint            | Purpose                                          |
|--------|----------------------|---------------------------------------------------|
| GET    | `/profile`           | Fetch the current mock patient profile / ABHA card |
| POST   | `/profile`           | Save profile & vitals updates                     |
| GET    | `/queue`             | Current live token queue snapshot                 |
| POST   | `/appointments`      | Book a slot, generates a token, starts live countdown via Socket.io |
| POST   | `/sos`               | Trigger a mock 108 ambulance dispatch             |
| POST   | `/sync/asha`         | Push a batch of offline ASHA visit records        |

All identity-like fields (ABHA number, Aadhaar/ration ID, scheme card
numbers) returned by the backend are **masked mock placeholders** — this
service never stores or validates real government IDs. Aadhaar/Ration-card
OCR scanning (Tesseract.js) happens **entirely client-side** in the browser
and never leaves the device.

## Real-time queue

`src/server.js` runs a small in-memory interval that advances the "now
serving" token and decrements the estimated wait, broadcasting a
`queue:update` Socket.io event to every connected client. `public/js/queue.js`
listens for this event and updates the Live Queue Tracker card without a
page refresh. Booking an appointment (`bookAppointment()`) also emits an
`appointment:book` event so multiple devices in the same sub-centre stay in
sync.
