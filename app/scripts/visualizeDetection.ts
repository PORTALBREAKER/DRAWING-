// VISUAL proof that the self-hosted face model + construction math genuinely
// work - not just console pass/fail text. This runs the exact model files
// this app ships, against a real photo, through the real buildFaceLandmarks/
// estimateProportionalPose code paths, and draws the real results directly
// onto a copy of the photo (bounding box, all 68 landmarks color-coded by
// feature, the synthesized face-oval loop, eye-line/center-line, and a
// proportional body stick figure) using a pure hand-rolled pixel-plotting
// routine + jpeg-js for encoding - no native canvas dependency, so it runs
// in this sandbox. Open the output file to see for yourself.
//
// Usage: npm run visualize -- /path/to/photo.jpg [/path/to/output.jpg]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
function defineGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
}
defineGlobal("window", dom.window);
defineGlobal("document", dom.window.document);
defineGlobal("navigator", dom.window.navigator);
defineGlobal("HTMLImageElement", dom.window.HTMLImageElement);
defineGlobal("HTMLCanvasElement", dom.window.HTMLCanvasElement);
defineGlobal("HTMLVideoElement", dom.window.HTMLVideoElement);
defineGlobal("ImageData", dom.window.ImageData);
(dom.window as unknown as { TextEncoder: unknown }).TextEncoder = globalThis.TextEncoder;
(dom.window as unknown as { TextDecoder: unknown }).TextDecoder = globalThis.TextDecoder;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, "..", "public", "models");

function serveModelsDir(): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const filePath = path.join(MODELS_DIR, decodeURIComponent(req.url ?? "").replace(/^\/+/, ""));
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200);
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

// ---- pure-JS pixel plotting on an RGBA buffer ----
type Canvas = { data: Uint8Array; width: number; height: number };

function setPx(c: Canvas, x: number, y: number, [r, g, b]: [number, number, number]) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= c.width || y >= c.height) return;
  const i = (y * c.width + x) * 4;
  c.data[i] = r;
  c.data[i + 1] = g;
  c.data[i + 2] = b;
  c.data[i + 3] = 255;
}

function dot(c: Canvas, x: number, y: number, color: [number, number, number], radius = 3) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) setPx(c, x + dx, y + dy, color);
    }
  }
}

