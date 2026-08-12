<div align="center">

<img src="images/spidee-hero-portrait.png" width="360" alt="Spidee Pixel Art Portrait" />

# 🕸️ SPIDEE ⚡
### *The Ultimate High-Octane Retro Arcade Platformer Runner*

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![Netlify Deploy](https://img.shields.io/badge/Deploy-Netlify%20Ready-00C7B7?logo=netlify)](https://www.netlify.com/)
[![FPS](https://img.shields.io/badge/Engine-60%20FPS%20Locked-ff0055.svg)](#)
[![JS](https://img.shields.io/badge/Language-Vanilla%20JS-yellow.svg)](#)

*Swing through city skylines, defeat rooftops thugs & flying drones, unleash Spider-Rage super moves, and obliterate the Venom Boss in a dynamic weather-shifting retro arcade world!*

---

</div>

## 🌟 Highlights & Key Features

### 🔥 1. **Spider-Rage Super Mode**
- Fill up the **Rage Gauge** (+15% per kill, +8% per coin).
- Press **`SHIFT`** when 100% full to activate 8 seconds of **Spider-Rage**:
  - Screen shake & glowing crimson neon filter.
  - **Triple Spread-Shot Laser Webs** with **Infinite Web Ammo**!

### 🦹 2. **Venom Boss Fight**
- Spawns dynamically at score milestones with a **`⚠️ WARNING! VENOM APPROACHES!`** alarm.
- Features a purple health bar and Symbiote tendril attacks.
- Defeating Venom triggers a **2-second slow-motion camera finish**, +100 bonus points, and a full HP/Ammo refill!

### 🌧️ 3. **Dynamic Weather & Day/Night Transitions**
- The city environment seamlessly transitions in real-time:
  - 🌇 **Sunset City** (Golden orange & magenta sky)
  - 🌃 **Cyberpunk Night** (Deep navy sky with twinkling stars)
  - ⚡ **Thunderstorm** (Falling rain particles & random lightning flashes!)

### 🕸️ 4. **Web Swing Pendulum Physics**
- Hold **`W`** in mid-air to attach a web tether rope to the sky anchor.
- Uses real gravitational pendulum physics (`angle`, `angularVelocity`).
- Release `W` to catapult forward across rooftop gaps with massive momentum!

### 🦘 5. **Double Jump & Precision Physics**
- Press **`Up Arrow` (↑)** twice mid-air for a energetic double jump with custom cyan particle rings.
- 60 FPS lock & terminal velocity cap prevent falling clipping on high refresh rate monitors.

### 🏆 6. **High Score & Best Record Persistence**
- Automatically saves and loads your all-time **BEST** score using browser `localStorage`.

### 🍕 7. **Power-Ups & Collectibles**
- ⚡ **Spider-Sense Shield**: Grants 6 seconds of invincibility with a cyan glowing aura.
- 🍕 **Pizza HP Boost**: Heals +2 HP hearts.
- 🪙 **Spider Coins**: Collectible stars for +50 bonus points and golden spark explosions.

---

## 🕹️ Controls Legend

| Key | Action |
| :--- | :--- |
| **`Spacebar`** | Shoot Web / Attack |
| **`←` / `→`** | Move Left / Right |
| **`↑`** | Single Jump |
| **`↑` + `↑`** | **Double Jump** |
| **`W` (Hold in Air)** | **Web Swing Pendulum** |
| **`Shift`** | **Activate Spider-Rage Mode** |
| **`Esc`** | Pause Game |
| **`Enter`** | Quick Restart on Game Over |

---

## 🚀 Quick Start (Play Locally)

No complex setup or build steps required! Simply clone and open `index.html`:

```bash
# 1. Clone repository
git clone https://github.com/Jay2849/Spidee.git

# 2. Open directory
cd Spidee

# 3. Launch in browser (or open index.html directly)
python -m http.server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser!

---

## 🌐 1-Click Netlify Deployment

This project is 100% Netlify ready out of the box with zero build dependencies!

1. Log into **[Netlify.com](https://www.netlify.com/)**.
2. Click **Add new site** ➔ **Import from an existing repository**.
3. Select your GitHub repository: `Jay2849/Spidee`.
4. Leave **Build Command** blank and set **Publish Directory** to `.`.
5. Click **Deploy Site**!

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">

Made with ❤️ & 🕸️ by **Jay2849**

</div>
