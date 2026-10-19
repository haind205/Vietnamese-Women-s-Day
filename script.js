const passcodeScreen = document.getElementById("passcodeScreen");
const giftScreen = document.getElementById("giftScreen");
const floatingStickers = document.getElementById("floatingStickers");
const fireworksCanvas = document.getElementById("fireworksCanvas");
const fireworksContext = fireworksCanvas.getContext("2d");
const dateDisplay = document.getElementById("dateDisplay");
const errorMessage = document.getElementById("errorMessage");
const surprise = document.getElementById("surprise");
const openGiftButton = document.getElementById("openGift");
let enteredDate = "";
let fireworksParticles = [];
let fireworksStarted = false;
let nextHeartBurst = 0;
let protectedTextRects = [];
let fireworksFrame = 0;
let fireworksTimer = 0;

function resizeFireworksCanvas() {
    // A lower canvas resolution reduces the amount of work per frame on HiDPI screens.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    fireworksCanvas.width = Math.round(window.innerWidth * pixelRatio);
    fireworksCanvas.height = Math.round(window.innerHeight * pixelRatio);
    fireworksContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function createHeartBurst(centerX, centerY, sizeFactor) {
    const scale = (4.7 + Math.random() * 1.5) * sizeFactor;
    const color = ["#fff6fb", "#ff4f9a", "#ffd166", "#ff9bc4"][Math.floor(Math.random() * 4)];
    const count = 30;

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const sin = Math.sin(angle);
        const heartX = 16 * sin * sin * sin;
        const heartY = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle) + 6;
        const jitter = 0.92 + Math.random() * 0.16;
        const maxLife = 60 + Math.random() * 25;

        fireworksParticles.push({
            x: centerX,
            y: centerY,
            vx: (heartX * scale * jitter) / count,
            vy: (-heartY * scale * jitter) / count,
            gravity: 0.012 + Math.random() * 0.012,
            life: maxLife,
            maxLife,
            size: 1.6 + Math.random() * 1.2,
            color
        });
    }
}

function chooseHeartBurstPositions(sizeFactor, count) {
    const maxScale = 6.2 * sizeFactor;
    const radiusX = (16 * maxScale * 2.8) + 16;
    const radiusY = (11 * maxScale * 2.8) + 16;
    const minX = Math.min(radiusX, window.innerWidth / 2);
    const maxX = Math.max(minX, window.innerWidth - radiusX);
    const minY = Math.min(radiusY, window.innerHeight / 2);
    const maxY = Math.max(minY, window.innerHeight - radiusY);
    protectedTextRects = [...giftScreen.querySelectorAll(".eyebrow, h1, .intro, .open-gift, .surprise h2, .surprise p")]
        .filter((element) => element.getClientRects().length)
        .map((element) => element.getBoundingClientRect());

    let bestPositions = [];
    for (const [textPadding, spacingFactor] of [[90, 1.7], [55, 1.45], [24, 1.2], [0, 1]]) {
        const positions = [];
        const minimumSpacing = Math.max(100, radiusX * spacingFactor);

        for (let attempt = 0; attempt < 500 && positions.length < count; attempt++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            const nearText = protectedTextRects.some((rect) =>
                x >= rect.left - textPadding && x <= rect.right + textPadding &&
                y >= rect.top - textPadding && y <= rect.bottom + textPadding
            );
            const nearAnotherBurst = positions.some((point) => Math.hypot(point.x - x, point.y - y) < minimumSpacing);

            if (!nearText && !nearAnotherBurst) positions.push({ x, y });
        }

        if (positions.length === count) return positions;
        if (positions.length > bestPositions.length) bestPositions = positions;
    }

    return bestPositions;
}

