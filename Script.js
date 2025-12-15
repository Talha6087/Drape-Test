let img = new Image();
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let refPoints = [];
let srcMat = null;

document.getElementById("imageInput").addEventListener("change", e => {
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        refPoints = [];
    };
    img.src = URL.createObjectURL(e.target.files[0]);
});

canvas.addEventListener("click", e => {
    if (refPoints.length >= 2) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));

    refPoints.push({x, y});

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.stroke();
});

function calculateDrape() {
    if (refPoints.length < 2) {
        alert("Select reference diameter using two clicks");
        return;
    }

    const refDia = parseFloat(document.getElementById("refDiameter").value);
    const diskDia = parseFloat(document.getElementById("diskDiameter").value);
    const fabricDia = parseFloat(document.getElementById("fabricDiameter").value);

    const pxRef = distance(refPoints[0], refPoints[1]);
    const pxToCm = refDia / pxRef;

    srcMat = cv.imread(canvas);

    let gray = new cv.Mat();
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5,5), 0);
    cv.threshold(gray, gray, 0, 255,
        cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(gray, contours, hierarchy,
        cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let maxAreaPx = 0;
    for (let i = 0; i < contours.size(); i++) {
        let area = cv.contourArea(contours.get(i));
        if (area > maxAreaPx) maxAreaPx = area;
    }

    const drapeAreaCm2 = maxAreaPx * pxToCm * pxToCm;

    const diskArea = Math.PI * Math.pow(diskDia / 2, 2);
    const fabricArea = Math.PI * Math.pow(fabricDia / 2, 2);

    const drapeCoeff =
        ((drapeAreaCm2 - diskArea) /
        (fabricArea - diskArea)) * 100;

    document.getElementById("actualArea").innerText =
        drapeAreaCm2.toFixed(2);

    document.getElementById("drapeCoefficient").innerText =
        drapeCoeff.toFixed(2) + " %";

    gray.delete();
    contours.delete();
    hierarchy.delete();
    srcMat.delete();
}

function distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function onOpenCvReady() {
    console.log("OpenCV loaded");
}
