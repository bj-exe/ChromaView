const storedSelectedPalette = JSON.parse(localStorage.getItem("selectedPalette") || "null");
const baseColor = localStorage.getItem("selectedColor") || "#ffffff";
const count = Math.min(10, Math.max(2, parseInt(localStorage.getItem("colorCount"), 10) || 5));

let currentPalette = [];
let lockStates = [];

function randomColor() {
  return "#" + Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.innerText = message;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#4B2E83",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    zIndex: "9999"
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

function syncPaletteStorage() {
  localStorage.setItem("selectedPalette", JSON.stringify(currentPalette));
  localStorage.setItem("selectedColor", baseColor);
  localStorage.setItem("colorCount", String(currentPalette.length));
}

function initializePalette() {
  if (Array.isArray(storedSelectedPalette) && storedSelectedPalette.length > 0) {
    currentPalette = storedSelectedPalette.slice(0, count);
  } else {
    currentPalette = [];
  }

  while (currentPalette.length < count) {
    currentPalette.push(randomColor());
  }

  currentPalette[0] = baseColor;
  lockStates = currentPalette.map((_, index) => index === 0);
  syncPaletteStorage();
}

function clearComparison() {
  document.getElementById("comparisonDisplay").innerHTML = "";
}

function renderPalette(colors) {
  const paletteDisplay = document.getElementById("paletteDisplay");
  paletteDisplay.innerHTML = "";

  colors.forEach((hex, index) => {
    const panel = document.createElement("div");
    panel.className = "color-panel";
    if (index === 0) {
      panel.classList.add("base-color");
    }
    panel.style.background = hex;

    panel.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(hex);
        showToast("Copied: " + hex);
      } catch {
        showToast("Clipboard copy failed");
      }
    });

    const lockBtn = document.createElement("button");
    lockBtn.className = "lock-btn";

    if (index === 0) {
      lockBtn.classList.add("base-lock");
      lockBtn.innerText = "Base";
      lockBtn.type = "button";
      lockBtn.disabled = true;
    } else {
      if (lockStates[index]) {
        lockBtn.classList.add("is-locked");
      }
      lockBtn.innerText = lockStates[index] ? "Locked" : "Lock";
      lockBtn.type = "button";
      lockBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        lockStates[index] = !lockStates[index];
        renderPalette(currentPalette);
      });
    }

    const info = document.createElement("div");
    info.className = "color-info";
    info.innerHTML = `
      ${hex}
      <span class="color-role">${index === 0 ? "Base color" : `Color ${index + 1}`}</span>
    `;

    panel.appendChild(lockBtn);
    panel.appendChild(info);
    paletteDisplay.appendChild(panel);
  });
}

function regeneratePalette() {
  currentPalette = currentPalette.map((color, index) => {
    if (index === 0) {
      return baseColor;
    }

    return lockStates[index] ? color : randomColor();
  });

  renderPalette(currentPalette);
  clearComparison();
  syncPaletteStorage();
}

function simulateColorBlindness(hex, type) {
  const color = new iro.Color(hex).rgb;
  const { r, g, b } = color;

  if (type === "protanopia") {
    return `rgb(${0.567 * r + 0.433 * g}, ${0.558 * r + 0.442 * g}, ${0.242 * g + 0.758 * b})`;
  }

  if (type === "deuteranopia") {
    return `rgb(${0.625 * r + 0.375 * g}, ${0.7 * r + 0.3 * g}, ${0.3 * g + 0.7 * b})`;
  }

  if (type === "tritanopia") {
    return `rgb(${0.95 * r + 0.05 * g}, ${0.433 * g + 0.567 * b}, ${0.475 * g + 0.525 * b})`;
  }

  if (type === "achromatopsia") {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    return `rgb(${gray}, ${gray}, ${gray})`;
  }

  return hex;
}

function getTextColor(hex) {
  const color = new iro.Color(hex).rgb;
  const { r, g, b } = color;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000" : "#fff";
}

function renderComparison(original, simulated, type) {
  const container = document.getElementById("comparisonDisplay");
  container.innerHTML = "";

  original.forEach((color, index) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.borderRadius = "8px";
    wrapper.style.overflow = "hidden";
    wrapper.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    wrapper.style.flex = "1";

    const label = document.createElement("div");
    label.innerText = type.toUpperCase();
    label.style.fontSize = "12px";
    label.style.padding = "5px";
    label.style.background = "#eee";

    const top = document.createElement("div");
    top.style.height = "100px";
    top.style.background = color;
    top.style.display = "flex";
    top.style.alignItems = "center";
    top.style.justifyContent = "center";
    top.style.textShadow = "0 1px 3px rgba(0,0,0,0.4)";
    top.innerHTML = `<span style="color:${getTextColor(color)};font-size:12px;">Original</span>`;

    const bottom = document.createElement("div");
    bottom.style.height = "100px";
    bottom.style.background = simulated[index];
    bottom.style.display = "flex";
    bottom.style.alignItems = "center";
    bottom.style.justifyContent = "center";
    bottom.style.textShadow = "0 1px 3px rgba(0,0,0,0.4)";
    bottom.innerHTML = `<span style="color:${getTextColor(simulated[index])};font-size:12px;">Simulated</span>`;

    wrapper.appendChild(label);
    wrapper.appendChild(top);
    wrapper.appendChild(bottom);
    container.appendChild(wrapper);
  });
}

document.getElementById("copyPalette").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentPalette.join(", "));
    showToast("Copied HEX codes!");
  } catch {
    showToast("Clipboard copy failed");
  }
});

document.getElementById("savePalette").addEventListener("click", () => {
  const saved = JSON.parse(localStorage.getItem("savedPalettes")) || [];
  saved.push(currentPalette.slice());
  localStorage.setItem("savedPalettes", JSON.stringify(saved));
  showToast("Palette saved!");
});

document.getElementById("regenPalette").addEventListener("click", () => {
  regeneratePalette();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    regeneratePalette();
  }
});

const blindnessPanel = document.getElementById("blindnessPanel");

document.getElementById("blindnessBtn").addEventListener("click", () => {
  blindnessPanel.style.display = "block";
});

document.getElementById("cancelBlindness").addEventListener("click", () => {
  blindnessPanel.style.display = "none";
  clearComparison();
});

document.getElementById("applyBlindness").addEventListener("click", () => {
  const type = document.getElementById("blindnessType").value;
  const simulated = currentPalette.map((color) => simulateColorBlindness(color, type));
  renderComparison(currentPalette, simulated, type);
});

initializePalette();
renderPalette(currentPalette);
