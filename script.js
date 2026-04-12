const taglines = [
  "What fun color do you want today?",
  "Want some color palette ideas?",
  "Pick a shade, make it yours!",
  "Let's brighten your design journey!",
  "Discover your perfect palette!"
];

document.getElementById("tagline").innerText =
  taglines[Math.floor(Math.random() * taglines.length)];

const colorPicker = new iro.ColorPicker("#color-picker", {
  width: 280,
  color: "#ffffff",
  layout: [
    { component: iro.ui.Box },
    { component: iro.ui.Slider, options: { sliderType: "hue" } }
  ]
});

const imageUpload = document.getElementById("imageUpload");
const imageCanvas = document.getElementById("imageCanvas");
const imagePickerEmpty = document.getElementById("imagePickerEmpty");
const imageContext = imageCanvas.getContext("2d", { willReadFrequently: true });

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

function normalizeColor(input) {
  try {
    return new iro.Color(input).hexString;
  } catch {
    return null;
  }
}

function getColorCount() {
  const input = document.getElementById("colorCount");
  const parsed = parseInt(input.value, 10) || 5;
  const clamped = Math.min(10, Math.max(2, parsed));
  input.value = clamped;
  return clamped;
}

function updateValues(color) {
  document.getElementById("values").innerHTML =
    "<strong>HEX:</strong> " + color.hexString + "<br>" +
    "<strong>RGB:</strong> " + color.rgbString + "<br>" +
    "<strong>HSL:</strong> " + color.hslString;
}

function shadeColor(color, percent) {
  const num = parseInt(color.slice(1), 16);
  const r = (num >> 16) + percent;
  const g = ((num >> 8) & 0x00FF) + percent;
  const b = (num & 0x0000FF) + percent;

  return "#" + (
    0x1000000 +
    (r < 255 ? (r < 0 ? 0 : r) : 255) * 0x10000 +
    (g < 255 ? (g < 0 ? 0 : g) : 255) * 0x100 +
    (b < 255 ? (b < 0 ? 0 : b) : 255)
  ).toString(16).slice(1);
}

function generateShades(baseColor) {
  const palette = document.getElementById("palette");
  const count = getColorCount();
  palette.innerHTML = "";

  for (let i = 0; i < count; i += 1) {
    const hex = shadeColor(baseColor, (i - Math.floor(count / 2)) * 20);
    const box = document.createElement("div");
    box.className = "color-box";
    box.style.background = hex;
    box.setAttribute("data-hex", hex);

    box.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(hex);
        showToast("Copied: " + hex);
      } catch {
        showToast("Clipboard copy failed");
      }
    });

    palette.appendChild(box);
  }
}

function setBaseColor(hex, toastMessage = null) {
  colorPicker.color.hexString = hex;
  document.getElementById("manualBaseColor").value = hex;
  updateValues(colorPicker.color);
  generateShades(hex);

  if (toastMessage) {
    showToast(toastMessage);
  }
}

function applyManualBaseColor() {
  const input = document.getElementById("manualBaseColor");
  const normalized = normalizeColor(input.value.trim());

  if (!normalized) {
    showToast("Enter a valid color");
    return;
  }

  setBaseColor(normalized, "Applied: " + normalized);
}

function randomColor() {
  return "#" + Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0");
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function loadImageToCanvas(src) {
  const image = new Image();

  image.onload = () => {
    const maxDimension = 360;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

    imageCanvas.width = Math.max(1, Math.round(image.width * scale));
    imageCanvas.height = Math.max(1, Math.round(image.height * scale));

    imageContext.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    imageContext.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);

    imagePickerEmpty.hidden = true;
    imageCanvas.hidden = false;
  };

  image.src = src;
}

