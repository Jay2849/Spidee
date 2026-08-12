(function(window, document) {

var RESOURCES_FOLDER_PATH = "";

var requestAnimationFrame = (function() {
	if (window.requestAnimationFrame) return window.requestAnimationFrame;
	if (window.oRequestAnimationFrame) return window.oRequestAnimationFrame;
	if (window.msRequestAnimationFrame) return window.msRequestAnimationFrame;
	if (window.mozRequestAnimationFrame) return window.mozRequestAnimationFrame;
	return function(callback) {
		setTimeout(callback, 1000 / 60);
	}
})();

window.requestAnimFrame = requestAnimationFrame;

var link = document.createElement("link");
link.setAttribute("rel", "stylesheet");
link.setAttribute("href", RESOURCES_FOLDER_PATH + "css/spiderman-game.css");
document.head.appendChild(link);

var RESOURCES = {
	"JUMP"               : "images/jump.png",
	"RUNNING_CHANGE_STEP": "images/running-change-step.png",
	"RUNNING_LEFT_STEP"  : "images/running-left-step.png",
	"RUNNING_RIGHT_STEP" : "images/running-right-step.png",
	"SHOOT_CHANGE_STEP"  : "images/shoot-change-step.png",
	"SHOOT_JUMP"         : "images/shoot-jump.png",
	"SHOOT_LEFT-STEP"    : "images/shoot-left-step.png",
	"SHOOT_RIGHT-STEP"   : "images/shoot-right-step.png",
	"SHOOT"              : "images/shoot.png",
	"SLIDE"              : "images/slide.png",
	"STANDING"           : "images/standing.png",
	"WEB_PROJECTILE"     : "images/web.png",
	"BACKGROUND"         : "images/background.jpg",
	"ROOF"               : "images/wall.jpg",
	"BUILDING"           : "images/building.png",
	"SPIDER_HEAD"        : "images/spider-head.png",
	"HEART"              : "images/heart.png",
	"VENOM"              : "images/venom.png",
	"THUG"               : "images/thug.png",
	"KNIFE"              : "images/knife.png",
};

var AUDIO_RESOURCES = {
	"AMAZING_SPIDER_MAN_2" : new Audio(RESOURCES_FOLDER_PATH + "audio/amazing-spider-man-2.mp3"),
	"FRIENDLY_SPIDERMAN"   : new Audio(RESOURCES_FOLDER_PATH + "audio/60-theme-song.mp3"),
	"MOVIE_THEME"          : new Audio(RESOURCES_FOLDER_PATH + "audio/old-theme.mp3"),
	"ANIMATED_SERIES"      : new Audio(RESOURCES_FOLDER_PATH + "audio/animated-series-theme.mp3"),
	"SHOOT"                : new Audio(RESOURCES_FOLDER_PATH + "audio/shooting-web.mp3"),
};

var AUDIO_LOOP = [
	"AMAZING_SPIDER_MAN_2",
	"FRIENDLY_SPIDERMAN",
	"MOVIE_THEME",
	"ANIMATED_SERIES",
];

var KEY = {
	ARROW_LEFT: 37,
	ARROW_UP: 38,
	ARROW_RIGHT: 39,
	ARROW_DOWN: 40,
	SPACEBAR: 32,
	A: 65,
	S: 83,
	D: 68,
	W: 87,
	ESC: 27,
	ENTER: 13,
	SHIFT: 16,
};

var DIRECTION = {
	RIGHT: 1,
	LEFT: -1,
};

function SpidermanGame(opts) {
	var options = {
		canvas: "canvas",
		score: 0,
		muted: false,
		soundEffects: true,
	};

	opts = opts || {};
	for (var option in options) {
		if (opts.hasOwnProperty(option)) {
			options[option] = opts[option];
		}
		this[option] = options[option];
	}

	this.frame = 0;
	this.resources = {};
	this.cameraX = 0;
	this.score = this.score || 0;
	this.comboCount = 0;
	this.lastKillTime = 0;
	this.audioCtx = null;
	this.currentTrackIndex = 0;
	this.currentMusicAudio = null;
	
	try {
		this.highScore = parseInt(localStorage.getItem("spidee_highscore") || "0", 10);
	} catch (e) {
		this.highScore = 0;
	}

	this.weatherTimer = 0;
	this.weatherState = "SUNSET"; // SUNSET, NIGHT, STORM
	this.rainParticles = [];
	this.lightningTimer = 0;
	this.slowmoTimer = 0;
	this.bossActive = false;
	this.bossMilestones = [20, 50, 90, 140, 200];

	this.scene = {
		spiderman: null,
		projectiles: [],
		roofs: [],
		enemies: [],
		powerups: [],
		particles: [],
		floatingTexts: [],
	};

	// Pre-generate rain particles
	for (var i = 0; i < 60; i++) {
		this.rainParticles.push({
			x: Math.random() * 1200,
			y: Math.random() * 600,
			length: Math.random() * 15 + 10,
			speed: Math.random() * 12 + 10
		});
	}
}

SpidermanGame.prototype.paused             = false;
SpidermanGame.prototype.initialized        = false;
SpidermanGame.prototype.soundEffects       = true;
SpidermanGame.prototype.escapeKey          = false;
SpidermanGame.prototype.muted              = false;
SpidermanGame.prototype.slowmotion         = false;

SpidermanGame.prototype.load = function() {
	if (this.initialized) return false;
	var self = this;

	this.canvas = document.querySelector(this.canvas);
	if (!this.canvas) {
		this.canvas = document.createElement("canvas");
		document.body.appendChild(this.canvas);
	}
	this.ctx = this.canvas.getContext("2d");
	this.canvas.height = 500;
	this.canvas.width = 1111;

	var menu = document.createElement("div");
	menu.innerHTML = 
	'<div class="spiderman-game-menu-container">' +
		'<div class="spiderman-game-menu-title">PAUSED</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-resume">RESUME</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-sounds">MUTE SOUNDS</div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-mute-music">MUTE MUSIC</div>' +
	'</div>';
	menu = menu.firstChild;
	menu.style.display = "none";
	menu.querySelector(".spiderman-game-menu-button-resume").onclick = function() {
		self.unpause();
	};
	menu.querySelector(".spiderman-game-menu-button-mute-sounds").onclick = function() {
		self.soundEffects = !self.soundEffects;
		this.innerHTML = self.soundEffects ? "MUTE SOUNDS" : "UNMUTE SOUNDS";
	};
	menu.querySelector(".spiderman-game-menu-button-mute-music").onclick = function() {
		if (self.muted) { self.unmute(); this.innerHTML = "MUTE MUSIC"; }
		else { self.mute(); this.innerHTML = "UNMUTE MUSIC"; }
	};
	document.body.appendChild(menu);
	this.pauseMenu = menu;

	var gameoverMenu = document.createElement("div");
	gameoverMenu.innerHTML = 
	'<div class="spiderman-game-menu-container">' +
		'<div class="spiderman-game-menu-title">GAME OVER</div>' +
		'<div class="spiderman-game-menu-title">FINAL SCORE: <span class="spiderman-game-score">0</span></div>' +
		'<div class="spiderman-game-menu-title highscore-highlight">BEST RECORD: <span class="spiderman-game-highscore">0</span></div>' +
		'<div class="spiderman-game-menu-button spiderman-game-menu-button-restart">RESTART [ENTER]</div>' +
	'</div>';
	gameoverMenu = gameoverMenu.firstChild;
	gameoverMenu.querySelector(".spiderman-game-menu-button-restart").onclick = function() {
		self.restart();
	};
	document.body.appendChild(gameoverMenu);
	this.gameoverMenu = gameoverMenu;

	this.spiderman = new SpiderMan(this);
	this.scene.spiderman = this.spiderman;

	var handleUserInteraction = function() {
		self.getAudioContext();
		if (!self.muted && !self.currentMusicAudio) {
			self.playMusic();
		}
	};
	document.addEventListener("click", handleUserInteraction);

	var createTouchControls = function() {
		if (document.getElementById("spideeMobileControls")) return;

		if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
			window.screen.orientation.lock("landscape").catch(function() {});
		}

		var container = document.createElement("div");
		container.className = "mobile-touch-controls-overlay";
		container.id = "spideeMobileControls";
		container.innerHTML = 
			'<div class="touch-overlay-left">' +
				'<button class="touch-btn touch-btn-nav" id="spideeBtnLeft" aria-label="Move Left">◀</button>' +
				'<button class="touch-btn touch-btn-rage" id="spideeBtnRage" aria-label="Rage Mode">🔥 RAGE</button>' +
			'</div>' +
			'<div class="touch-overlay-top">' +
				'<button class="touch-btn touch-btn-utility" id="spideeBtnPause" aria-label="Pause">⏸️</button>' +
				'<button class="touch-btn touch-btn-utility" id="spideeBtnRestart" aria-label="Restart">🔄</button>' +
			'</div>' +
			'<div class="touch-overlay-right">' +
				'<button class="touch-btn touch-btn-shoot" id="spideeBtnShoot" aria-label="Shoot Web">🕸️<br>SHOOT</button>' +
				'<button class="touch-btn touch-btn-nav touch-btn-forward" id="spideeBtnRight" aria-label="Move Right">▶</button>' +
			'</div>';

		var guideBar = document.createElement("div");
		guideBar.className = "gesture-guide-bar";
		guideBar.innerHTML = 
			'<div class="gesture-guide-item"><span>👆 1x Tap:</span> Jump</div>' +
			'<div class="gesture-guide-item"><span>✌️ 2x Tap:</span> Double Jump</div>' +
			'<div class="gesture-guide-item"><span>⏱️ Hold:</span> Web Swing</div>' +
			'<div class="gesture-guide-item"><span>⚡ 3x Tap:</span> Spider-Rage</div>';

		if (self.canvas.parentNode) {
			self.canvas.parentNode.appendChild(container);
			if (self.canvas.parentNode.parentNode) {
				self.canvas.parentNode.parentNode.appendChild(guideBar);
			}
		} else {
			document.body.appendChild(container);
		}

		var bindTouch = function(btnId, keyCode) {
			var btn = document.getElementById(btnId);
			if (!btn) return;

			var handlePress = function(e) {
				if (e.cancelable) e.preventDefault();
				handleUserInteraction();
				btn.classList.add("active");
				if (navigator.vibrate) try { navigator.vibrate(20); } catch(err){}

				if (keyCode === KEY.ENTER && self.gameIsOver) {
					self.restart();
					return;
				}
				if (keyCode === KEY.ESC && !self.escapeKey) {
					self.escapeKey = true;
					if (self.paused) self.unpause();
					else self.pause();
					return;
				}
				if (keyCode === KEY.SHIFT) {
					if (self.spiderman.rageMeter >= 100 && self.spiderman.rageTimer <= 0) {
						self.spiderman.activateRage();
					} else {
						self.addFloatingText(self.spiderman.x, self.spiderman.y - 30, "⚡ RAGE METER NOT FULL!", "#ff0055", 18);
					}
					return;
				}

				self.spiderman.keydown(keyCode);
			};

			var handleRelease = function(e) {
				if (e.cancelable) e.preventDefault();
				btn.classList.remove("active");
				if (keyCode === KEY.ESC) self.escapeKey = false;
				self.spiderman.keyup(keyCode);
			};

			btn.addEventListener("touchstart", handlePress, { passive: false });
			btn.addEventListener("touchend", handleRelease, { passive: false });
			btn.addEventListener("touchcancel", handleRelease, { passive: false });
			btn.addEventListener("mousedown", handlePress);
			btn.addEventListener("mouseup", handleRelease);
			btn.addEventListener("mouseleave", handleRelease);
		};

		bindTouch("spideeBtnLeft", KEY.ARROW_LEFT);
		bindTouch("spideeBtnRight", KEY.ARROW_RIGHT);
		bindTouch("spideeBtnRage", KEY.SHIFT);
		bindTouch("spideeBtnShoot", KEY.SPACEBAR);
		bindTouch("spideeBtnPause", KEY.ESC);
		bindTouch("spideeBtnRestart", KEY.ENTER);

		// Instant 0ms Latency Touch Gesture Engine for Game Canvas
		var tapCount = 0;
		var lastTapTime = 0;
		var longPressTimer = null;
		var isLongPress = false;
		var touchStartTime = 0;

		var handleCanvasTouchStart = function(e) {
			if (e.target.closest && e.target.closest(".touch-btn")) return;
			if (e.cancelable) e.preventDefault();
			handleUserInteraction();

			var now = Date.now();
			touchStartTime = now;
			isLongPress = false;

			if (now - lastTapTime < 320) {
				tapCount++;
			} else {
				tapCount = 1;
			}
			lastTapTime = now;

			if (tapCount === 1) {
				// Instant 1x Tap -> Single Jump (0ms Lag!)
				if (navigator.vibrate) try { navigator.vibrate(15); } catch(err){}
				self.spiderman.keydown(KEY.ARROW_UP);
				setTimeout(function() { self.spiderman.keyup(KEY.ARROW_UP); }, 90);
			} else if (tapCount === 2) {
				// Instant 2x Tap -> Double Jump (0ms Lag!)
				if (navigator.vibrate) try { navigator.vibrate(25); } catch(err){}
				self.spiderman.keydown(KEY.ARROW_UP);
				setTimeout(function() { self.spiderman.keyup(KEY.ARROW_UP); }, 90);
			} else if (tapCount >= 3) {
				// Instant 3x Tap -> Spider-Rage Mode!
				if (navigator.vibrate) try { navigator.vibrate([30, 20, 30]); } catch(err){}
				if (self.spiderman.rageMeter >= 100 && self.spiderman.rageTimer <= 0) {
					self.spiderman.activateRage();
				} else {
					self.addFloatingText(self.spiderman.x, self.spiderman.y - 30, "⚡ RAGE METER NOT FULL!", "#ff0055", 18);
				}
				tapCount = 0;
			}

			// Long Press Timer (> 180ms triggers Web Swing W key)
			clearTimeout(longPressTimer);
			longPressTimer = setTimeout(function() {
				isLongPress = true;
				if (navigator.vibrate) try { navigator.vibrate(25); } catch(err){}
				self.spiderman.keydown(KEY.W);
			}, 180);
		};

		var handleCanvasTouchEnd = function(e) {
			if (e.target.closest && e.target.closest(".touch-btn")) return;
			if (e.cancelable) e.preventDefault();
			clearTimeout(longPressTimer);

			if (isLongPress) {
				self.spiderman.keyup(KEY.W);
				isLongPress = false;
				tapCount = 0;
			}
		};

		self.canvas.addEventListener("touchstart", handleCanvasTouchStart, { passive: false });
		self.canvas.addEventListener("touchend", handleCanvasTouchEnd, { passive: false });
		self.canvas.addEventListener("touchcancel", handleCanvasTouchEnd, { passive: false });
		self.canvas.addEventListener("mousedown", handleCanvasTouchStart);
		self.canvas.addEventListener("mouseup", handleCanvasTouchEnd);
	};

	createTouchControls();

	document.addEventListener("keydown", function(e) {
		handleUserInteraction();
		var keyCode = e.keyCode || e.which;

		if (keyCode == 13 || keyCode == KEY.ENTER) {
			if (self.gameIsOver) {
				self.restart();
				return;
			}
		}

		if (keyCode == KEY.SHIFT) {
			if (self.spiderman.rageMeter >= 100 && self.spiderman.rageTimer <= 0) {
				self.spiderman.activateRage();
			}
		}

		if (keyCode == KEY.ESC && !self.escapeKey) {
			self.escapeKey = true;
			if (self.paused) self.unpause();
			else self.pause();
		}

		self.spiderman.keydown(keyCode);
	});

	document.addEventListener("keyup", function(e) {
		var keyCode = e.keyCode || e.which;
		if (keyCode == KEY.ESC) self.escapeKey = false;
		self.spiderman.keyup(keyCode);
	});

	return new Promise(function(resolve) {
		var reourcesArray = [];
		for (var resource in RESOURCES) {
			reourcesArray.push({
				name: resource,
				source: RESOURCES_FOLDER_PATH + RESOURCES[resource],
			});
		}

		var promises = reourcesArray.map(function(resource) {
			return new Promise(function(resolve) {
				var img = new Image();
				img.onload = function() {
					self.resources[resource.name] = img;
					resolve(img);
				};
				img.onerror = function() { resolve(null); };
				img.src = resource.source;
			});
		});

		Promise.all(promises).then(function() {
			self.initialized = true;
			self.restart();
			resolve();
		});
	});
};

SpidermanGame.prototype.addParticles = function(x, y, color, count, speed) {
	count = count || 8;
	speed = speed || 3;
	for (var i = 0; i < count; i++) {
		var angle = Math.random() * Math.PI * 2;
		var vel = (Math.random() * 0.8 + 0.2) * speed;
		var p = new Particle(this, x, y, {
			vx: Math.cos(angle) * vel,
			vy: Math.sin(angle) * vel - 1,
			color: color,
			size: Math.random() * 4 + 2,
			life: Math.round(Math.random() * 20 + 20)
		});
		this.scene.particles.push(p);
	}
};

SpidermanGame.prototype.addFloatingText = function(x, y, text, color, fontSize) {
	this.scene.floatingTexts.push(new FloatingText(this, x, y, text, color, fontSize));
};

SpidermanGame.prototype.getAudioContext = function() {
	if (!this.audioCtx) {
		var AudioContextClass = window.AudioContext || window.webkitAudioContext;
		if (AudioContextClass) {
			this.audioCtx = new AudioContextClass();
		}
	}
	if (this.audioCtx && this.audioCtx.state === "suspended") {
		this.audioCtx.resume();
	}
	return this.audioCtx;
};

SpidermanGame.prototype.playMusic = function() {
	if (this.muted) return;
	if (this.currentMusicAudio) {
		this.currentMusicAudio.play().catch(function() {});
		return;
	}
	var self = this;
	var trackName = AUDIO_LOOP[this.currentTrackIndex || 0];
	var audio = AUDIO_RESOURCES[trackName];
	if (audio) {
		audio.volume = 0.4;
		audio.loop = false;
		audio.onended = function() {
			self.currentTrackIndex = ((self.currentTrackIndex || 0) + 1) % AUDIO_LOOP.length;
			self.currentMusicAudio = null;
			self.playMusic();
		};
		this.currentMusicAudio = audio;
		audio.play().catch(function() {});
	}
};

SpidermanGame.prototype.mute = function() {
	this.muted = true;
	if (this.currentMusicAudio) {
		this.currentMusicAudio.pause();
	}
};

SpidermanGame.prototype.unmute = function() {
	this.muted = false;
	this.playMusic();
};

SpidermanGame.prototype.playSound = function(type) {
	if (!this.soundEffects) return;
	var ctx = this.getAudioContext();

	if (type === "WEB_SHOOT") {
		try {
			var audioObj = AUDIO_RESOURCES["SHOOT"];
			if (audioObj) {
				var clone = audioObj.cloneNode();
				clone.volume = 0.6;
				clone.play().catch(function() {});
			}
		} catch (e) {}

		if (ctx) {
			try {
				var osc = ctx.createOscillator();
				var gain = ctx.createGain();
				osc.type = "sine";
				var now = ctx.currentTime;
				osc.frequency.setValueAtTime(900, now);
				osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
				gain.gain.setValueAtTime(0.35, now);
				gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now);
				osc.stop(now + 0.12);
			} catch (e) {}
		}
	} else if (type === "ENEMY_SHOOT") {
		if (!ctx) return;
		try {
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sawtooth";
			var now = ctx.currentTime;
			osc.frequency.setValueAtTime(450, now);
			osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
			gain.gain.setValueAtTime(0.2, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.1);
		} catch (e) {}
	} else if (type === "HIT_ENEMY") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "triangle";
			osc.frequency.setValueAtTime(220, now);
			osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
			gain.gain.setValueAtTime(0.4, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.15);

			var bufferSize = ctx.sampleRate * 0.08;
			var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
			var data = buffer.getChannelData(0);
			for (var i = 0; i < bufferSize; i++) {
				data[i] = Math.random() * 2 - 1;
			}
			var noise = ctx.createBufferSource();
			noise.buffer = buffer;
			var noiseGain = ctx.createGain();
			noiseGain.gain.setValueAtTime(0.25, now);
			noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
			noise.connect(noiseGain);
			noiseGain.connect(ctx.destination);
			noise.start(now);
		} catch (e) {}
	} else if (type === "HIT_PLAYER") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(150, now);
			osc.frequency.linearRampToValueAtTime(60, now + 0.2);
			gain.gain.setValueAtTime(0.4, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.2);
		} catch (e) {}
	} else if (type === "COLLECT_COIN") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(987.77, now);
			osc.frequency.setValueAtTime(1318.51, now + 0.08);
			gain.gain.setValueAtTime(0.35, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.25);
		} catch (e) {}
	} else if (type === "COLLECT_SHIELD") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(300, now);
			osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
			gain.gain.setValueAtTime(0.35, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.3);
		} catch (e) {}
	} else if (type === "COLLECT_PIZZA") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var notes = [523.25, 659.25, 783.99];
			notes.forEach(function(freq, index) {
				var osc = ctx.createOscillator();
				var gain = ctx.createGain();
				osc.type = "sine";
				osc.frequency.setValueAtTime(freq, now + index * 0.07);
				gain.gain.setValueAtTime(0.3, now + index * 0.07);
				gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.07 + 0.12);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now + index * 0.07);
				osc.stop(now + index * 0.07 + 0.12);
			});
		} catch (e) {}
	} else if (type === "ENEMY_DEFEAT") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(300, now);
			osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
			gain.gain.setValueAtTime(0.3, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.2);
		} catch (e) {}
	} else if (type === "RAGE") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sawtooth";
			osc.frequency.setValueAtTime(150, now);
			osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
			gain.gain.setValueAtTime(0.4, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.45);
		} catch (e) {}
	} else if (type === "JUMP") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(250, now);
			osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
			gain.gain.setValueAtTime(0.2, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.1);
		} catch (e) {}
	} else if (type === "SWING") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var osc = ctx.createOscillator();
			var gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(400, now);
			osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
			gain.gain.setValueAtTime(0.25, now);
			gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start(now);
			osc.stop(now + 0.15);
		} catch (e) {}
	} else if (type === "GAME_OVER") {
		if (!ctx) return;
		try {
			var now = ctx.currentTime;
			var notes = [400, 350, 300, 220];
			notes.forEach(function(freq, index) {
				var osc = ctx.createOscillator();
				var gain = ctx.createGain();
				osc.type = "sawtooth";
				osc.frequency.setValueAtTime(freq, now + index * 0.12);
				gain.gain.setValueAtTime(0.3, now + index * 0.12);
				gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.12 + 0.18);
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.start(now + index * 0.12);
				osc.stop(now + index * 0.12 + 0.18);
			});
		} catch (e) {}
	}
};

