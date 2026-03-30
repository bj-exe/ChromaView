const taglines = [
  "What fun color do you want today?",
  "Want some color palette ideas?",
  "Pick a shade, make it yours!",
  "Let’s brighten your design journey!",
  "Discover your perfect palette!"
];
document.getElementById("tagline").innerText =
  taglines[Math.floor(Math.random() * taglines.length)];

var colorPicker = new iro.ColorPicker("#color-picker", {
  width: 280,
  color: "#ffffff",
  layout: [
    { component: iro.ui.Box },
    { component: iro.ui.Slider, options: { sliderType: 'hue' } },
  ]
});

document.getElementById("values").innerHTML =
  "<strong>HEX:</strong> " + colorPicker.color.hexString + "<br>" +
  "<strong>RGB:</strong> " + colorPicker.color.rgbString + "<br>" +
  "<strong>HSL:</strong> " + colorPicker.color.hslString;

generateShades(colorPicker.color.hexString);

colorPicker.on('color:change', function(color) {
  document.getElementById("values").innerHTML =
    "<strong>HEX:</strong> " + color.hexString + "<br>" +
    "<strong>RGB:</strong> " + color.rgbString + "<br>" +
    "<strong>HSL:</strong> " + color.hslString;

  generateShades(color.hexString);
});

function generateShades(baseColor) {
  const palette = document.getElementById('palette');
  palette.innerHTML = '';

  const count = parseInt(document.getElementById("colorCount").value) || 5;

  for (let i = 0; i < count; i++) {
    const hex = shadeColor(baseColor, (i - Math.floor(count/2)) * 20);
    const box = document.createElement('div');
    box.className = 'color-box';
    box.style.background = hex;
    box.setAttribute("data-hex", hex);

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerText = "Copied!";
    box.appendChild(tooltip);

    box.addEventListener("click", () => {
      navigator.clipboard.writeText(hex).then(() => {
        tooltip.classList.add("show");
        setTimeout(() => tooltip.classList.remove("show"), 1000);
      });
    });

    palette.appendChild(box);
  }
}

function shadeColor(color, percent) {
  let num = parseInt(color.slice(1),16),
      r = (num >> 16) + percent,
      g = (num >> 8 & 0x00FF) + percent,
      b = (num & 0x0000FF) + percent;
  return "#" + (
    0x1000000 +
    (r<255? (r<0?0:r):255)*0x10000 +
    (g<255? (g<0?0:g):255)*0x100 +
    (b<255? (b<0?0:b):255)
  ).toString(16).slice(1);
}

document.getElementById("generateBtn").addEventListener("click", () => {
  localStorage.setItem("selectedColor", colorPicker.color.hexString);
  localStorage.setItem("colorCount", document.getElementById("colorCount").value);
  window.location.href = "palette.html";
});