function animateHeartFireworks(time) {
    fireworksFrame = 0;
    if (fireworksCanvas.hidden || document.hidden) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    fireworksContext.clearRect(0, 0, width, height);
    fireworksContext.globalCompositeOperation = "lighter";
    if (time >= nextHeartBurst) {
        const sizeFactor = Math.min(1, window.innerWidth / 1400, window.innerHeight / 900);
        const heartPositions = chooseHeartBurstPositions(sizeFactor, 5);
        heartPositions.forEach(({ x, y }) => createHeartBurst(x, y, sizeFactor));
        nextHeartBurst = time + 2400 + Math.random() * 800;
    }

    fireworksParticles = fireworksParticles.filter((particle) => particle.life > 0);
    for (const particle of fireworksParticles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += particle.gravity;
        particle.vx *= 0.992;
        particle.life -= 1;
        const opacity = Math.min(1, particle.life / particle.maxLife * 1.5);

        fireworksContext.globalAlpha = opacity;
        fireworksContext.strokeStyle = particle.color;
        fireworksContext.lineWidth = particle.size;
        fireworksContext.shadowColor = particle.color;
        fireworksContext.shadowBlur = 1.5;
        fireworksContext.beginPath();
        fireworksContext.moveTo(particle.x, particle.y);
        fireworksContext.lineTo(particle.x - particle.vx * 2.5, particle.y - particle.vy * 2.5);
        fireworksContext.stroke();
    }

    protectedTextRects.forEach((rect) => {
        fireworksContext.clearRect(rect.left - 10, rect.top - 10, rect.width + 20, rect.height + 20);
    });

    fireworksContext.globalAlpha = 1;
    fireworksContext.shadowBlur = 0;
    fireworksContext.globalCompositeOperation = "source-over";
    if (fireworksParticles.length) {
        fireworksFrame = requestAnimationFrame(animateHeartFireworks);
    } else {
        const pause = Math.max(0, nextHeartBurst - performance.now());
        fireworksTimer = setTimeout(() => {
            fireworksTimer = 0;
            if (!document.hidden) fireworksFrame = requestAnimationFrame(animateHeartFireworks);
        }, pause);
    }
}

function startHeartFireworks() {
    if (fireworksStarted || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    fireworksStarted = true;
    fireworksCanvas.hidden = false;
    resizeFireworksCanvas();
    window.addEventListener("resize", resizeFireworksCanvas);
    fireworksFrame = requestAnimationFrame(animateHeartFireworks);
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (fireworksFrame) cancelAnimationFrame(fireworksFrame);
        if (fireworksTimer) clearTimeout(fireworksTimer);
        fireworksFrame = 0;
        fireworksTimer = 0;
    } else if (fireworksStarted && !fireworksCanvas.hidden && !fireworksFrame && !fireworksTimer) {
        fireworksFrame = requestAnimationFrame(animateHeartFireworks);
    }
});

function renderDate() {
    if (!enteredDate) {
        dateDisplay.textContent = "DD / MM / YYYY";
        return;
    }
    const day = enteredDate.slice(0, 2).padEnd(2, "_ ").trimEnd();
    const month = enteredDate.slice(2, 4).padEnd(2, "_ ").trimEnd();
    const year = enteredDate.slice(4, 8).padEnd(4, "_ ").trimEnd();
    dateDisplay.textContent = `${day} / ${month} / ${year}`;
}

function addDigit(digit) {
    if (enteredDate.length >= 8) return;
    enteredDate += digit;
    errorMessage.textContent = "";
    renderDate();
}

function submitDate() {
    if (enteredDate.length !== 8) {
        errorMessage.textContent = "Nhập đủ ngày, tháng và năm nhé!";
        return;
    }
    if (enteredDate !== "28122025") {
        errorMessage.textContent = "Chưa đúng mất rồi, thử lại nha 💭";
        enteredDate = "";
        renderDate();
        return;
    }
    passcodeScreen.hidden = true;
    giftScreen.hidden = false;
    floatingStickers.hidden = false;
    startHeartFireworks();
    giftScreen.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.querySelectorAll("[data-digit]").forEach((key) => {
    key.addEventListener("click", () => addDigit(key.dataset.digit));
});

document.getElementById("clearDate").addEventListener("click", () => {
    enteredDate = enteredDate.slice(0, -1);
    errorMessage.textContent = "";
    renderDate();
});
document.getElementById("submitDate").addEventListener("click", submitDate);
document.addEventListener("keydown", (event) => {
    if (passcodeScreen.hidden) return;
    if (/^\d$/.test(event.key)) addDigit(event.key);
    else if (event.key === "Backspace") {
        enteredDate = enteredDate.slice(0, -1);
        errorMessage.textContent = "";
        renderDate();
    } else if (event.key === "Enter") submitDate();
});

openGiftButton.addEventListener("click", () => {
    surprise.hidden = false;
    document.querySelector(".gift img").src = "images/Gift2.png";
    openGiftButton.textContent = "Món quà của em đây! 💗";
    openGiftButton.disabled = true;
});

renderDate();