SpidermanGame.prototype.registerKill = function(x, y) {
	var now = performance.now();
	if (now - this.lastKillTime < 1800) {
		this.comboCount++;
	} else {
		this.comboCount = 1;
	}
	this.lastKillTime = now;

	if (this.comboCount >= 2) {
		var label = this.comboCount + "x COMBO!";
		if (this.comboCount >= 3) label = "🔥 " + this.comboCount + "x SUPER COMBO!";
		if (this.comboCount >= 5) label = "⚡ UNSTOPPABLE x" + this.comboCount + "!";
		this.addFloatingText(x, y - 30, label, "#ffd700", 22);
		this.playSound("COLLECT_COIN");
	}
};

SpidermanGame.prototype.update = function(timestamp) {
	if (this.paused) return;
	if (this.gameIsOver) return;

	requestAnimFrame(this.update.bind(this));

	if (!timestamp) timestamp = performance.now();
	if (!this.lastFrameTime) this.lastFrameTime = timestamp;
	var delta = timestamp - this.lastFrameTime;

	// Slow motion camera handling (e.g. Boss kill)
	var targetFPS = (this.slowmoTimer > 0) ? 35 : 15;
	if (this.slowmoTimer > 0) this.slowmoTimer--;

	if (delta < targetFPS) {
		return;
	}
	this.lastFrameTime = timestamp - (delta % 16.666);

	var scene = this.scene;
	var spiderman = scene.spiderman;
	var projectiles = scene.projectiles;
	var enemies = scene.enemies;
	var powerups = scene.powerups;
	var particles = scene.particles;
	var floatingTexts = scene.floatingTexts;

	// Update Weather & Environment State
	this.weatherTimer++;
	if (this.weatherTimer > 900) { // Cycle weather every ~15s
		this.weatherTimer = 0;
		if (this.weatherState === "SUNSET") this.weatherState = "NIGHT";
		else if (this.weatherState === "NIGHT") this.weatherState = "STORM";
		else this.weatherState = "SUNSET";
	}

	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	this.drawDynamicEnvironment();
	this.drawRoofs();

	// Check Boss Spawn Milestones
	if (!this.bossActive && this.bossMilestones.length > 0) {
		if (this.score >= this.bossMilestones[0]) {
			this.bossMilestones.shift();
			this.bossActive = true;
			var boss = new VenomBoss(this, {
				x: spiderman.x + 600,
				y: 120
			});
			this.addEnemy(boss);
			this.addFloatingText(this.canvas.width / 2 + this.cameraX, 100, "⚠️ WARNING! VENOM APPROACHES! ⚠️", "#ff0055", 28);
		}
	}

	// Update & draw powerups
	for (var i = powerups.length - 1; i >= 0; i--) {
		powerups[i].update();
	}

	// Update & draw enemies
	for (var i = enemies.length - 1; i >= 0; i--) {
		enemies[i].update();
	}

	// Update & draw projectiles
	for (var i = projectiles.length - 1; i >= 0; i--) {
		projectiles[i].update();
	}

	spiderman.update();

	// Update & draw particles
	for (var i = particles.length - 1; i >= 0; i--) {
		particles[i].update();
		if (particles[i].life <= 0) particles.splice(i, 1);
	}

	// Update & draw floating texts
	for (var i = floatingTexts.length - 1; i >= 0; i--) {
		floatingTexts[i].update();
		if (floatingTexts[i].life <= 0) floatingTexts.splice(i, 1);
	}

	// Collision checking: Projectiles vs Characters
	for (var i = projectiles.length - 1; i >= 0; i--) {
		var projectile = projectiles[i];
		if (!projectile) continue;
		var character = this.isCharacterAtPoint(projectile.x, projectile.y);
		if (character) {
			projectile.handleHitWithCharacter(character);
			character.handleHitWithProjectile(projectile);
		}
	}

	// Collision checking: Spiderman vs Powerups
	for (var i = powerups.length - 1; i >= 0; i--) {
		var p = powerups[i];
		var pX = p.x - this.cameraX;
		var pY = p.y;
		var sX = spiderman.x - this.cameraX;
		var sY = spiderman.y;

		if (pX >= sX - 25 && pX <= sX + 60 && pY >= sY - 25 && pY <= sY + 70) {
			p.collect(spiderman);
			powerups.splice(i, 1);
		}
	}

	// High score tracking
	if (this.score > this.highScore) {
		this.highScore = this.score;
		try { localStorage.setItem("spidee_highscore", this.highScore); } catch (e) {}
	}

	this.drawHUD();
};

