# Block Blast

A modern web implementation of the Block Blast puzzle game. Place randomly selected polyomino pieces onto an 8×8 board, clear full rows or columns, and chase combo chains for massive scores. The project ships as a responsive Progressive Web App (PWA) so it runs great on desktop browsers, Android, and iOS (via "Add to Home Screen" or native wrappers such as Capacitor / Expo).

## Gameplay rules

* Drag one of the three available pieces from the tray onto the 8×8 board.
* Pieces cannot be rotated; they must fit exactly within empty tiles.
* Completing any row or column clears it and grants bonus points.
* Each consecutive clear increases the combo multiplier for even more points.
* When none of the remaining tray pieces can be placed on the board the round ends.

## Features

* **Touch-first drag and drop** that works with mouse, touch, and stylus input.
* **Combo tracker** with on-screen toast notifications for multi-line clears.
* **Undo** button for quick recovery from mis-placements.
* **Persistent high score** stored in `localStorage`.
* **Offline-ready PWA** with a service worker, making mobile install straightforward.

## Running locally

The project is plain HTML/CSS/JS so any static file server works. During development the easiest approach is to use the Python built-in server:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) and play.

## Packaging for Android & iOS

Because this is a standards-compliant PWA, you have options to deliver it on mobile stores:

1. **Installable PWA** – On Android or iOS Safari visit the hosted URL and choose “Add to Home Screen.” The manifest and service worker allow offline play and a full-screen launcher icon.
2. **Capacitor / Cordova wrapper** – Use tools like [Capacitor](https://capacitorjs.com/) or [Cordova](https://cordova.apache.org/) to wrap the `index.html`, `styles.css`, `script.js`, `manifest.json`, and `service-worker.js` files in a native shell. The responsive layout adapts to any device aspect ratio.
3. **Expo / React Native WebView** – Load the game inside a `WebView` component pointing to the bundled assets for a minimal native wrapper.

## Project structure

```
.
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── index.html
├── manifest.json
├── README.md
├── script.js
├── service-worker.js
└── styles.css
```

Enjoy clearing those combos!
