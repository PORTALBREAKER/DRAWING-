import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import Button from "./Button";
import { getCroppedRotatedImage } from "../lib/imageUtils";

interface Props {
  dataUrl: string;
  onDone: (result: { dataUrl: string; width: number; height: number }) => void;
  onCancel: () => void;
}

export default function CropRotateEditor({ dataUrl, onDone, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => setArea(areaPixels), []);

  const apply = async () => {
    if (!area) return;
    setWorking(true);
    try {
      const result = await getCroppedRotatedImage(dataUrl, area, rotation);
      onDone(result);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[55vh] min-h-[280px] w-full overflow-hidden rounded-3xl bg-black/90">
        <Cropper
          image={dataUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={undefined}
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Zoom
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="touch-btn w-full accent-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Rotate ({rotation}°)
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="touch-btn w-full accent-accent"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setRotation((r) => (r - 90 + 360) % 360 || -90)}>
          ↺ Rotate -90°
        </Button>
        <Button variant="secondary" onClick={() => setRotation((r) => (r + 90) % 360)}>
          ↻ Rotate +90°
        </Button>
        <Button variant="secondary" onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}>
          Reset
        </Button>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={apply} disabled={working} className="flex-1">
          {working ? "Applying…" : "Apply Crop"}
        </Button>
      </div>
    </div>
  );
}