SpidermanGame.prototype.drawDynamicEnvironment = function() {
	var ctx = this.ctx;
	var w = this.canvas.width;
	var h = this.canvas.height;

	if (this.weatherState === "SUNSET") {
		var grad = ctx.createLinearGradient(0, 0, 0, h);
		grad.addColorStop(0, "#2c0e37");
		grad.addColorStop(0.5, "#80234a");
		grad.addColorStop(1, "#0a0e1a");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, w, h);
	} else if (this.weatherState === "NIGHT") {
		var grad = ctx.createLinearGradient(0, 0, 0, h);
		grad.addColorStop(0, "#050914");
		grad.addColorStop(0.7, "#0f172a");
		grad.addColorStop(1, "#0a0e1a");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, w, h);

		// Cyberpunk stars
		ctx.fillStyle = "#ffffff";
		for (var i = 0; i < 20; i++) {
			var sx = (i * 70 - (this.cameraX * 0.1)) % w;
			if (sx < 0) sx += w;
			ctx.fillRect(sx, (i * 23) % 200, 2, 2);
		}
	} else if (this.weatherState === "STORM") {
		var grad = ctx.createLinearGradient(0, 0, 0, h);
		grad.addColorStop(0, "#0f172a");
		grad.addColorStop(1, "#020617");
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, w, h);

		// Rain effect
		ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		for (var i = 0; i < this.rainParticles.length; i++) {
			var r = this.rainParticles[i];
			r.y += r.speed;
			r.x -= 3;
			if (r.y > h) { r.y = -20; r.x = Math.random() * w; }
			ctx.moveTo(r.x, r.y);
			ctx.lineTo(r.x - 4, r.y + r.length);
		}
		ctx.stroke();

		// Periodic Lightning Flash
		this.lightningTimer++;
		if (this.lightningTimer > 240 && Math.random() < 0.04) {
			ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
			ctx.fillRect(0, 0, w, h);
			if (Math.random() < 0.1) this.lightningTimer = 0;
		}
	}

	// Draw parallax background image if present
	var background = this.resources.BACKGROUND;
	if (background) {
		var ratio = background.width / background.height;
		var x = (this.cameraX / 5) * -1;
		x %= (h * ratio);
		ctx.save();
		ctx.globalAlpha = 0.45;
		ctx.drawImage(background, x, 0, h * ratio, h);
		ctx.drawImage(background, x + h * ratio, 0, h * ratio, h);
		ctx.restore();
	}
};

