# MUSTMILJON KÜSIMUST site

## Files
- `index.html` = landing page with 30 topics and A1/A2 buttons
- `pages/topic-XX-a1.html` and `pages/topic-XX-a2.html` = lesson pages
- `assets/style.css` = shared styling
- `assets/theme.js` = dark/light mode
- `assets/player.js` = hover audio player

## How to add your own questions
Open any lesson page and edit the `items` array near the bottom.

Example:
```html
const items = [
  { text: "Mis su nimi on?", audio: "../audio/topic-01/a1/001_mis_su_nimi_on.wav" },
  { text: "Kust sa pärit oled?", audio: "../audio/topic-01/a1/002_kust_sa_parit_oled.wav" }
];
initAudioList(items);
```

## Suggested audio folder structure
```text
mustmiljon_site/
├── index.html
├── assets/
├── pages/
└── audio/
    ├── topic-01/
    │   ├── a1/
    │   └── a2/
    ├── topic-02/
    │   ├── a1/
    │   └── a2/
    ...
```

## Run locally
Because browsers sometimes block audio/file features from direct file opening, it is best to run a tiny local server:

```bash
cd mustmiljon_site
python3 -m http.server 8000
```

Then open:
`http://localhost:8000`
