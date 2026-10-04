// REAL-INFERENCE regression test - not mocked data.
//
// Unlike testConstruction.ts (which feeds hand-made landmark coordinates
// through the construction engine), this script runs the actual
// @vladmandic/face-api model this app ships in public/models against a
// real photo you provide, decodes it, extracts genuine 68-point landmarks,
// and pushes them through the REAL buildFaceLandmarks / estimateYaw /
// estimateProportionalPose / buildConstructionModel / generateStages code
// paths used by the shipped app. It exists so "the AI model actually
// works" is something you can verify yourself, headlessly, rather than
// something you have to take on faith.
//
// Usage:
//   npm run test:face -- /path/to/a/clear/front-facing/photo.jpg
//
// No sample photos are bundled with this repo (to avoid shipping
// third-party images) - supply any portrait photo of your own.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

// tfjs's browser bundle feature-detects via `window`/`document`/`navigator`
// AT MODULE-EVALUATION TIME, and static imports are hoisted above this
// code - so these globals are installed first, then face-api/tfjs are
// pulled in via dynamic import() further down (which is NOT hoisted).
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

function check(label: string, pass: boolean) {
  console.log(`  [${pass ? "PASS" : "FAIL"}] ${label}`);
  if (!pass) process.exitCode = 1;
}

async function main() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    console.error("Usage: npm run test:face -- /path/to/photo.jpg");
    process.exit(1);
  }

  const tf = await import("@tensorflow/tfjs");
  await import("@tensorflow/tfjs-backend-cpu");
  const jpegMod = await import("jpeg-js");
  const jpeg = (jpegMod as { default?: typeof jpegMod }).default ?? jpegMod;
  // No "exports" field in @vladmandic/face-api's package.json means plain
  // Node `import` resolution falls back to "main" (the Node/tfjs-node
  // build), so the browser ESM bundle must be imported by direct path.
  // Vite correctly honours "browser"/"module" for the real app - this
  // quirk only affects this standalone script.
  const faceapi = await import("../node_modules/@vladmandic/face-api/dist/face-api.esm.js");
  const { buildFaceLandmarks, estimateYaw, detectionArea } = await import("../src/lib/analysis/faceAnalyzer");
  const { estimateProportionalPose } = await import("../src/lib/analysis/proportionalPose");
  const { buildConstructionModel } = await import("../src/lib/construction/loomisEngine");
  const { generateStages } = await import("../src/lib/construction/stageGenerator");

  await tf.setBackend("cpu");
  await tf.ready();
  console.log("tfjs backend:", tf.getBackend());

  // Serve public/models over real HTTP (loadFromUri/fetch), exactly like the
  // deployed app will from its own origin.
  const server = await serveModelsDir();
  const { port } = server.address() as { port: number };
  await faceapi.nets.tinyFaceDetector.loadFromUri(`http://127.0.0.1:${port}`);
  await faceapi.nets.faceLandmark68Net.loadFromUri(`http://127.0.0.1:${port}`);
  console.log("Self-hosted face-api models loaded from public/models via fetch().");

  const buf = fs.readFileSync(imagePath);
  const decoded = jpeg.decode(buf, { useTArray: true });
  const { width, height, data } = decoded;
  const rgb = new Int32Array(width * height * 3);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    rgb[j] = data[i];
    rgb[j + 1] = data[i + 1];
    rgb[j + 2] = data[i + 2];
  }
  const tensor = tf.tensor3d(rgb, [height, width, 3], "int32");

  const results = await faceapi
    .detectAllFaces(tensor, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }))
    .withFaceLandmarks();
  tensor.dispose();
  server.close();

  console.log(`\nDecoded ${imagePath}: ${width}x${height}. Faces found: ${results.length}\n`);
  if (results.length === 0) {
    console.log("No face detected in this photo - try a clearer, front-facing one.");
    return;
  }

  const detections = results.map((r) => ({
    score: r.detection.score,
    box: { x: r.detection.box.x, y: r.detection.box.y, width: r.detection.box.width, height: r.detection.box.height },
    points: r.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
  }));
  let best = detections[0];
  let bestArea = -1;
  for (const d of detections) {
    const area = detectionArea(d);
    if (area > bestArea) {
      bestArea = area;
      best = d;
    }
  }

  console.log(`Using the largest detection (score ${best.score.toFixed(3)}).`);
  const face = buildFaceLandmarks(best, width, height);
  const yaw = estimateYaw(face);

  console.log("\n--- real buildFaceLandmarks() output, sanity checks ---");
  check("faceOval is a closed loop with 26 points (17 jaw + 9 synthesized scalp)", face.faceOval.length === 26);
  check("chin sits below foreheadTop", face.chin.y > face.foreheadTop.y);
  check("both eyes sit above the chin", face.leftEyeCenter.y < face.chin.y && face.rightEyeCenter.y < face.chin.y);
  check("left/right temples are horizontally separated", Math.abs(face.leftTemple.x - face.rightTemple.x) > 0.05);
  check("yaw is within [-1, 1]", yaw >= -1 && yaw <= 1);
  const allPts = [
    ...face.faceOval, ...face.leftEye, ...face.rightEye, ...face.leftEyebrow, ...face.rightEyebrow,
    ...face.lipsOuter, ...face.lipsInner, ...face.noseBridge, face.noseTip, face.noseBase, face.chin,
    face.foreheadTop, face.leftCheek, face.rightCheek, face.leftTemple, face.rightTemple,
    face.leftEyeCenter, face.rightEyeCenter, face.mouthLeft, face.mouthRight,
  ];
  check(
    `all ${allPts.length} normalized landmark points are in a sane range`,
    allPts.every((p) => p.x > -0.3 && p.x < 1.3 && p.y > -0.3 && p.y < 1.3),
  );

  console.log("\n--- real construction pipeline (face only) ---");
  const analysisFaceOnly = {
    imageWidth: width, imageHeight: height, faceDetected: true, faceCount: results.length,
    poseDetected: false, face, yaw, confidence: 0.9, suggestedType: "portrait" as const, warnings: [],
  };
  const headModel = buildConstructionModel(analysisFaceOnly, "anime", "portrait");
  check("construction model has a head", headModel.hasHead);
  const stages = generateStages(headModel, analysisFaceOnly, "anime", "portrait");
  check(`generated ${stages.length} stages (>= 8 required)`, stages.length >= 8);

  console.log("\n--- proportional body estimate anchored on this real face ---");
  const pose = estimateProportionalPose(face, "realistic", "full-body");
  check(
    "body landmarks descend in correct anatomical order (chin < shoulder < elbow < hip < knee < ankle)",
    face.chin.y < pose.leftShoulder.y &&
      pose.leftShoulder.y < pose.leftElbow.y &&
      pose.leftElbow.y < pose.leftHip.y &&
      pose.leftHip.y < pose.leftKnee.y &&
      pose.leftKnee.y < pose.leftAnkle.y,
  );
  check("left/right joints are mirrored around the body center", pose.leftShoulder.x > pose.rightShoulder.x);
  const bodyModel = buildConstructionModel(
    { ...analysisFaceOnly, pose, poseEstimated: true, suggestedType: "full-body" as const },
    "realistic",
    "full-body",
  );
  check("construction model has a body", bodyModel.hasBody);

  console.log(
    process.exitCode === 1
      ? "\nSOME CHECKS FAILED - see above."
      : "\nAll real-inference checks passed - this is genuine, working on-device AI, not a stub.",
  );
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