SpidermanGame.prototype.drawHUD = function() {
	var ctx = this.ctx;
	var spiderman = this.spiderman;

	// Score
	ctx.fillStyle = "#ffffff";
	ctx.font = "22px SpidermanGamePixelFont, Monospace, Helvetica";
	ctx.textAlign = "center";
	ctx.textBaseline = "top";
	ctx.fillText("SCORE: " + this.score, this.canvas.width / 2, 8);

	// High Score
	ctx.fillStyle = "#ffd700";
	ctx.font = "16px SpidermanGamePixelFont, Monospace, Helvetica";
	ctx.textAlign = "right";
	ctx.fillText("BEST: " + this.highScore, this.canvas.width - 20, 8);

	// Rage Bar HUD
	var rX = this.canvas.width / 2 - 80;
	var rY = 36;
	var rW = 160;
	var rH = 10;
	ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
	ctx.fillRect(rX - 2, rY - 2, rW + 4, rH + 4);
	var fillW = (spiderman.rageMeter / 100) * rW;
	ctx.fillStyle = (spiderman.rageMeter >= 100) ? "#ff0055" : "#a855f7";
	ctx.fillRect(rX, rY, fillW, rH);

	if (spiderman.rageMeter >= 100 && spiderman.rageTimer <= 0) {
		ctx.fillStyle = "#ff0055";
		ctx.font = "bold 13px Helvetica";
		ctx.textAlign = "center";
		ctx.fillText("PRESS SHIFT FOR SPIDER-RAGE!", this.canvas.width / 2, rY + 14);
	}
};

SpidermanGame.prototype.addProjectile = function(projectile) {
	if (projectile instanceof Projectile) this.scene.projectiles.push(projectile);
};

SpidermanGame.prototype.removeProjectile = function(projectile) {
	var idx = this.scene.projectiles.indexOf(projectile);
	if (idx > -1) this.scene.projectiles.splice(idx, 1);
};

SpidermanGame.prototype.addEnemy = function(enemy) {
	this.scene.enemies.push(enemy);
};

SpidermanGame.prototype.removeEnemy = function(enemy) {
	var idx = this.scene.enemies.indexOf(enemy);
	if (idx > -1) this.scene.enemies.splice(idx, 1);
};

SpidermanGame.prototype.addRoof = function(roof) {
	if (roof instanceof Roof) this.scene.roofs.push(roof);
};

SpidermanGame.prototype.removeRoof = function(roof) {
	var idx = this.scene.roofs.indexOf(roof);
	if (idx > -1) this.scene.roofs.splice(idx, 1);
};

SpidermanGame.prototype.isRoofAtPoint = function(x, y) {
	x -= this.cameraX; 
	for (var i = 0; i < this.scene.roofs.length; i++) {
		var roof = this.scene.roofs[i];
		var roofX = roof.x - this.cameraX;
		if (roofX <= x && roofX + roof.fullWidth >= x && y >= roof.y) return roof;
	}
	return false;
};

SpidermanGame.prototype.isCharacterAtPoint = function(x, y) {
	var characters = this.scene.enemies.concat(this.spiderman);
	x -= this.cameraX;

	for (var i = 0; i < characters.length; i++) {
		var character = characters[i];
		var stateImg = character.stateImg || {};
		var left = character.x - this.cameraX;
		var top = character.y;
		var right = left + (stateImg.width ? stateImg.width * character.scale : 45);
		var bottom = top + (stateImg.height ? stateImg.height * character.scale : 65);

		if (left <= x && top <= y && right >= x && bottom >= y) return character;
	}
	return false;
};

SpidermanGame.prototype.restart = function() {
	var roof = new Roof(this);
	roof.x = 0;

	this.spiderman = new SpiderMan(this);
	this.scene.spiderman = this.spiderman;
	this.scene.projectiles = [];
	this.scene.roofs = [roof];
	this.scene.enemies = [];
	this.scene.powerups = [];
	this.scene.particles = [];
	this.scene.floatingTexts = [];
	this.cameraX = 0;
	this.score = 0;
	this.bossActive = false;
	this.bossMilestones = [20, 50, 90, 140, 200];

	this.paused = false;
	this.gameIsOver = false;

	this.gameoverMenu.style.display = "none";
	this.pauseMenu.style.display = "none";

	this.update();
};

