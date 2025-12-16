let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let img = new Image();
let clickPoints = [];
let pxToCm = null;
let binaryMat = null;

/* ===============================
   LOAD IMAGE
================================ */
document.getElementById("fileInput").onchange = e => {
img.onload = () => {
canvas.width = img.width;
canvas.height = img.height;
ctx.drawImage(img, 0, 0);
clickPoints = [];
pxToCm = null;
};
img.src = URL.createObjectURL(e.target.files[0]);
};

/* ===============================
   SCALE CALIBRATION (LIKE IMAGEJ)
================================ */
canvas.addEventListener("click", e => {
if (clickPoints.length >= 2) return;

const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;

const x = (e.clientX - rect.left) * scaleX;
const y = (e.clientY - rect.top) * scaleY;

clickPoints.push({x, y});

ctx.fillStyle = "red";
ctx.beginPath();
ctx.arc(x, y, 5, 0, Math.PI*2);
ctx.fill();
});

document.getElementById("setScale").onclick = () => {
if (clickPoints.length !== 2) {
alert("Click two opposite edges of the coin");
return;
}

const dx = clickPoints[0].x - clickPoints[1].x;
const dy = clickPoints[0].y - clickPoints[1].y;
const pixelDist = Math.sqrt(dx*dx + dy*dy);

const coinDiameterCm = 2.5; // change if needed
pxToCm = coinDiameterCm / pixelDist;

document.getElementById("scale").innerText =
pxToCm.toFixed(5) + " cm / px";
};

/* ===============================
   THRESHOLD (IMAGEJ-LIKE)
================================ */
document.getElementById("threshold").onclick = () => {
if (!cv || !cv.imread) {
alert("OpenCV not loaded yet");
return;
}

let src = cv.imread(canvas);
let gray = new cv.Mat();
let thresh = new cv.Mat();

cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
cv.threshold(
gray,
thresh,
0,
255,
cv.THRESH_BINARY + cv.THRESH_OTSU
);

cv.imshow(canvas, thresh);

binaryMat = thresh;

src.delete();
gray.delete();
};

/* ===============================
   AREA + DRAPE (IMAGEJ EXACT)
================================ */
document.getElementById("calculate").onclick = () => {
if (!binaryMat || !pxToCm) {
alert("Set scale and threshold first");
return;
}

let contours = new cv.MatVector();
let hierarchy = new cv.Mat();

cv.findContours(
binaryMat,
contours,
hierarchy,
cv.RETR_EXTERNAL,
cv.CHAIN_APPROX_SIMPLE
);

// largest contour = fabric projection
let maxArea = 0;
for (let i = 0; i < contours.size(); i++) {
const area = cv.contourArea(contours.get(i));
if (area > maxArea) maxArea = area;
}

const areaCm2 = maxArea * pxToCm * pxToCm;

// drape parameters
const diskD = 18;
const fabricD = 30;

const Ad = Math.PI * Math.pow(diskD/2, 2);
const Af = Math.PI * Math.pow(fabricD/2, 2);

let drape =
((areaCm2 - Ad) / (Af - Ad)) * 100;

drape = Math.max(0, Math.min(100, drape));

document.getElementById("area").innerText =
areaCm2.toFixed(2);

document.getElementById("drape").innerText =
drape.toFixed(2);

contours.delete();
hierarchy.delete();
};