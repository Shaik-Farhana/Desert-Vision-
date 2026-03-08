import {
  Blend,
  Box,
  Brain,
  ChevronDown,
  Cpu,
  Database,
  Download,
  Eye,
  Layers,
  Loader2,
  MapPin,
  Mountain,
  Truck,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

/* ──────────────────────────────────────────────
    DESIGN TOKENS (exact hex per spec)
────────────────────────────────────────────── */
const C = {
  bg: "#0F1419",
  card: "#1A2332",
  sandGold: "#D4A464",
  dustyBrown: "#8B5E3C",
  darkGreen: "#2D4A22",
  textPrimary: "#E8D5B0",
  textSecondary: "#9CA3AF",
  footerBg: "#0A0F14",
};

/* ──────────────────────────────────────────────
    SEGMENTATION CLASSES + MOCK DATA
────────────────────────────────────────────── */
const CLASSES = [
  { name: "Sky", color: "#87CEEB", pct: 18.2 },
  { name: "Landscape", color: "#DEB887", pct: 31.4 },
  { name: "Dry Grass", color: "#D2B48C", pct: 14.7 },
  { name: "Trees", color: "#228B22", pct: 9.3 },
  { name: "Dry Bushes", color: "#8B5A2B", pct: 11.8 },
  { name: "Rocks", color: "#C8C8C8", pct: 6.4 },
  { name: "Lush Bushes", color: "#00C800", pct: 4.1 },
  { name: "Ground Clutter", color: "#808080", pct: 2.8 },
  { name: "Logs", color: "#654321", pct: 0.9 },
  { name: "Flowers", color: "#FF69B4", pct: 0.4 },
];

/* ──────────────────────────────────────────────
    DUST PARTICLE DATA (deterministic seeds)
────────────────────────────────────────────── */
const DUST_PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 5) % 100}%`,
  bottom: `${(i * 23 + 8) % 55}%`,
  size: (i % 3) + 2,
  duration: `${6 + (i % 5) * 2}s`,
  delay: `${(i * 0.7) % 8}s`,
  opacity: 0.15 + (i % 4) * 0.1,
}));

/* ──────────────────────────────────────────────
    CANVAS MASK DRAWING
────────────────────────────────────────────── */
function drawMask(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  // Sky — top 18%
  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0, 0, W, H * 0.18);

  // Sky gradient fade
  const skyGrad = ctx.createLinearGradient(0, H * 0.13, 0, H * 0.22);
  skyGrad.addColorStop(0, "rgba(135,206,235,0)");
  skyGrad.addColorStop(1, "rgba(222,184,135,0.9)");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, H * 0.13, W, H * 0.1);

  // Landscape band — next 12%
  ctx.fillStyle = "#DEB887";
  ctx.fillRect(0, H * 0.18, W, H * 0.12);

  // Undulating landscape edge
  ctx.beginPath();
  ctx.fillStyle = "#DEB887";
  ctx.moveTo(0, H * 0.25);
  for (let x = 0; x <= W; x += 20) {
    const bump = Math.sin(x / 60) * 8 + Math.cos(x / 40) * 5;
    ctx.lineTo(x, H * 0.25 + bump);
  }
  ctx.lineTo(W, H * 0.32);
  ctx.lineTo(0, H * 0.32);
  ctx.closePath();
  ctx.fill();

  // Tree cluster left — dark green
  ctx.fillStyle = "#228B22";
  for (const [x, y, w, h] of [
    [0, H * 0.28, W * 0.15, H * 0.22],
    [W * 0.04, H * 0.26, W * 0.12, H * 0.24],
    [W * 0.02, H * 0.3, W * 0.18, H * 0.18],
  ]) {
    ctx.fillRect(x, y, w, h);
  }

  // Lush bushes center-left
  ctx.fillStyle = "#00C800";
  for (const [x, y, w, h] of [
    [W * 0.14, H * 0.32, W * 0.1, H * 0.08],
    [W * 0.18, H * 0.3, W * 0.08, H * 0.1],
    [W * 0.22, H * 0.33, W * 0.06, H * 0.07],
  ]) {
    ctx.fillRect(x, y, w, h);
  }

  // Dry grass band — 15%
  ctx.fillStyle = "#D2B48C";
  ctx.fillRect(0, H * 0.42, W, H * 0.15);

  // Dry bushes scattered
  const dryBushPositions = [
    [W * 0.28, H * 0.38],
    [W * 0.45, H * 0.4],
    [W * 0.6, H * 0.36],
    [W * 0.72, H * 0.41],
    [W * 0.85, H * 0.39],
    [W * 0.35, H * 0.44],
    [W * 0.52, H * 0.46],
  ];
  for (let i = 0; i < dryBushPositions.length; i++) {
    const [cx, cy] = dryBushPositions[i];
    ctx.beginPath();
    ctx.fillStyle = "#8B5A2B";
    ctx.ellipse(cx, cy, 18 + (i % 3) * 6, 12 + (i % 2) * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Small bush clusters
    ctx.beginPath();
    ctx.ellipse(cx + 15, cy - 6, 10, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground base — landscape/sandy
  ctx.fillStyle = "#DEB887";
  ctx.fillRect(0, H * 0.57, W, H * 0.43);

  // Rock formations
  const rockPositions = [
    [W * 0.08, H * 0.62, 40, 22],
    [W * 0.55, H * 0.65, 50, 28],
    [W * 0.75, H * 0.7, 35, 20],
    [W * 0.38, H * 0.72, 45, 25],
    [W * 0.88, H * 0.6, 30, 18],
  ];
  for (let i = 0; i < rockPositions.length; i++) {
    const [x, y, w, h] = rockPositions[i];
    ctx.beginPath();
    ctx.fillStyle = i % 2 === 0 ? "#C8C8C8" : "#AAAAAA";
    ctx.ellipse(x, y, w / 2, h / 2, -0.2 + i * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Shadow
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.ellipse(x + 4, y + 4, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ground clutter patches
  const clutterPos = [
    [W * 0.15, H * 0.75],
    [W * 0.42, H * 0.8],
    [W * 0.65, H * 0.76],
    [W * 0.82, H * 0.82],
  ];
  for (const [x, y] of clutterPos) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(x - 8, y - 4, 16, 8);
    ctx.fillRect(x + 6, y - 2, 10, 5);
  }

  // Log pieces near bottom
  ctx.fillStyle = "#654321";
  ctx.fillRect(W * 0.3, H * 0.85, 55, 10);
  ctx.fillRect(W * 0.68, H * 0.88, 40, 9);

  // Flower patches (tiny pink dots)
  const flowerPos = [
    [W * 0.25, H * 0.5],
    [W * 0.44, H * 0.48],
    [W * 0.7, H * 0.52],
  ];
  for (const [x, y] of flowerPos) {
    ctx.beginPath();
    ctx.fillStyle = "#FF69B4";
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 12, y + 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - 8, y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle vignette
  const vignette = ctx.createRadialGradient(
    W / 2,
    H / 2,
    W * 0.3,
    W / 2,
    H / 2,
    W * 0.8,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

/* ──────────────────────────────────────────────
    MAIN APP
────────────────────────────────────────────── */
export default function App() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeView, setActiveView] = useState<"original" | "mask" | "blend">(
    "original",
  );
  const [overlayOpacity, setOverlayOpacity] = useState(60);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  // Draw mask once on mount
  useEffect(() => {
    if (canvasRef.current) {
      drawMask(canvasRef.current);
    }
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.match(/image\/(jpeg|png)/)) return;
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setAnalysisComplete(false);
    setActiveView("original");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleAnalyze = useCallback(() => {
    if (!uploadedImage) return;
    setIsAnalyzing(true);

    // TODO: REPLACE WITH REAL API CALL
    // POST /predict with FormData image
    // Returns: { mask_url, overlay_url, class_percentages, miou }
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }, 2500);
  }, [uploadedImage]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "desertvision-segmentation-mask.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        backgroundColor: C.bg,
        color: C.textPrimary,
        fontFamily: '"General Sans", system-ui, sans-serif',
      }}
      className="min-h-screen"
    >
      {/* ═══════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════ */}
      <section
        data-ocid="hero.section"
        className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden"
        style={{ backgroundColor: C.bg }}
      >
        {/* Desert background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/assets/generated/desert-hero-bg.dim_1920x1080.jpg')`,
          }}
        />
        {/* Dark overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(15,20,25,0.72) 0%,
              rgba(15,20,25,0.45) 35%,
              rgba(15,20,25,0.55) 65%,
              rgba(15,20,25,0.92) 100%
            )`,
          }}
        />

        {/* Glowing horizon band */}
        <div
          className="absolute animate-horizon-breathe"
          style={{
            bottom: "28%",
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, transparent 0%, ${C.sandGold}66 20%, ${C.sandGold}CC 50%, ${C.sandGold}66 80%, transparent 100%)`,
          }}
        />
        <div
          className="absolute animate-horizon-breathe"
          style={{
            bottom: "28%",
            left: 0,
            right: 0,
            height: "80px",
            background: `linear-gradient(to top, ${C.dustyBrown}33 0%, transparent 100%)`,
          }}
        />

        {/* Ambient radial glow */}
        <div
          className="absolute animate-desert-pulse pointer-events-none"
          style={{
            bottom: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "300px",
            background: `radial-gradient(ellipse, ${C.sandGold}18 0%, transparent 70%)`,
          }}
        />

        {/* Dust particles */}
        {DUST_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none animate-dust-float"
            style={{
              left: p.left,
              bottom: p.bottom,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: C.sandGold,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border text-xs font-medium tracking-widest uppercase"
            style={{
              borderColor: `${C.sandGold}44`,
              backgroundColor: `${C.card}AA`,
              color: C.sandGold,
              backdropFilter: "blur(8px)",
            }}
          >
            <MapPin size={11} />
            Duality AI Elite Hackathon — Desert Terrain AI
          </motion.div>

          {/* App name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display font-black leading-none tracking-tight mb-5"
            style={{
              fontSize: "clamp(3rem, 9vw, 7rem)",
              background: `linear-gradient(135deg, ${C.sandGold} 0%, #C8956B 55%, #A0724A 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: '"Cabinet Grotesk", system-ui, sans-serif',
            }}
          >
            DesertVision AI
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.38 }}
            className="text-lg md:text-2xl font-light max-w-2xl leading-relaxed mb-4"
            style={{ color: C.textPrimary }}
          >
            Intelligent terrain understanding for autonomous ground vehicles
          </motion.p>

          {/* Sub-label */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="text-sm mb-10 tracking-wide"
            style={{ color: C.sandGold, opacity: 0.8 }}
          >
            Powered by{" "}
            <span style={{ color: C.sandGold }} className="font-semibold">
              Duality AI × Falcon Digital Twin Platform
            </span>
          </motion.p>

          {/* CTA */}
          <motion.button
            data-ocid="hero.primary_button"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${C.sandGold}55` }}
            whileTap={{ scale: 0.97 }}
            onClick={scrollToUpload}
            className="flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-base cursor-pointer transition-all duration-300"
            style={{
              backgroundColor: C.sandGold,
              color: C.bg,
              boxShadow: `0 0 20px ${C.sandGold}33`,
            }}
          >
            Start Analyzing
            <ChevronDown size={18} />
          </motion.button>

          {/* Stat chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4 mt-14"
          >
            {[
              { label: "Semantic Classes", value: "10" },
              { label: "Training Images", value: "2,857" },
              { label: "Architecture", value: "DeepLabV3+" },
              { label: "Encoder", value: "ResNet-50" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center px-5 py-3 rounded-xl border"
                style={{
                  borderColor: `${C.sandGold}22`,
                  backgroundColor: `${C.card}BB`,
                  backdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="font-bold text-lg"
                  style={{
                    color: C.sandGold,
                    fontFamily: '"Cabinet Grotesk", sans-serif',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-xs mt-0.5"
                  style={{ color: C.textSecondary }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: `${C.sandGold}88` }}
        >
          <span className="text-xs tracking-widest uppercase">
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 1.8,
              ease: "easeInOut",
            }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          UPLOAD & ANALYZE SECTION
      ═══════════════════════════════════════ */}
      <section
        data-ocid="upload.section"
        ref={uploadSectionRef}
        className="py-24 px-6"
        style={{ backgroundColor: C.bg }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="text-center mb-14"
          >
            <h2
              className="font-display font-bold text-3xl md:text-5xl mb-4"
              style={{
                color: C.textPrimary,
                fontFamily: '"Cabinet Grotesk", sans-serif',
              }}
            >
              Analyze Your Scene
            </h2>
            <p
              className="text-base md:text-lg max-w-xl mx-auto"
              style={{ color: C.textSecondary }}
            >
              Upload a desert environment image and let DesertVision AI segment
              the terrain into{" "}
              <span style={{ color: C.sandGold }}>10 semantic classes</span>.
            </p>
          </motion.div>

          <div
            className={`grid gap-8 ${imagePreview ? "md:grid-cols-2" : "md:grid-cols-1"}`}
          >
            {/* Drop zone */}
            <motion.div
              data-ocid="upload.dropzone"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="relative flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-300 min-h-[320px] border-2 border-dashed"
              style={{
                backgroundColor: isDragging ? `${C.dustyBrown}22` : C.card,
                borderColor: isDragging ? C.sandGold : `${C.sandGold}44`,
                boxShadow: isDragging ? `0 0 30px ${C.sandGold}33` : "none",
              }}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  e.target.files?.[0] && handleFileSelect(e.target.files[0])
                }
                aria-label="Upload desert image"
              />

              <div className="flex flex-col items-center gap-5 p-10 text-center">
                <div
                  className="w-20 h-20 flex items-center justify-center rounded-2xl border-2"
                  style={{
                    borderColor: `${C.sandGold}44`,
                    backgroundColor: `${C.sandGold}14`,
                  }}
                >
                  <Mountain size={38} style={{ color: C.sandGold }} />
                </div>
                <div>
                  <p
                    className="font-semibold text-base mb-1.5"
                    style={{ color: C.textPrimary }}
                  >
                    Drop your desert image here or click to browse
                  </p>
                  <p className="text-sm" style={{ color: C.textSecondary }}>
                    JPG, PNG — up to 10MB
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid="upload.button"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90"
                  style={{
                    backgroundColor: `${C.sandGold}22`,
                    color: C.sandGold,
                    border: `1px solid ${C.sandGold}44`,
                  }}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload size={15} />
                  Browse Files
                </button>
              </div>
            </motion.div>

            {/* Preview + analyze */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col gap-4"
                >
                  <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                      border: `1px solid ${C.sandGold}22`,
                      aspectRatio: "16/10",
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: `${C.sandGold}12`,
                      border: `1px solid ${C.sandGold}22`,
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: C.sandGold }}
                    />
                    <span
                      className="text-sm truncate"
                      style={{ color: C.textSecondary }}
                    >
                      {uploadedImage?.name}
                    </span>
                    <span
                      className="ml-auto text-xs"
                      style={{ color: C.textSecondary }}
                    >
                      {uploadedImage
                        ? `${(uploadedImage.size / 1024).toFixed(0)} KB`
                        : ""}
                    </span>
                  </div>

                  {/* Analyze button */}
                  {!analysisComplete && (
                    <motion.button
                      data-ocid="upload.submit_button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-70"
                      style={{
                        backgroundColor: C.sandGold,
                        color: C.bg,
                        boxShadow: `0 4px 20px ${C.sandGold}44`,
                      }}
                    >
                      {isAnalyzing ? (
                        <>
                          <div
                            data-ocid="upload.loading_state"
                            className="flex items-center gap-2"
                          >
                            <Loader2 size={18} className="animate-spin-slow" />
                            <span>Processing scene...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <Layers size={18} />
                          Analyze Scene
                        </>
                      )}
                    </motion.button>
                  )}

                  {analysisComplete && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{
                        backgroundColor: "#2D4A2244",
                        border: "1px solid #2D4A2288",
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <span className="text-sm font-medium text-green-400">
                        Scene analysis complete — scroll down to view results
                      </span>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          RESULTS PANEL
      ═══════════════════════════════════════ */}
      <AnimatePresence>
        {analysisComplete && (
          <motion.section
            data-ocid="results.section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="py-20 px-6"
            style={{ backgroundColor: `${C.card}55` }}
          >
            <div className="max-w-5xl mx-auto">
              <h2
                className="font-display font-bold text-3xl md:text-4xl mb-8 text-center"
                style={{
                  color: C.textPrimary,
                  fontFamily: '"Cabinet Grotesk", sans-serif',
                }}
              >
                Segmentation Results
              </h2>

              {/* View toggle tabs */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {[
                  {
                    key: "original" as const,
                    label: "Original",
                    icon: Eye,
                    ocid: "results.tab.1",
                  },
                  {
                    key: "mask" as const,
                    label: "Segmentation Mask",
                    icon: Layers,
                    ocid: "results.tab.2",
                  },
                  {
                    key: "blend" as const,
                    label: "Blended Overlay",
                    icon: Blend,
                    ocid: "results.tab.3",
                  },
                ].map(({ key, label, icon: Icon, ocid }) => (
                  <button
                    type="button"
                    key={key}
                    data-ocid={ocid}
                    onClick={() => setActiveView(key)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      backgroundColor:
                        activeView === key ? C.sandGold : `${C.card}AA`,
                      color: activeView === key ? C.bg : C.textSecondary,
                      border: `1px solid ${activeView === key ? C.sandGold : `${C.sandGold}33`}`,
                      boxShadow:
                        activeView === key
                          ? `0 2px 12px ${C.sandGold}44`
                          : "none",
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Display area */}
              <div
                data-ocid="results.panel"
                className="relative rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.sandGold}22`,
                  aspectRatio: "16/9",
                  minHeight: "320px",
                }}
              >
                {/* Original view */}
                {activeView === "original" && imagePreview && (
                  <motion.img
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={imagePreview}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Mask view */}
                {activeView === "mask" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="w-full h-full object-cover"
                      aria-label="Segmentation mask visualization"
                    />
                  </motion.div>
                )}

                {/* Blend view */}
                {activeView === "blend" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative w-full h-full"
                  >
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Original base"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={480}
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ opacity: overlayOpacity / 100 }}
                      aria-label="Segmentation overlay"
                    />
                  </motion.div>
                )}

                {/* View label badge */}
                <div
                  className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${C.bg}CC`,
                    color: C.sandGold,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {activeView === "original"
                    ? "Original Image"
                    : activeView === "mask"
                      ? "Segmentation Mask"
                      : "Blended Overlay"}
                </div>
              </div>

              {/* Opacity slider for blend */}
              <AnimatePresence>
                {activeView === "blend" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-5 flex items-center gap-4 px-4"
                  >
                    <span
                      className="text-sm whitespace-nowrap"
                      style={{ color: C.textSecondary }}
                    >
                      Overlay Opacity:{" "}
                      <span style={{ color: C.sandGold }}>
                        {overlayOpacity}%
                      </span>
                    </span>
                    <input
                      data-ocid="results.toggle"
                      type="range"
                      min={0}
                      max={100}
                      value={overlayOpacity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOverlayOpacity(Number(e.target.value))
                      }
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        accentColor: C.sandGold,
                        background: `linear-gradient(to right, ${C.sandGold} ${overlayOpacity}%, ${C.card} ${overlayOpacity}%)`,
                      }}
                      aria-label="Overlay opacity"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Download */}
              <div className="flex justify-end mt-6">
                <motion.button
                  data-ocid="results.download_button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    backgroundColor: `${C.sandGold}1A`,
                    color: C.sandGold,
                    border: `1px solid ${C.sandGold}44`,
                  }}
                >
                  <Download size={16} />
                  Download Segmentation Mask
                </motion.button>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          CLASS LEGEND + STATS
      ═══════════════════════════════════════ */}
      <section
        data-ocid="legend.section"
        className="py-20 px-6"
        style={{ backgroundColor: C.bg }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="font-display font-bold text-3xl md:text-4xl mb-3"
              style={{
                color: C.textPrimary,
                fontFamily: '"Cabinet Grotesk", sans-serif',
              }}
            >
              Scene Classification Results
            </h2>
            <p className="text-sm" style={{ color: C.textSecondary }}>
              {analysisComplete
                ? "Detected class distribution from semantic segmentation"
                : "Upload and analyze an image to see live class distributions"}
            </p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {CLASSES.map((cls, i) => (
              <motion.div
                key={cls.name}
                data-ocid={`legend.item.${i + 1}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="flex items-center gap-4 p-3.5 rounded-xl"
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.sandGold}11`,
                }}
              >
                {/* Color swatch */}
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: cls.color }}
                />
                {/* Class name */}
                <span
                  className="text-sm font-medium w-28 flex-shrink-0"
                  style={{ color: C.textPrimary }}
                >
                  {cls.name}
                </span>
                {/* Bar */}
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${C.bg}` }}
                >
                  <div
                    className="h-full rounded-full transition-all ease-out"
                    style={{
                      width: analysisComplete ? `${cls.pct}%` : "0%",
                      backgroundColor: cls.color,
                      transitionDuration: "800ms",
                      transitionDelay: `${i * 80}ms`,
                      boxShadow: `0 0 8px ${cls.color}66`,
                    }}
                  />
                </div>
                {/* Percentage */}
                <span
                  className="text-sm font-semibold w-12 text-right flex-shrink-0 tabular-nums"
                  style={{
                    color: analysisComplete ? C.textPrimary : C.textSecondary,
                  }}
                >
                  {cls.pct}%
                </span>
              </motion.div>
            ))}
          </div>

          {!analysisComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center text-sm"
              style={{ color: C.textSecondary }}
            >
              ↑ Upload a desert image above to see live segmentation percentages
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          MODEL INFO CARD
      ═══════════════════════════════════════ */}
      <section
        data-ocid="model.section"
        className="py-16 px-6"
        style={{ backgroundColor: `${C.card}55` }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="font-display font-bold text-2xl md:text-3xl mb-8 text-center"
              style={{
                color: C.textPrimary,
                fontFamily: '"Cabinet Grotesk", sans-serif',
              }}
            >
              Model Architecture
            </h2>

            <div
              data-ocid="model.card"
              className="rounded-2xl p-8"
              style={{
                backgroundColor: C.card,
                borderLeft: `3px solid ${C.sandGold}`,
                boxShadow: `0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px ${C.sandGold}11`,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Cpu,
                    label: "Architecture",
                    value: "DeepLabV3+ with ResNet-50 Encoder",
                  },
                  {
                    icon: Database,
                    label: "Training Data",
                    value:
                      "2,857 synthetic images — Duality AI Falcon Platform",
                  },
                  {
                    icon: MapPin,
                    label: "Validation Set",
                    value: "317 images from novel desert locations",
                  },
                  {
                    icon: Layers,
                    label: "Semantic Classes",
                    value: "10 categories (trees, rocks, sky, and more)",
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-4 items-start">
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${C.sandGold}18`,
                        border: `1px solid ${C.sandGold}33`,
                      }}
                    >
                      <Icon size={18} style={{ color: C.sandGold }} />
                    </div>
                    <div>
                      <p
                        className="text-xs font-medium tracking-wider uppercase mb-1"
                        style={{ color: C.textSecondary }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-sm font-medium"
                        style={{ color: C.textPrimary }}
                      >
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* mIoU Badge */}
              <div
                className="mt-8 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{ borderTop: `1px solid ${C.sandGold}22` }}
              >
                <div>
                  <p
                    className="text-xs font-medium tracking-wider uppercase mb-1"
                    style={{ color: C.textSecondary }}
                  >
                    Validation mIoU
                  </p>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-2xl font-bold"
                      style={{
                        color: C.sandGold,
                        fontFamily: '"Cabinet Grotesk", sans-serif',
                      }}
                    >
                      52.37%
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${C.sandGold}22`,
                        color: C.sandGold,
                        border: `1px solid ${C.sandGold}44`,
                      }}
                    >
                      mIoU Score
                    </span>
                  </div>
                </div>
                <p
                  className="text-xs max-w-xs"
                  style={{ color: C.textSecondary }}
                >
                  mIoU score will be updated after training completion.
                  Placeholder shown.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section
        data-ocid="howit.section"
        className="py-24 px-6"
        style={{ backgroundColor: C.bg }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2
              className="font-display font-bold text-3xl md:text-4xl mb-3"
              style={{
                color: C.textPrimary,
                fontFamily: '"Cabinet Grotesk", sans-serif',
              }}
            >
              How It Works
            </h2>
            <p style={{ color: C.textSecondary }} className="text-base">
              From synthetic data generation to real-world terrain intelligence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                ocid: "howit.card.1",
                icon: Box,
                title: "Digital Twin Data",
                desc: "Synthetic data from Duality AI's Falcon platform enables training without costly real-world field collection.",
                step: "01",
              },
              {
                ocid: "howit.card.2",
                icon: Brain,
                title: "Deep Learning",
                desc: "DeepLabV3+ with ResNet-50 encoder trained with class-weighted cross-entropy loss to handle rare terrain types.",
                step: "02",
              },
              {
                ocid: "howit.card.3",
                icon: Truck,
                title: "UGV Autonomy",
                desc: "Semantic scene understanding enables Unmanned Ground Vehicles to navigate safely in complex desert terrain.",
                step: "03",
              },
            ].map(({ ocid, icon: Icon, title, desc, step }, i) => (
              <motion.div
                key={title}
                data-ocid={ocid}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.13 }}
                whileHover={{
                  y: -6,
                  boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${C.sandGold}22`,
                }}
                className="relative rounded-xl p-7 flex flex-col gap-4 transition-shadow duration-300"
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${C.sandGold}22`,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                }}
              >
                {/* Step number */}
                <span
                  className="absolute top-5 right-6 text-4xl font-black opacity-10 select-none"
                  style={{
                    color: C.sandGold,
                    fontFamily: '"Cabinet Grotesk", sans-serif',
                  }}
                >
                  {step}
                </span>
                {/* Icon */}
                <div
                  className="w-12 h-12 flex items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${C.sandGold}18`,
                    border: `1px solid ${C.sandGold}33`,
                  }}
                >
                  <Icon size={22} style={{ color: C.sandGold }} />
                </div>
                <div>
                  <h3
                    className="font-bold text-lg mb-2"
                    style={{
                      color: C.textPrimary,
                      fontFamily: '"Cabinet Grotesk", sans-serif',
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: C.textSecondary }}
                  >
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer
        data-ocid="footer.section"
        className="py-12 px-6"
        style={{
          backgroundColor: C.footerBg,
          borderTop: `1px solid ${C.sandGold}33`,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left */}
            <div>
              <h3
                className="font-bold text-xl mb-1"
                style={{
                  color: C.sandGold,
                  fontFamily: '"Cabinet Grotesk", sans-serif',
                }}
              >
                DesertVision AI
              </h3>
              <p className="text-xs" style={{ color: C.textSecondary }}>
                Built for Duality AI Elite Hackathon
              </p>
            </div>

            {/* Center */}
            <div className="text-center">
              <p
                className="text-sm font-medium"
                style={{ color: C.textSecondary }}
              >
                Team DesertVision
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: `${C.textSecondary}88` }}
              >
                Powered by synthetic data from the Falcon Digital Twin Platform
              </p>
            </div>

            {/* Right */}
            <div className="text-right">
              <p className="text-xs" style={{ color: C.textSecondary }}>
                © {new Date().getFullYear()} Duality AI Falcon Platform
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: `${C.textSecondary}77` }}
              >
              </p>
            </div>
          </div>

          {/* Divider line */}
          <div
            className="mt-8 pt-6 text-center text-xs"
            style={{
              borderTop: `1px solid ${C.sandGold}18`,
              color: `${C.textSecondary}66`,
            }}
          >
            DeepLabV3+ · ResNet-50 · 10 Semantic Classes · 2,857 Synthetic
            Training Images
          </div>
        </div>
      </footer>
    </div>
  );
}