SpidermanGame.prototype.gameover = function() {
	this.gameIsOver = true;
	this.playSound("GAME_OVER");
	this.showGameoverMenu();
};

SpidermanGame.prototype.showPauseMenu = function() {
	this.paused = true;
	this.pauseMenu.style.display = "block";
};

SpidermanGame.prototype.showGameoverMenu = function() {
	this.gameoverMenu.querySelector(".spiderman-game-score").innerHTML = this.score;
	this.gameoverMenu.querySelector(".spiderman-game-highscore").innerHTML = this.highScore;
	this.gameoverMenu.style.display = "block";
};

SpidermanGame.prototype.pause = function() { this.showPauseMenu(); };
SpidermanGame.prototype.unpause = function() {
	this.paused = false;
	this.pauseMenu.style.display = "none";
	this.update();
};

SpidermanGame.prototype.drawRoofs = function() {
	var roofs = this.scene.roofs;
	for (var i = 0; i < roofs.length; i++) {
		roofs[i].update();
	}

	var lastRoof = roofs[roofs.length - 1];
	if (lastRoof && lastRoof.x - this.cameraX + lastRoof.fullWidth <= this.canvas.width + 300) {
		var x = lastRoof.x + lastRoof.fullWidth + Math.round(Math.random() * 40) + 90;
		var newRoof = new Roof(this, x);
		this.addRoof(newRoof);
	}
};

// Particle Class
function Particle(game, x, y, opts) {
	this.game = game;
	this.ctx = game.ctx;
	this.x = x;
	this.y = y;
	this.vx = opts.vx || 0;
	this.vy = opts.vy || 0;
	this.color = opts.color || "#ffffff";
	this.size = opts.size || 3;
	this.life = opts.life || 30;
	this.maxLife = this.life;
}

Particle.prototype.update = function() {
	this.x += this.vx;
	this.y += this.vy;
	this.vy += 0.1;
	this.life--;

	var renderX = this.x - this.game.cameraX;
	var alpha = Math.max(0, this.life / this.maxLife);

	this.ctx.save();
	this.ctx.globalAlpha = alpha;
	this.ctx.fillStyle = this.color;
	this.ctx.fillRect(renderX, this.y, this.size, this.size);
	this.ctx.restore();
};

// Floating Arcade Text Popups
function FloatingText(game, x, y, text, color, fontSize) {
	this.game = game;
	this.ctx = game.ctx;
	this.x = x;
	this.y = y;
	this.text = text;
	this.color = color || "#ffd700";
	this.fontSize = fontSize || 20;
	this.life = 45;
	this.maxLife = 45;
}

FloatingText.prototype.update = function() {
	this.y -= 1.2;
	this.life--;
	var renderX = this.x - this.game.cameraX;
	var alpha = Math.max(0, this.life / this.maxLife);

	this.ctx.save();
	this.ctx.globalAlpha = alpha;
	this.ctx.fillStyle = this.color;
	this.ctx.font = "bold " + this.fontSize + "px Helvetica, sans-serif";
	this.ctx.textAlign = "center";
	this.ctx.shadowBlur = 10;
	this.ctx.shadowColor = this.color;
	this.ctx.fillText(this.text, renderX, this.y);
	this.ctx.restore();
};

// PowerUp Class
function PowerUp(game, opts) {
	this.game = game;
	this.ctx = game.ctx;
	this.x = opts.x || 0;
	this.y = opts.y || 0;
	this.type = opts.type || "SHIELD";
	this.bounce = 0;
}

