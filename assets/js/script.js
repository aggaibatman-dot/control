/* ============================================
   TERMINAL BREACH — Cinematic Prank Engine
   ============================================ */
(function () {
    'use strict';

    /* ---- helpers ---- */
    const $ = (s) => document.querySelector(s);
    const rand = (a, b) => Math.random() * (b - a) + a;
    const randInt = (a, b) => Math.floor(rand(a, b + 1));

    /* ============================================
       AUDIO ENGINE  (Web Audio API — zero files)
       ============================================ */
    const Audio = (() => {
        let ctx, master, muted = false, ambientNodes = [];

        function boot() {
            if (ctx) return;
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain();
            master.gain.value = 0.35;
            master.connect(ctx.destination);
        }

        /* tiny noise burst */
        function noise(dur = 0.08, vol = 0.06) {
            if (muted || !ctx) return;
            const n = ctx.createBufferSource();
            const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * vol;
            n.buffer = buf;
            const g = ctx.createGain();
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            n.connect(g).connect(master);
            n.start(); n.stop(ctx.currentTime + dur);
        }

        /* key click */
        function click() {
            if (muted || !ctx) return;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'square';
            o.frequency.value = rand(900, 1500);
            g.gain.setValueAtTime(0.04, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            o.connect(g).connect(master);
            o.start(); o.stop(ctx.currentTime + 0.04);
        }

        /* bass impact */
        function impact() {
            if (muted || !ctx) return;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(80, ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
            g.gain.setValueAtTime(0.25, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            o.connect(g).connect(master);
            o.start(); o.stop(ctx.currentTime + 0.6);
            noise(0.15, 0.1);
        }

        /* rising tension */
        function tension(dur = 4) {
            if (muted || !ctx) return;
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(60, ctx.currentTime);
            o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + dur);
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass';
            f.frequency.setValueAtTime(100, ctx.currentTime);
            f.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + dur);
            g.gain.setValueAtTime(0.05, ctx.currentTime);
            g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + dur * 0.8);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            o.connect(f).connect(g).connect(master);
            o.start(); o.stop(ctx.currentTime + dur);
        }

        /* ambient drone */
        function startAmbient() {
            if (!ctx) return;
            const o1 = ctx.createOscillator();
            const o2 = ctx.createOscillator();
            const g = ctx.createGain();
            o1.type = 'sawtooth'; o1.frequency.value = 48;
            o2.type = 'sine'; o2.frequency.value = 60;
            const f = ctx.createBiquadFilter();
            f.type = 'lowpass'; f.frequency.value = 150;
            g.gain.value = 0.025;
            o1.connect(f); o2.connect(f);
            f.connect(g).connect(master);
            o1.start(); o2.start();
            ambientNodes = [o1, o2, g];
        }

        /* happy reveal jingle */
        function jingle() {
            if (muted || !ctx) return;
            [523, 659, 784, 1047, 1319].forEach((freq, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine';
                o.frequency.value = freq;
                const t = ctx.currentTime + i * 0.09;
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                o.connect(g).connect(master);
                o.start(t); o.stop(t + 0.35);
            });
        }

        function toggle() {
            boot();
            muted = !muted;
            if (ambientNodes.length) ambientNodes[2].gain.value = muted ? 0 : 0.025;
            return muted;
        }

        return { boot, click, noise, impact, tension, startAmbient, jingle, toggle, isMuted: () => muted };
    })();

    /* ============================================
       BINARY RAIN BACKGROUND
       ============================================ */
    const BinaryRain = (() => {
        let canvas, cx, cols, drops, running = false;
        const fontSize = 13;

        function init() {
            canvas = $('#bg-canvas');
            cx = canvas.getContext('2d');
            resize();
            window.addEventListener('resize', resize);
        }

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const c = Math.floor(canvas.width / fontSize);
            drops = new Array(c).fill(0).map(() => randInt(0, Math.floor(canvas.height / fontSize)));
            cols = c;
        }

        function draw() {
            cx.fillStyle = 'rgba(0,0,0,0.06)';
            cx.fillRect(0, 0, canvas.width, canvas.height);
            cx.font = fontSize + 'px monospace';
            for (let i = 0; i < cols; i++) {
                const ch = Math.random() > 0.5 ? '0' : '1';
                const bright = Math.random();
                cx.fillStyle = bright > 0.93 ? '#00ff66' : 'rgba(0,255,102,0.12)';
                cx.fillText(ch, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i] += 0.7;
            }
        }

        function start() { if (running) return; running = true; loop(); }
        function loop() { if (!running) return; draw(); requestAnimationFrame(loop); }
        function stop() { running = false; }

        return { init, start, stop };
    })();

    /* ============================================
       RED PARTICLE DRIFT
       ============================================ */
    const RedParticles = (() => {
        let canvas, cx, particles = [], running = false;

        function init() {
            canvas = $('#particle-canvas');
            cx = canvas.getContext('2d');
            resize();
            window.addEventListener('resize', resize);
            for (let i = 0; i < 30; i++) spawn();
        }

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        function spawn() {
            particles.push({
                x: rand(0, canvas.width),
                y: rand(0, canvas.height),
                r: rand(1, 2.5),
                vx: rand(-0.2, 0.2),
                vy: rand(-0.4, -0.1),
                a: rand(0.15, 0.4),
                life: rand(200, 500),
            });
        }

        function draw() {
            cx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy; p.life--;
                if (p.life <= 0 || p.y < -10) { particles[i] = null; spawn(); return; }
                cx.beginPath();
                cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                cx.fillStyle = `rgba(255,0,51,${p.a})`;
                cx.fill();
            });
            particles = particles.filter(Boolean);
        }

        function start() { if (running) return; running = true; loop(); }
        function loop() { if (!running) return; draw(); requestAnimationFrame(loop); }
        function stop() { running = false; }

        return { init, start, stop };
    })();

    /* ============================================
       MOUSE GLOW
       ============================================ */
    function initMouseGlow() {
        const glow = $('#mouse-glow');
        document.addEventListener('mousemove', (e) => {
            glow.style.left = e.clientX + 'px';
            glow.style.top = e.clientY + 'px';
        });
        document.addEventListener('touchstart', () => document.body.classList.add('touched'), { once: true });
    }

    /* ============================================
       GEOLOCATION (free API, no key needed)
       ============================================ */
    let geoCity = null;
    async function fetchGeo() {
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data && data.city) geoCity = data.city + ', ' + (data.country_name || data.country);
        } catch (e) { /* silent fail */ }
    }

    /* ============================================
       BLACKOUT FLASH
       ============================================ */
    function blackout(duration = 300) {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;inset:0;z-index:9995;background:#000;pointer-events:none;';
        document.body.appendChild(el);
        return new Promise(r => setTimeout(() => { el.remove(); r(); }, duration));
    }

    /* ============================================
       GLITCH + EFFECTS
       ============================================ */
    function glitch() {
        const el = $('#glitch-overlay');
        el.classList.remove('active');
        void el.offsetWidth;
        el.classList.add('active');
        Audio.noise(0.12, 0.08);
        setTimeout(() => el.classList.remove('active'), 350);
    }

    function redFlash() {
        const el = $('#red-flash');
        el.classList.remove('active');
        void el.offsetWidth;
        el.classList.add('active');
        setTimeout(() => el.classList.remove('active'), 450);
    }

    /* ============================================
       CONFETTI
       ============================================ */
    function confetti() {
        const canvas = $('#confetti-canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const cx = canvas.getContext('2d');
        const colors = ['#00ff66', '#ff0033', '#0066ff', '#ffcc00', '#ff66cc', '#66ffcc', '#ffffff'];
        const pieces = [];
        for (let i = 0; i < 220; i++) {
            pieces.push({
                x: canvas.width / 2 + rand(-120, 120),
                y: canvas.height / 2,
                vx: rand(-9, 9), vy: rand(-15, -5),
                w: rand(5, 11), h: rand(3, 7),
                color: colors[randInt(0, colors.length - 1)],
                rot: rand(0, 360), rv: rand(-12, 12),
                g: 0.28, life: 1,
            });
        }
        let frame = 0;
        function draw() {
            cx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            pieces.forEach(p => {
                p.x += p.vx; p.vy += p.g; p.y += p.vy;
                p.rot += p.rv; p.life -= 0.005;
                if (p.life <= 0) return;
                alive = true;
                cx.save();
                cx.translate(p.x, p.y);
                cx.rotate(p.rot * Math.PI / 180);
                cx.globalAlpha = Math.max(0, p.life);
                cx.fillStyle = p.color;
                cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                cx.restore();
            });
            frame++;
            if (alive && frame < 350) requestAnimationFrame(draw);
            else cx.clearRect(0, 0, canvas.width, canvas.height);
        }
        draw();
    }

    /* ============================================
       TYPING ENGINE
       ============================================ */
    function typeLine(container, text, cls = 'green', speed = 5, variance = 3) {
        return new Promise(resolve => {
            const line = document.createElement('div');
            line.className = `term-line ${cls}`;
            container.appendChild(line);

            const scrollToBottom = () => {
                container.scrollTop = container.scrollHeight;
            };

            requestAnimationFrame(() => {
                line.classList.add('visible');
                scrollToBottom();
            });

            const cursorSpan = document.createElement('span');
            cursorSpan.className = 'cursor';
            line.appendChild(cursorSpan);

            let i = 0;
            function tick() {
                if (i < text.length) {
                    line.insertBefore(document.createTextNode(text[i]), cursorSpan);
                    i++;
                    Audio.click();
                    scrollToBottom();
                    setTimeout(tick, speed + rand(-variance, variance));
                } else {
                    setTimeout(() => { cursorSpan.remove(); resolve(); }, 50);
                }
            }
            tick();
        });
    }

    /* show a line instantly (for file list etc.) */
    function flashLine(container, text, cls = 'file') {
        const line = document.createElement('div');
        line.className = `term-line ${cls} visible`;
        line.textContent = text;
        container.appendChild(line);
        container.scrollTop = container.scrollHeight;
    }

    /* small pause */
    function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

    /* ============================================
       MAIN SEQUENCE
       ============================================ */
    async function runSequence() {
        const terminal = $('#terminal');
        const lockScreen = $('#lock-screen');
        const revealScreen = $('#reveal-screen');
        const ringFill = $('#ring-fill');

        // Reset state
        terminal.innerHTML = '';
        terminal.classList.remove('zoom-in');
        lockScreen.classList.remove('active');
        revealScreen.classList.remove('active');
        ringFill.style.strokeDashoffset = '408';

        // Start background effects
        BinaryRain.start();
        RedParticles.start();
        Audio.boot();
        Audio.startAmbient();
        fetchGeo(); // start geo lookup in background

        await wait(100);

        /* -------- Phase 1: Terminal typing (fast ~2s) -------- */
        await typeLine(terminal, '> Initializing remote session...', 'green');
        await wait(40);
        await typeLine(terminal, '> Establishing encrypted tunnel...', 'green');
        await wait(30);

        glitch();
        await wait(60);

        await typeLine(terminal, '> Accessing target device...', 'green');
        await wait(30);

        const fakeIP = `${randInt(10, 200)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
        await typeLine(terminal, `> Device IP detected: ${fakeIP}`, 'green');
        await wait(40);

        await typeLine(terminal, '> Bypassing firewall...', 'green');
        await wait(30);
        await typeLine(terminal, '> Injecting payload...', 'green');
        await wait(50);

        /* ---- Red warning ---- */
        glitch();
        Audio.impact();
        redFlash();
        await wait(40);
        await typeLine(terminal, '> WARNING: Unauthorized access detected', 'red');
        await wait(60);

        /* ---- Continued breach ---- */
        await typeLine(terminal, '> Gaining administrative privileges...', 'green');
        await wait(30);
        await typeLine(terminal, '> System control granted.', 'green');
        await wait(30);

        glitch();
        await wait(50);

        await typeLine(terminal, '> Syncing connected devices...', 'green');
        await wait(30);

        // Show real location if available
        if (geoCity) {
            await typeLine(terminal, `> Accessing your location... [${geoCity}]`, 'red');
            await wait(50);
        } else {
            await typeLine(terminal, '> Accessing your location...', 'green');
            await wait(50);
        }

        await typeLine(terminal, '> Accessing camera feed...', 'green');
        await wait(30);
        await typeLine(terminal, '> Extracting private files...', 'green');
        await wait(50);

        /* ---- Fake file scroll ---- */
        const files = [
            '  📄 gallery_backup.zip       — 847.3 MB',
            '  📄 chats_export.db          — 124.6 MB',
            '  📄 passwords.txt            — 2.1 KB',
            '  📄 contacts_full.vcf        — 56.9 KB',
        ];
        for (const f of files) {
            flashLine(terminal, f, 'file');
            Audio.click();
            await wait(60);
        }

        await wait(80);

        /* ---- Final red dramatic ---- */
        glitch(); glitch();
        Audio.impact();
        redFlash();
        await wait(60);
        await typeLine(terminal, '> SYSTEM LOCK SEQUENCE INITIATED', 'red');
        await wait(120);

        /* -------- Phase 2: PANIC -------- */
        terminal.classList.add('zoom-in');
        Audio.tension(6);

        glitch(); await wait(150);
        glitch(); await wait(150);
        redFlash();
        Audio.impact();

        // Blackout flash for extra drama
        await blackout(250);

        await wait(200);

        // Show lock screen
        lockScreen.classList.add('active');
        Audio.impact();

        // Animate progress ring
        const circumference = 408;
        let progress = 0;
        const ringInterval = setInterval(() => {
            progress += 2;
            if (progress > 100) progress = 100;
            ringFill.style.strokeDashoffset = String(circumference - (circumference * progress / 100));
            if (progress >= 100) clearInterval(ringInterval);
        }, 80);

        // Periodic glitches during panic
        const panicGlitch = setInterval(() => { glitch(); Audio.noise(); }, 1500);

        /* -------- Wait for panic duration (8–10s) -------- */
        await wait(9000);

        clearInterval(panicGlitch);

        /* -------- Phase 3: REVEAL -------- */
        glitch();
        await wait(400);

        lockScreen.classList.remove('active');
        terminal.classList.remove('zoom-in');
        BinaryRain.stop();
        RedParticles.stop();

        await wait(300);

        revealScreen.classList.add('active');
        confetti();
        Audio.jingle();

        // Delay "Run Again" button appearance
        const restartBtn = $('#restart-btn');
        restartBtn.style.opacity = '0';
        restartBtn.style.pointerEvents = 'none';
        setTimeout(() => {
            restartBtn.style.transition = 'opacity 1s ease';
            restartBtn.style.opacity = '1';
            restartBtn.style.pointerEvents = 'auto';
        }, 3000);
    }

    /* ============================================
       INIT
       ============================================ */
    function init() {
        BinaryRain.init();
        RedParticles.init();
        initMouseGlow();

        // Restart
        $('#restart-btn').addEventListener('click', () => {
            $('#reveal-screen').classList.remove('active');
            const confettiCanvas = $('#confetti-canvas');
            confettiCanvas.getContext('2d').clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            runSequence();
        });

        // Enable audio on first interaction (mobile-safe)
        const unlockAudio = () => {
            Audio.boot();
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        };
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);

        // Random glitch flicker
        setInterval(() => glitch(), rand(5000, 9000));

        // Start the show
        runSequence();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