function line(c: Canvas, x0: number, y0: number, x1: number, y1: number, color: [number, number, number], thickness = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    for (let t = -Math.floor(thickness / 2); t <= Math.floor(thickness / 2); t++) {
      setPx(c, x0 + t, y0, color);
      setPx(c, x0, y0 + t, color);
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function polyline(c: Canvas, points: { x: number; y: number }[], color: [number, number, number], closed = false, thickness = 2) {
  for (let i = 0; i < points.length - 1; i++) line(c, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, color, thickness);
  if (closed && points.length > 1) line(c, points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y, color, thickness);
}

function rect(c: Canvas, x: number, y: number, w: number, h: number, color: [number, number, number], thickness = 2) {
  polyline(c, [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }], color, true, thickness);
}

function check(label: string, pass: boolean) {
  console.log(`  [${pass ? "PASS" : "FAIL"}] ${label}`);
  if (!pass) process.exitCode = 1;
}

async function main() {
  const imagePath = process.argv[2];
  const outPath = process.argv[3] ?? path.join(path.dirname(imagePath ?? "."), `verified-${path.basename(imagePath ?? "out.jpg")}`);
  if (!imagePath) {
    console.error("Usage: npm run visualize -- /path/to/photo.jpg [/path/to/output.jpg]");
    process.exit(1);
  }

  const tf = await import("@tensorflow/tfjs");
  await import("@tensorflow/tfjs-backend-cpu");
  const jpegMod = await import("jpeg-js");
  const jpeg = (jpegMod as { default?: typeof jpegMod }).default ?? jpegMod;
  const faceapi = await import("../node_modules/@vladmandic/face-api/dist/face-api.esm.js");
  const { buildFaceLandmarks, estimateYaw, detectionArea } = await import("../src/lib/analysis/faceAnalyzer");
  const { estimateProportionalPose } = await import("../src/lib/analysis/proportionalPose");

  await tf.setBackend("cpu");
  await tf.ready();

  const server = await serveModelsDir();
  const { port } = server.address() as { port: number };
  await faceapi.nets.tinyFaceDetector.loadFromUri(`http://127.0.0.1:${port}`);
  await faceapi.nets.faceLandmark68Net.loadFromUri(`http://127.0.0.1:${port}`);

  const buf = fs.readFileSync(imagePath);
  const decoded = jpeg.decode(buf, { useTArray: true });
  const { width, height, data } = decoded;
  const rgb = new Int32Array(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i]; rgb[j + 1] = data[i + 1]; rgb[j + 2] = data[i + 2];
  }
  const tensor = tf.tensor3d(rgb, [height, width, 3], "int32");
  const results = await faceapi
    .detectAllFaces(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
    .withFaceLandmarks();
  tensor.dispose();
  server.close();

  console.log(`${imagePath}: ${width}x${height}, faces found: ${results.length}`);
  const canvas: Canvas = { data: new Uint8Array(data), width, height };

  if (results.length === 0) {
    console.log("No face found - writing the original photo unmodified so you can see why.");
    const out = jpeg.encode(canvas, 90);
    fs.writeFileSync(outPath, out.data);
    console.log("Wrote:", outPath);
    return;
  }

  const detections = results.map((r) => ({
    score: r.detection.score,
    box: { x: r.detection.box.x, y: r.detection.box.y, width: r.detection.box.width, height: r.detection.box.height },
    points: r.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
  }));

  for (const det of detections) {
    rect(canvas, det.box.x, det.box.y, det.box.width, det.box.height, [0, 255, 0], 2);

    const groups: [number, number, [number, number, number]][] = [
      [0, 17, [255, 255, 255]],   // jaw - white
      [17, 27, [255, 165, 0]],    // eyebrows - orange
      [27, 36, [255, 255, 0]],    // nose - yellow
      [36, 48, [0, 255, 255]],    // eyes - cyan
      [48, 68, [255, 0, 255]],    // mouth - magenta
    ];
    for (const [start, end, color] of groups) {
      for (let i = start; i < end; i++) dot(canvas, det.points[i].x, det.points[i].y, color, 3);
    }

    const face = buildFaceLandmarks(det, width, height);
    const yaw = estimateYaw(face);
    const denorm = (p: { x: number; y: number }) => ({ x: p.x * width, y: p.y * height });
    polyline(canvas, face.faceOval.map(denorm), [255, 0, 0], true, 2); // synthesized full head outline - red
    line(canvas, denorm(face.leftEyeCenter).x, denorm(face.leftEyeCenter).y, denorm(face.rightEyeCenter).x, denorm(face.rightEyeCenter).y, [0, 120, 255], 2);
    dot(canvas, denorm(face.foreheadTop).x, denorm(face.foreheadTop).y, [0, 255, 0], 5); // estimated forehead top

    console.log(`  face score=${det.score.toFixed(3)} yaw=${yaw.toFixed(2)} box=${Math.round(det.box.width)}x${Math.round(det.box.height)}`);
    check("faceOval closes into a 26-point loop", face.faceOval.length === 26);
    check("chin below foreheadTop", face.chin.y > face.foreheadTop.y);

    if (detectionArea(det) === Math.max(...detections.map(detectionArea))) {
      const pose = estimateProportionalPose(face, "realistic", "full-body");
      const dp = (p: { x: number; y: number }) => ({ x: p.x * width, y: p.y * height });
      const segs: [keyof typeof pose, keyof typeof pose][] = [
        ["leftShoulder", "rightShoulder"], ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"],
        ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"], ["leftShoulder", "leftHip"],
        ["rightShoulder", "rightHip"], ["leftHip", "rightHip"], ["leftHip", "leftKnee"], ["leftKnee", "leftAnkle"],
        ["rightHip", "rightKnee"], ["rightKnee", "rightAnkle"],
      ];
      for (const [a, b] of segs) {
        const pa = dp(pose[a] as { x: number; y: number });
        const pb = dp(pose[b] as { x: number; y: number });
        line(canvas, pa.x, pa.y, pb.x, pb.y, [50, 220, 50], 3);
      }
      console.log("  (lime stick figure = proportional body estimate anchored on this real detected face)");
    }
  }

  const out = jpeg.encode(canvas, 92);
  fs.writeFileSync(outPath, out.data);
  console.log("Wrote:", outPath);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