PowerUp.prototype.update = function() {
	this.bounce += 0.08;
	var renderX = this.x - this.game.cameraX;
	var renderY = this.y + Math.sin(this.bounce) * 6;

	this.ctx.save();
	if (this.type === "SHIELD") {
		this.ctx.shadowBlur = 10;
		this.ctx.shadowColor = "#00f0ff";
		this.ctx.fillStyle = "#00f0ff";
		this.ctx.beginPath();
		this.ctx.arc(renderX, renderY, 12, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = "bold 12px Helvetica";
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillText("⚡", renderX, renderY);
	} else if (this.type === "PIZZA") {
		this.ctx.shadowBlur = 10;
		this.ctx.shadowColor = "#ff0055";
		this.ctx.fillStyle = "#ff0055";
		this.ctx.beginPath();
		this.ctx.arc(renderX, renderY, 12, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = "bold 12px Helvetica";
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillText("🍕", renderX, renderY);
	} else if (this.type === "COIN") {
		this.ctx.shadowBlur = 12;
		this.ctx.shadowColor = "#ffd700";
		this.ctx.fillStyle = "#ffd700";
		this.ctx.beginPath();
		this.ctx.arc(renderX, renderY, 10, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.fillStyle = "#000000";
		this.ctx.font = "bold 11px Helvetica";
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "middle";
		this.ctx.fillText("★", renderX, renderY);
	}
	this.ctx.restore();
};

PowerUp.prototype.collect = function(spiderman) {
	if (this.type === "SHIELD") {
		spiderman.shieldTimer = 360;
		this.game.addParticles(this.x, this.y, "#00f0ff", 15, 4);
		this.game.addFloatingText(this.x, this.y - 20, "⚡ SHIELD ACTIVE!", "#00f0ff", 18);
		this.game.playSound("COLLECT_SHIELD");
	} else if (this.type === "PIZZA") {
		spiderman.health = Math.min(spiderman.maxHealth, spiderman.health + 2);
		this.game.addParticles(this.x, this.y, "#ff0055", 15, 4);
		this.game.addFloatingText(this.x, this.y - 20, "🍕 HP HEAL!", "#ff0055", 18);
		this.game.playSound("COLLECT_PIZZA");
	} else if (this.type === "COIN") {
		this.game.score += 50;
		spiderman.rageMeter = Math.min(100, spiderman.rageMeter + 8);
		this.game.addParticles(this.x, this.y, "#ffd700", 12, 4);
		this.game.addFloatingText(this.x, this.y - 20, "+50 PTS", "#ffd700", 16);
		this.game.playSound("COLLECT_COIN");
	}
};

// SpiderMan Class with Rage Mode & Web Swing Physics
function SpiderMan(game) {
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;
	this.name = "SPIDER_MAN";
	this.x = 0;
	this.y = 0; 
	this.states = ["STANDING"];
	this.scale = 0.5;
	this.keydowns = [];
	this.health = 5;
	this.maxHealth = 5;

	this.web = 50;
	this.shieldTimer = 0;
	this.rageMeter = 0;
	this.rageTimer = 0;

	// Web Swing Pendulum Physics
	this.isSwinging = false;
	this.swingAnchorX = 0;
	this.swingAnchorY = 0;
	this.swingAngle = 0;
	this.swingAngularVelocity = 0;
	this.swingRopeLength = 0;

	this.velocityX = 0;
	this.velocityY = 0;
	this.gravityForce = 0.55;
	this.maxFallSpeed = 11;

	this.runningDirection = 0;
	this.runningSpeed = 5.5;

	this.jumpsLeft = 2;
	this.jumpKeyPressedPrevious = false;

	this.frame = 0;
	this.runningFrames = ["RUNNING_RIGHT_STEP", "RUNNING_CHANGE_STEP", "RUNNING_LEFT_STEP", "RUNNING_CHANGE_STEP"];
	this.runningShootingFrames = ["SHOOT_RIGHT-STEP", "SHOOT_CHANGE_STEP", "SHOOT_LEFT-STEP", "SHOOT_CHANGE_STEP"];
	this.runningFrame = 0;

	this.shootingFrame = 0;
	this.wasDamagedOnPreviousFrame = false;
}

SpiderMan.prototype.keyIsDown = function(keyCode) {
	return this.keydowns.indexOf(keyCode) > -1;
};

SpiderMan.prototype.hasState = function(state) {
	return this.states.indexOf(state) > -1;
};

SpiderMan.prototype.addState = function(state) {
	if (this.hasState(state) === false) this.states.push(state);
};

SpiderMan.prototype.removeState = function(state) {
	if (this.hasState(state)) this.states.splice(this.states.indexOf(state), 1);
};

SpiderMan.prototype.activateRage = function() {
	this.rageTimer = 480; // 8 Seconds
	this.rageMeter = 0;
	this.game.addParticles(this.x, this.y, "#ff0055", 25, 6);
	this.game.addFloatingText(this.x, this.y - 40, "🔥 SPIDER-RAGE ACTIVATED! 🔥", "#ff0055", 26);
	this.game.playSound("RAGE");
};

SpiderMan.prototype.handleHitWithCharacter = function() {};

SpiderMan.prototype.handleHitWithProjectile = function(projectile) {
	if (projectile.name !== "WEB") {
		if (this.shieldTimer > 0) {
			this.game.addParticles(this.x, this.y, "#00f0ff", 10, 5);
			this.game.playSound("COLLECT_SHIELD");
			return;
		}
		this.health -= projectile.damage;
		this.wasDamagedOnPreviousFrame = true;
		this.game.addParticles(this.x, this.y, "#ff0000", 12, 4);
		this.game.playSound("HIT_PLAYER");
	}
};

SpiderMan.prototype.stateImage = function() {
	var state = "STANDING";
	if (this.hasState("JUMP")) state = "JUMP";

	if (this.hasState("RUNNING")) {
		state = this.runningFrames[this.runningFrame];
		if (this.hasState("SHOOT")) state = this.runningShootingFrames[this.runningFrame];

		if (this.frame % 8 === 0) {
			this.runningFrame++;
			this.runningFrame %= (this.runningFrames.length - 1);
		}
		this.velocityX = this.runningDirection * this.runningSpeed;
	} else {
		this.velocityX = 0;
	}

	if (this.hasState("SHOOT")) {
		if (!this.hasState("RUNNING")) state = "SHOOT";
		var rate = (this.rageTimer > 0) ? 8 : 16;
		if (this.shootingFrame % rate === 0) {
			this.shoot(this.game.resources.SHOOT);
		}
		this.shootingFrame++;
	}

	var image = this.game.resources[state] || this.game.resources["STANDING"];
	this.stateImg = image;
	return image;
};

SpiderMan.prototype.keydown = function(keyCode) {
	if (this.keydowns.indexOf(keyCode) === -1) {
		this.keydowns.push(keyCode);
	}
};

SpiderMan.prototype.keyup = function(keyCode) {
	this.runningFrame = 0;
	if (keyCode == KEY.ARROW_RIGHT || keyCode == KEY.ARROW_LEFT) this.removeState("RUNNING");
	if (keyCode == KEY.SPACEBAR) { this.removeState("SHOOT"); this.shootingFrame = 0; }
	if (keyCode == KEY.W && this.isSwinging) {
		this.isSwinging = false;
		this.velocityX = Math.sin(this.swingAngle) * 14;
		this.velocityY = -6;
		this.addState("JUMP");
	}

	while (this.keydowns.indexOf(keyCode) > -1) {
		this.keydowns.splice(this.keydowns.indexOf(keyCode), 1);
	}
};

SpiderMan.prototype.shoot = function(img) {
	if (this.web <= 0 && this.rageTimer <= 0) return;

	this.game.playSound("WEB_SHOOT");

	var direction = this.runningDirection || 1;
	var self = this;

	var fireSingleWeb = function(angleOffsetY) {
		var web = new Projectile(self.game);
		web.name = "WEB";
		web.damage = (self.rageTimer > 0) ? 4 : 2;
		web.x = self.x + (img ? img.width * self.scale : 20) + 1;
		if (self.runningDirection == DIRECTION.LEFT) web.x = self.x - 1;
		web.y = self.y + (img ? img.height * self.scale / 2 : 20);

		web.update = function() {
			var renderX = this.x - this.game.cameraX;
			var renderY = this.y;

			if (self.rageTimer > 0) {
				this.ctx.fillStyle = "#ff0055";
				this.ctx.shadowBlur = 10;
				this.ctx.shadowColor = "#ff0055";
				this.ctx.fillRect(renderX, renderY, 18, 6);
			} else {
				this.ctx.drawImage(this.game.resources["WEB_PROJECTILE"], renderX, renderY - 10, 20, 20);
			}

			this.x += direction * 12;
			this.y += angleOffsetY;
			if (this.x - this.game.cameraX >= this.canvas.width || this.x <= 0) this.remove();
		};

		web.handleHitWithCharacter = function(character) {
			if (character.name != "SPIDER_MAN") return this.remove();
		};
		self.game.addProjectile(web);
	};

	if (this.rageTimer > 0) {
		fireSingleWeb(0);
		fireSingleWeb(-2.5);
		fireSingleWeb(2.5);
	} else {
		fireSingleWeb(0);
		this.web--;
	}

	this.game.addParticles(this.x + 20, this.y + 20, (this.rageTimer > 0) ? "#ff0055" : "#00f0ff", 4, 2);
};

SpiderMan.prototype.drawHealthbar = function() {
	var heart = { width: 24, height: 24 };
	for (var i = 0; i < this.health; i++) {
		var x = i * heart.width + 5 * (i + 1);
		var y = 8;
		this.ctx.drawImage(this.game.resources.HEART, x, y, heart.width, heart.height);
	}
};

SpiderMan.prototype.drawWebbar = function() {
	var img = this.game.resources.WEB_PROJECTILE;
	var string = "WEB: " + this.web;
	this.ctx.fillStyle = "#ffffff";
	this.ctx.font = "15px SpidermanGamePixelFont, Monospace, Arial";
	this.ctx.textAlign = "start";
	this.ctx.textBaseline = "top";

	var x = 10;
	var y = 38;
	if (img) {
		this.ctx.drawImage(img, x, y, 18, 18);
		this.ctx.fillText(string, x + 24, y + 2);
	}

	if (this.shieldTimer > 0) {
		var shieldWidth = (this.shieldTimer / 360) * 100;
		this.ctx.fillStyle = "rgba(0, 240, 255, 0.4)";
		this.ctx.fillRect(x, y + 24, 100, 6);
		this.ctx.fillStyle = "#00f0ff";
		this.ctx.fillRect(x, y + 24, shieldWidth, 6);
	}
};

SpiderMan.prototype.update = function() {
	var jumpIsDown = this.keyIsDown(KEY.ARROW_UP);
	var wIsDown = this.keyIsDown(KEY.W);

	// Web Swing Pendulum Physics Logic (W Key)
	if (wIsDown && !this.isSwinging && this.hasState("JUMP")) {
		this.isSwinging = true;
		this.swingAnchorX = this.x + 130;
		this.swingAnchorY = 20;
		this.swingRopeLength = Math.hypot(this.x - this.swingAnchorX, this.y - this.swingAnchorY);
		this.swingAngle = Math.atan2(this.x - this.swingAnchorX, this.y - this.swingAnchorY);
		this.swingAngularVelocity = 0.04;
		this.game.addFloatingText(this.x, this.y - 30, "🕸️ WEB SWING!", "#00f0ff", 18);
		this.game.playSound("SWING");
	}

	if (this.isSwinging) {
		var angularAccel = (-0.003) * Math.sin(this.swingAngle);
		this.swingAngularVelocity += angularAccel;
		this.swingAngularVelocity *= 0.991; // damping
		this.swingAngle += this.swingAngularVelocity;

		this.x = this.swingAnchorX + Math.sin(this.swingAngle) * this.swingRopeLength;
		this.y = this.swingAnchorY + Math.cos(this.swingAngle) * this.swingRopeLength;

		// Draw Tether Line
		var renderX = this.x - this.game.cameraX;
		var anchorRenderX = this.swingAnchorX - this.game.cameraX;
		this.ctx.save();
		this.ctx.strokeStyle = "#ffffff";
		this.ctx.shadowBlur = 8;
		this.ctx.shadowColor = "#00f0ff";
		this.ctx.lineWidth = 2.5;
		this.ctx.beginPath();
		this.ctx.moveTo(renderX + 15, this.y + 15);
		this.ctx.lineTo(anchorRenderX, this.swingAnchorY);
		this.ctx.stroke();
		this.ctx.restore();
	} else {
		// Normal Jump Input
		if (jumpIsDown && !this.jumpKeyPressedPrevious) {
			if (this.jumpsLeft > 0) {
				this.addState("JUMP");
				this.game.playSound("JUMP");
				if (this.jumpsLeft === 2) {
					this.velocityY = -12.5;
					this.game.addParticles(this.x + 15, this.y + 40, "#ffffff", 8, 3);
				} else if (this.jumpsLeft === 1) {
					this.velocityY = -11;
					this.game.addParticles(this.x + 15, this.y + 30, "#00f0ff", 14, 5);
				}
				this.jumpsLeft--;
			}
		}

		// Gravity
		this.velocityY += this.gravityForce;
		if (this.velocityY > this.maxFallSpeed) this.velocityY = this.maxFallSpeed;

		this.y += this.velocityY;
		this.x += this.velocityX;
	}
	this.jumpKeyPressedPrevious = jumpIsDown;

	if (this.keyIsDown(KEY.ARROW_RIGHT)) { this.addState("RUNNING"); this.runningDirection = DIRECTION.RIGHT; }
	if (this.keyIsDown(KEY.ARROW_LEFT)) { this.addState("RUNNING"); this.runningDirection = DIRECTION.LEFT; }
	if (this.keyIsDown(KEY.SPACEBAR)) { this.addState("SHOOT"); }

	if (this.y >= this.canvas.height || !this.health || (!this.web && this.rageTimer <= 0)) {
		this.game.gameover();
	}

	var img = this.stateImage();

	if (this.x - this.game.cameraX < 0) this.x = this.game.cameraX; 
	if (this.x - this.game.cameraX > 160) this.game.cameraX += this.velocityX;

	// Roof collisions
	var roofLeft = this.game.isRoofAtPoint(this.x - this.velocityX, this.y + img.height * this.scale + 1);
	var roofRight = this.game.isRoofAtPoint(this.x + img.width * this.scale - this.velocityX, this.y + img.height * this.scale + 1);

	if (roofLeft || roofRight) {
		var roof = roofLeft || roofRight;
		if (roof.y + this.velocityY <= this.y) {
			this.x -= this.velocityX;
			this.velocityX = 0;
		} else {
			this.y = this.canvas.height - roof.height - img.height * this.scale;
			this.velocityY = 0;
			this.removeState("JUMP");
			this.jumpsLeft = 2;
			this.isSwinging = false;
		}
	}

	var x = this.x - this.game.cameraX;
	var y = this.y;
	var width = img.width * this.scale;
	var height = img.height * this.scale;

	// Rage Mode Trail & Aura
	if (this.rageTimer > 0) {
		this.rageTimer--;
		this.game.addParticles(this.x + 10, this.y + 20, "#ff0055", 2, 2);
	}

	// Shield FX
	if (this.shieldTimer > 0) {
		this.shieldTimer--;
		this.ctx.save();
		this.ctx.shadowBlur = 15;
		this.ctx.shadowColor = "#00f0ff";
		this.ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
		this.ctx.lineWidth = 3;
		this.ctx.beginPath();
		this.ctx.arc(x + width / 2, y + height / 2, Math.max(width, height) / 1.3, 0, Math.PI * 2);
		this.ctx.stroke();
		this.ctx.restore();
	}

	this.ctx.save();
	if (this.runningDirection == DIRECTION.LEFT) {
		this.ctx.scale(-1, 1);
		x *= -1;
		x -= width;
	}
	this.ctx.drawImage(img, x, y, width, height);
	this.ctx.restore();

	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(255, 0, 0, 0.35)";
		this.ctx.fillRect(x, y, width, height);
	}

	this.drawHealthbar();
	this.drawWebbar();
	this.frame++;
};

function Projectile(game) {
	this.x = 0;
	this.y = 0;
	this.damage = 0;
	this.name = "UNKNOWN";
	this.canvas = game.canvas;
	this.ctx = game.ctx;
	this.game = game;
}
Projectile.prototype.update = function() {};
Projectile.prototype.remove = function() { this.game.removeProjectile(this); };
Projectile.prototype.handleHitWithCharacter = function() { this.remove(); };

function Roof(game, x, y) {
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;

	this.width = Math.round(Math.random() * (this.game.resources.BUILDING.width - 200)) + 200;
	this.height = Math.round(Math.random() * 50) + 100;
	this.fullWidth = this.width + 15;
	this.x = x || 0;
	this.y = this.canvas.height - this.height;

	var shouldSpawnEnemy = Math.round(Math.random() * 100) >= 30;
	if (shouldSpawnEnemy) {
		var enemy = new Enemy(this.game, { x: this.x + this.width / 2 });
		enemy.y = this.y - 1 - (enemy.stateImg ? enemy.stateImg.height * enemy.scale : 50);
		this.game.addEnemy(enemy);
		this.enemy = enemy;
	}

	var shouldSpawnDrone = Math.round(Math.random() * 100) >= 50;
	if (shouldSpawnDrone) {
		var drone = new FlyingDrone(this.game, { x: this.x + this.width + 40, y: Math.random() * 120 + 120 });
		this.game.addEnemy(drone);
		this.drone = drone;
	}

	var shouldSpawnItem = Math.round(Math.random() * 100) >= 35;
	if (shouldSpawnItem) {
		var types = ["SHIELD", "PIZZA", "COIN", "COIN", "COIN"];
		var selectedType = types[Math.floor(Math.random() * types.length)];
		var powerup = new PowerUp(this.game, {
			x: this.x + Math.random() * (this.width - 40) + 20,
			y: this.y - 45,
			type: selectedType
		});
		this.game.scene.powerups.push(powerup);
	}
}

Roof.prototype.update = function() {
	var renderX = this.x - this.game.cameraX;
	var roof = this.game.resources.BUILDING;

	if (roof) {
		this.ctx.drawImage(roof, 0, 0, this.width, this.height, renderX, this.y, this.width, this.height);
		this.ctx.drawImage(roof, this.width, 0, 15, 26, renderX + this.width, this.y, 15, 26);
	}

	if (renderX + this.width <= -200) {
		this.game.removeRoof(this);
		if (this.enemy) this.game.removeEnemy(this.enemy);
		if (this.drone) this.game.removeEnemy(this.drone);
	}
};

function Enemy(game, opts) {
	opts = opts || {};
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;
	this.health = opts.health || 4;
	this.maxHealth = opts.maxHealth || this.health;
	this.name = opts.name || "THUG";
	this.x = opts.x || this.canvas.width - 50;
	this.y = opts.y || 0;
	this.scale = 0.5;
	this.stateImg = this.game.resources[this.name];
	this.wasDamagedOnPreviousFrame = false;
	this.frame = 0;
}

Enemy.prototype.shoot = function() {
	var self = this;
	var knife = this.game.resources.KNIFE;
	var projectile = new Projectile(this.game);
	projectile.name = "KNIFE";
	projectile.damage = 1;
	projectile.x = this.x - (knife ? knife.width * this.scale / 2 : 10);
	projectile.y = this.y + (this.stateImg ? this.stateImg.height * this.scale / 2 : 20) - 5;
	projectile.update = function() {
		if (knife) this.ctx.drawImage(knife, this.x - this.game.cameraX, this.y, knife.width * self.scale / 2, knife.height * self.scale / 2);
		else { this.ctx.fillStyle = "red"; this.ctx.fillRect(this.x - this.game.cameraX, this.y, 10, 5); }
		this.x -= 5;
	};
	this.game.playSound("ENEMY_SHOOT");
	this.game.addProjectile(projectile);
};

Enemy.prototype.drawHealthbar = function() {
	var healthbar = { height: 5, width: 60, style: "red", borderWidth: 2, borderStyle: "black" };
	var x = this.x - this.game.cameraX;
	x -= healthbar.width / 2; 
	x += (this.stateImg ? this.stateImg.width * this.scale / 2 : 20); 

	var y      = this.y - 12;
	var width  = healthbar.width * this.health / this.maxHealth;
	var height = healthbar.height;

	this.ctx.fillStyle = healthbar.borderStyle;
	this.ctx.fillRect(x - healthbar.borderWidth, y - healthbar.borderWidth, healthbar.width + healthbar.borderWidth * 2, height + healthbar.borderWidth * 2);
	this.ctx.fillStyle = healthbar.style;
	this.ctx.fillRect(x, y, width, height);
};

Enemy.prototype.update = function() {
	var img = this.game.resources[this.name];
	this.stateImg = img;
	if (this.health <= 0) { this.remove(); return; }

	this.drawHealthbar();
	var x = this.x - this.game.cameraX;
	var y = this.y;
	var width = img ? img.width * this.scale : 40;
	var height = img ? img.height * this.scale : 60;

	this.ctx.save();
	this.ctx.scale(-1, 1);
	if (img) this.ctx.drawImage(img, (x + width) * -1, y, width, height);
	this.ctx.restore();

	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
		this.ctx.fillRect(x, y, width, height);
	}

	var isInScreen = this.x - this.game.cameraX <= this.canvas.width;
	if (this.frame % 140 === 0 && isInScreen) this.shoot();
	this.frame++;
};

Enemy.prototype.remove = function() {
	this.game.score++;
	this.game.spiderman.web += 3;
	this.game.spiderman.rageMeter = Math.min(100, this.game.spiderman.rageMeter + 15);
	this.game.registerKill(this.x, this.y);
	this.game.addParticles(this.x, this.y, "#ff3b40", 15, 5);
	this.game.playSound("ENEMY_DEFEAT");
	this.game.removeEnemy(this);	
};

Enemy.prototype.handleHitWithProjectile = function(projectile) {
	if (projectile.name == "WEB") {
		this.health -= projectile.damage;
		this.wasDamagedOnPreviousFrame = true;
		this.game.addParticles(this.x, this.y, "#00f0ff", 8, 3);
		this.game.playSound("HIT_ENEMY");
	}
};

// Flying Drone Class
function FlyingDrone(game, opts) {
	opts = opts || {};
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;
	this.x = opts.x || 0;
	this.y = opts.y || 150;
	this.health = 2;
	this.maxHealth = 2;
	this.name = "DRONE";
	this.scale = 0.5;
	this.hover = 0;
	this.frame = 0;
}

FlyingDrone.prototype.shoot = function() {
	var projectile = new Projectile(this.game);
	projectile.name = "LASER";
	projectile.damage = 1;
	projectile.x = this.x;
	projectile.y = this.y + 10;
	projectile.update = function() {
		var renderX = this.x - this.game.cameraX;
		this.ctx.fillStyle = "#ff0055";
		this.ctx.shadowBlur = 8;
		this.ctx.shadowColor = "#ff0055";
		this.ctx.fillRect(renderX, this.y, 14, 4);
		this.ctx.shadowBlur = 0;
		this.x -= 6;
	};
	this.game.playSound("ENEMY_SHOOT");
	this.game.addProjectile(projectile);
};

FlyingDrone.prototype.update = function() {
	if (this.health <= 0) { this.remove(); return; }
	this.hover += 0.05;
	var renderX = this.x - this.game.cameraX;
	var renderY = this.y + Math.sin(this.hover) * 12;

	this.ctx.save();
	this.ctx.shadowBlur = 10;
	this.ctx.shadowColor = "#ff0055";
	this.ctx.fillStyle = "#1e293b";
	this.ctx.strokeStyle = "#ff0055";
	this.ctx.lineWidth = 2;
	this.ctx.beginPath();
	this.ctx.arc(renderX, renderY, 15, 0, Math.PI * 2);
	this.ctx.fill();
	this.ctx.stroke();
	this.ctx.fillStyle = "#ff0055";
	this.ctx.beginPath();
	this.ctx.arc(renderX, renderY, 6, 0, Math.PI * 2);
	this.ctx.fill();
	this.ctx.restore();

	var isInScreen = renderX <= this.canvas.width;
	if (this.frame % 130 === 0 && isInScreen) this.shoot();
	this.frame++;
};

FlyingDrone.prototype.remove = function() {
	this.game.score += 2;
	this.game.spiderman.web += 5;
	this.game.spiderman.rageMeter = Math.min(100, this.game.spiderman.rageMeter + 15);
	this.game.registerKill(this.x, this.y);
	this.game.addParticles(this.x, this.y, "#ff0055", 16, 5);
	this.game.playSound("ENEMY_DEFEAT");
	this.game.removeEnemy(this);
};

FlyingDrone.prototype.handleHitWithProjectile = function(projectile) {
	if (projectile.name === "WEB") {
		this.health -= projectile.damage;
		this.game.addParticles(this.x, this.y, "#00f0ff", 8, 3);
		this.game.playSound("HIT_ENEMY");
	}
};

// Venom Boss Class
function VenomBoss(game, opts) {
	opts = opts || {};
	this.game = game;
	this.canvas = game.canvas;
	this.ctx = game.ctx;
	this.x = opts.x || 800;
	this.y = opts.y || 120;
	this.health = 15;
	this.maxHealth = 15;
	this.name = "VENOM";
	this.scale = 0.8;
	this.frame = 0;
	this.wasDamagedOnPreviousFrame = false;
}

VenomBoss.prototype.shoot = function() {
	var self = this;
	var projectile = new Projectile(this.game);
	projectile.name = "SYMBIOTE";
	projectile.damage = 1;
	projectile.x = this.x;
	projectile.y = this.y + 35;
	projectile.update = function() {
		var renderX = this.x - this.game.cameraX;
		this.ctx.fillStyle = "#a855f7";
		this.ctx.shadowBlur = 12;
		this.ctx.shadowColor = "#a855f7";
		this.ctx.beginPath();
		this.ctx.arc(renderX, this.y, 8, 0, Math.PI * 2);
		this.ctx.fill();
		this.ctx.shadowBlur = 0;
		this.x -= 6.5;
	};
	this.game.playSound("ENEMY_SHOOT");
	this.game.addProjectile(projectile);
};

VenomBoss.prototype.drawHealthbar = function() {
	var healthbar = { height: 8, width: 140, style: "#a855f7", borderWidth: 2, borderStyle: "#000" };
	var x = this.x - this.game.cameraX - healthbar.width / 2 + 25;
	var y = this.y - 20;
	var width = healthbar.width * this.health / this.maxHealth;

	this.ctx.fillStyle = healthbar.borderStyle;
	this.ctx.fillRect(x - healthbar.borderWidth, y - healthbar.borderWidth, healthbar.width + healthbar.borderWidth * 2, healthbar.height + healthbar.borderWidth * 2);
	this.ctx.fillStyle = healthbar.style;
	this.ctx.fillRect(x, y, width, healthbar.height);

	this.ctx.fillStyle = "#ffffff";
	this.ctx.font = "bold 12px Helvetica";
	this.ctx.textAlign = "center";
	this.ctx.fillText("VENOM BOSS", x + healthbar.width / 2, y - 4);
};

VenomBoss.prototype.update = function() {
	if (this.health <= 0) { this.remove(); return; }

	this.drawHealthbar();
	var renderX = this.x - this.game.cameraX;
	var renderY = this.y;

	// Render Custom Procedural Venom Boss Sprite
	this.ctx.save();
	this.ctx.shadowBlur = 15;
	this.ctx.shadowColor = "#a855f7";
	this.ctx.fillStyle = "#0f172a";
	this.ctx.strokeStyle = "#a855f7";
	this.ctx.lineWidth = 3;
	this.ctx.beginPath();
	this.ctx.arc(renderX + 25, renderY + 35, 30, 0, Math.PI * 2);
	this.ctx.fill();
	this.ctx.stroke();

	// Glowing Red Eyes
	this.ctx.fillStyle = "#ff0055";
	this.ctx.beginPath();
	this.ctx.arc(renderX + 15, renderY + 30, 5, 0, Math.PI * 2);
	this.ctx.arc(renderX + 32, renderY + 30, 5, 0, Math.PI * 2);
	this.ctx.fill();
	this.ctx.restore();

	if (this.wasDamagedOnPreviousFrame) {
		this.wasDamagedOnPreviousFrame = false;
		this.ctx.fillStyle = "rgba(168, 85, 247, 0.45)";
		this.ctx.fillRect(renderX - 5, renderY + 5, 60, 60);
	}

	var isInScreen = renderX <= this.canvas.width;
	if (this.frame % 85 === 0 && isInScreen) this.shoot();
	this.frame++;
};

VenomBoss.prototype.remove = function() {
	this.game.score += 100;
	this.game.slowmoTimer = 120; // Slowmo camera finish
	this.game.spiderman.health = this.game.spiderman.maxHealth;
	this.game.spiderman.web = 50;
	this.game.addParticles(this.x, this.y, "#a855f7", 35, 8);
	this.game.addFloatingText(this.x, this.y - 40, "☠️ VENOM DEFEATED! +100 PTS", "#a855f7", 26);
	this.game.bossActive = false;
	this.game.playSound("ENEMY_DEFEAT");
	this.game.removeEnemy(this);
};

VenomBoss.prototype.handleHitWithProjectile = function(projectile) {
	if (projectile.name === "WEB") {
		this.health -= projectile.damage;
		this.wasDamagedOnPreviousFrame = true;
		this.game.addParticles(this.x, this.y, "#a855f7", 10, 4);
		this.game.playSound("HIT_ENEMY");
	}
};

window.SpidermanGame = SpidermanGame;
window.Projectile    = Projectile;
window.SpiderMan     = SpiderMan;
window.Enemy         = Enemy;
window.FlyingDrone   = FlyingDrone;
window.VenomBoss     = VenomBoss;
window.PowerUp       = PowerUp;
window.Roof          = Roof;

})(window, document);