function loadSavedPalettes() {
  const savedContainer = document.getElementById("savedPalettes");
  savedContainer.innerHTML = "";

  const saved = JSON.parse(localStorage.getItem("savedPalettes")) || [];

  if (saved.length === 0) {
    savedContainer.innerHTML = "<p>No palettes saved yet.</p>";
    return;
  }

  saved.forEach((palette, index) => {
    const entry = Array.isArray(palette)
      ? { name: `Palette ${index + 1}`, colors: palette }
      : palette;

    const wrapper = document.createElement("div");
    wrapper.className = "saved-palette";

    const title = document.createElement("h3");
    title.innerText = entry.name;

    const row = document.createElement("div");
    row.className = "palette";

    entry.colors.forEach((hex) => {
      const panel = document.createElement("div");
      panel.className = "color-panel";
      panel.style.background = hex;
      row.appendChild(panel);
    });

    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    const loadBtn = document.createElement("button");
    loadBtn.innerText = "Load";
    loadBtn.onclick = () => {
      localStorage.setItem("selectedPalette", JSON.stringify(entry.colors));
      localStorage.setItem("selectedColor", entry.colors[0] || "#ffffff");
      localStorage.setItem("colorCount", entry.colors.length || 5);
      showToast("Loaded: " + entry.name);
      window.location.href = "palette.html";
    };

    const editBtn = document.createElement("button");
    editBtn.innerText = "Edit";
    editBtn.onclick = () => {
      const newName = prompt("Enter a new name for this palette:", entry.name);
      if (newName && newName.trim() !== "") {
        entry.name = newName.trim();
        saved[index] = entry;
        localStorage.setItem("savedPalettes", JSON.stringify(saved));
        showToast("Renamed to: " + entry.name);
        loadSavedPalettes();
        populatePaletteSelect();
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = () => {
      saved.splice(index, 1);
      localStorage.setItem("savedPalettes", JSON.stringify(saved));
      showToast("Deleted: " + entry.name);
      loadSavedPalettes();
      populatePaletteSelect();
    };

    const exportBtn = document.createElement("button");
    exportBtn.innerText = "Export";
    exportBtn.className = "export-btn";
    exportBtn.onclick = () => {
      const dataStr = "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(entry));
      const downloadLink = document.createElement("a");
      downloadLink.href = dataStr;
      downloadLink.download = `${entry.name}.json`;
      downloadLink.click();
      showToast("Exported: " + entry.name);
    };

    btnGroup.appendChild(loadBtn);
    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteBtn);
    btnGroup.appendChild(exportBtn);

    wrapper.appendChild(title);
    wrapper.appendChild(row);
    wrapper.appendChild(btnGroup);
    savedContainer.appendChild(wrapper);
  });
}

let manualColors = [];

function renderManualColors() {
  const container = document.getElementById("manualColors");
  container.innerHTML = "";

  manualColors.forEach((hex) => {
    const panel = document.createElement("div");
    panel.className = "color-panel";
    panel.style.background = hex;

    const info = document.createElement("div");
    info.className = "color-info";
    info.innerText = hex;

    panel.appendChild(info);
    container.appendChild(panel);
  });
}

function luminance(r, g, b) {
  const adjusted = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return adjusted[0] * 0.2126 + adjusted[1] * 0.7152 + adjusted[2] * 0.0722;
}

function contrastRatio(hex1, hex2) {
  const rgb1 = new iro.Color(hex1).rgb;
  const rgb2 = new iro.Color(hex2).rgb;

  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

function buildContrastChecker(colors) {
  const checker = document.getElementById("contrastResults");
  checker.innerHTML = "";

  if (!colors || colors.length < 2) {
    checker.innerHTML = "<p>Add at least 2 colors.</p>";
    return;
  }

  const pairs = [];

  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      pairs.push({
        bg: colors[i],
        fg: colors[j],
        ratio: contrastRatio(colors[i], colors[j])
      });
    }
  }

  pairs.sort((a, b) => b.ratio - a.ratio);

  pairs.forEach((pair) => {
    const row = document.createElement("div");
    row.className = "contrast-big-row";

    const bgBox = document.createElement("div");
    bgBox.className = "big-box";
    bgBox.style.background = pair.bg;

    const plus = document.createElement("div");
    plus.className = "symbol";
    plus.innerText = "+";

    const fgBox = document.createElement("div");
    fgBox.className = "big-box";
    fgBox.style.background = pair.bg;
    fgBox.style.color = pair.fg;
    fgBox.innerHTML = "<span>Sample</span>";

    const equal = document.createElement("div");
    equal.className = "symbol";
    equal.innerText = "=";

    const result = document.createElement("div");
    result.className = "result";

    let label = "FAIL";
    if (pair.ratio >= 7) {
      label = "AAA PASS";
    } else if (pair.ratio >= 4.5) {
      label = "AA PASS";
    }

    result.innerHTML = `
      <div class="${pair.ratio >= 4.5 ? "pass" : "fail"}">${label}</div>
      <div class="ratio">(${pair.ratio.toFixed(2)}:1)</div>
    `;

    row.appendChild(bgBox);
    row.appendChild(plus);
    row.appendChild(fgBox);
    row.appendChild(equal);
    row.appendChild(result);
    checker.appendChild(row);
  });
}

function populatePaletteSelect() {
  const select = document.getElementById("paletteSelect");
  select.innerHTML = "";

  const saved = JSON.parse(localStorage.getItem("savedPalettes")) || [];

  if (saved.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.text = "No saved palettes";
    select.appendChild(option);
    return;
  }

  saved.forEach((entry, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = Array.isArray(entry) ? `Palette ${index + 1}` : entry.name;
    select.appendChild(option);
  });
}

document.getElementById("applyManualColor").addEventListener("click", applyManualBaseColor);
document.getElementById("manualBaseColor").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    applyManualBaseColor();
  }
});

imageUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    loadImageToCanvas(reader.result);
    showToast("Image ready. Click it to pick a color.");
  };
  reader.readAsDataURL(file);
});

imageCanvas.addEventListener("click", (event) => {
  const rect = imageCanvas.getBoundingClientRect();
  const scaleX = imageCanvas.width / rect.width;
  const scaleY = imageCanvas.height / rect.height;
  const x = Math.floor((event.clientX - rect.left) * scaleX);
  const y = Math.floor((event.clientY - rect.top) * scaleY);
  const pixel = imageContext.getImageData(x, y, 1, 1).data;
  const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

  setBaseColor(hex, "Picked from image: " + hex);
});

document.getElementById("colorCount").addEventListener("input", () => {
  generateShades(colorPicker.color.hexString);
});

document.getElementById("generateBtn").addEventListener("click", () => {
  const baseColor = colorPicker.color.hexString;
  const count = getColorCount();
  const palette = [baseColor];

  for (let i = 1; i < count; i += 1) {
    palette.push(randomColor());
  }

  localStorage.setItem("selectedPalette", JSON.stringify(palette));
  localStorage.setItem("selectedColor", baseColor);
  localStorage.setItem("colorCount", count);

  window.location.href = "palette.html";
});

document.getElementById("addColorBtn").addEventListener("click", () => {
  const raw = document.getElementById("manualColor").value.trim();
  const color = normalizeColor(raw);

  if (!color) {
    alert("Invalid color!");
    return;
  }

  manualColors.push(color);
  renderManualColors();

  if (manualColors.length >= 2) {
    buildContrastChecker(manualColors);
  }

  document.getElementById("manualColor").value = "";
});

document.getElementById("usePaletteBtn").addEventListener("click", () => {
  const index = document.getElementById("paletteSelect").value;
  const saved = JSON.parse(localStorage.getItem("savedPalettes")) || [];

  if (index === "" || !saved[index]) {
    return;
  }

  const entry = Array.isArray(saved[index])
    ? { name: `Palette ${Number(index) + 1}`, colors: saved[index] }
    : saved[index];

  manualColors = entry.colors.slice();
  renderManualColors();
  buildContrastChecker(manualColors);
  showToast("Using: " + entry.name);
});

document.getElementById("refreshBtn").addEventListener("click", () => {
  manualColors = [];
  renderManualColors();
  document.getElementById("contrastResults").innerHTML = "<p>Add colors to compare</p>";
  document.getElementById("manualColor").value = "";
});

updateValues(colorPicker.color);
generateShades(colorPicker.color.hexString);

colorPicker.on("color:change", (color) => {
  updateValues(color);
  generateShades(color.hexString);
});

window.addEventListener("DOMContentLoaded", () => {
  populatePaletteSelect();
  loadSavedPalettes();
  document.getElementById("contrastResults").innerHTML = "<p>Add colors to compare</p>";
});
