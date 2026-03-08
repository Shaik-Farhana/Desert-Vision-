# 🏜️ DesertVision AI — Offroad Semantic Scene Segmentation

> **Duality AI Elite Hackathon 2026** — Desert Terrain AI Track

[![Live Demo](https://img.shields.io/badge/Live%20Demo-desertvision.netlify.app-D4A464?style=for-the-badge)](https://desertvision.netlify.app)
[![mIoU](https://img.shields.io/badge/mIoU-52.37%25-2D4A22?style=for-the-badge)](https://desertvision.netlify.app)
[![Pixel Accuracy](https://img.shields.io/badge/Pixel%20Accuracy-81.35%25-1A2332?style=for-the-badge)](https://desertvision.netlify.app)

---

## 📌 Overview

DesertVision AI is a semantic scene segmentation system designed for autonomous ground vehicles (UGVs) operating in desert environments. Trained entirely on **synthetic data** from Duality AI's Falcon Digital Twin Platform, the model achieves strong generalization to **unseen desert locations** — demonstrating the power of simulation-to-real transfer learning.

The model classifies every pixel in a scene into **10 terrain categories**, enabling UGVs to understand and navigate complex off-road environments safely.

---

## 🎯 Results

| Metric | Score |
|--------|-------|
| **Best mIoU** | **52.37%** |
| **Pixel Accuracy** | **81.35%** |
| **Test Images** | 1,002 unseen images |
| **Training Epochs** | 40 |

### Per-Class IoU

| Class | IoU |
|-------|-----|
| 🌤️ Sky | 97.4% |
| 🌳 Trees | 78.9% |
| 🌿 Lush Bushes | 65.0% |
| 🌾 Dry Grass | 64.1% |
| 🌸 Flowers | 55.4% |
| 🏔️ Landscape | 53.7% |
| 🪨 Dry Bushes | 35.0% |
| 🪵 Ground Clutter | 32.9% |
| 💎 Rocks | 29.9% |
| 🪵 Logs | 11.3% |

---

## 🏗️ Architecture

```
Input Image (512×512)
        ↓
ResNet-50 Encoder (ImageNet pretrained)
        ↓
ASPP Module (Atrous Spatial Pyramid Pooling)
        ↓
DeepLabV3+ Decoder
        ↓
10-Class Segmentation Mask
```

- **Model:** DeepLabV3+ (`segmentation_models_pytorch`)
- **Encoder:** ResNet-50 with ImageNet weights
- **Loss:** CrossEntropyLoss with class weights (handles severe imbalance)
- **Optimizer:** AdamW (lr=3e-4, weight_decay=1e-4)
- **Scheduler:** CosineAnnealingLR (T_max=40, eta_min=1e-6)
- **Batch Size:** 8 | **Image Size:** 512×512 | **Epochs:** 40
- **GPU:** Kaggle T4 (16GB VRAM)

---

## 📦 Dataset

Download from the official Duality AI Falcon Platform:

🔗 **https://falcon.duality.ai/secure/documentation/hackathon-segmentation-desert**

| Split | Images |
|-------|--------|
| Train | 2,857 |
| Validation | 317 |
| Test | 1,002 |

### Class Mapping

| ID | Class |
|----|-------|
| 100 | Trees |
| 200 | Lush Bushes |
| 300 | Dry Grass |
| 500 | Dry Bushes |
| 550 | Ground Clutter |
| 600 | Flowers |
| 700 | Logs |
| 800 | Rocks |
| 7100 | Landscape |
| 10000 | Sky |

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/Shaik-Farhana/Desert-Vision-.git
cd Desert-Vision-
```

### 2. Install dependencies
```bash
pip install torch torchvision segmentation-models-pytorch albumentations opencv-python matplotlib tqdm
```

### 3. Download the dataset
Download from the Falcon Platform link above and place it at:
```
data/
├── train/
│   ├── Color_Images/
│   └── Segmentation/
├── val/
│   ├── Color_Images/
│   └── Segmentation/
└── testImages/
    └── Color_Images/
```

### 4. Download model weights
🔗 **[https://drive.google.com/file/d/1-mFP2126QX2YD-vZc7dGCH0HFyn-XZlo/view?usp=sharing](#)** 

Place it at: `runs/exp1/best_model.pth`

### 5. Train
```bash
python train.py
```

### 6. Test on unseen images
```bash
python test.py
```

Outputs saved to `runs/exp1/test_output/`:
- `masks/` — raw segmentation masks
- `overlays/` — color-coded overlays on original images

---

## 📊 Training Curves

![Training Results](runs/exp1/training_curves.png)

- Loss steadily decreases across 40 epochs with no overfitting
- Val mIoU climbs from ~40% → 52.37%, peaking at epoch 38

---

## 🔍 Failure Analysis

**Strongest classes:** Sky (97.4%), Trees (78.9%) — visually distinct, high pixel frequency

**Weakest class:** Logs (11.3%) — severely underrepresented, frequent occlusion by other vegetation, visually similar to rocks/ground clutter

**Confusion patterns:** Landscape ↔ Dry Bushes, Rocks ↔ Ground Clutter — expected given similar sandy desert textures

**Future improvements:**
- Targeted augmentation for rare classes (Logs, Flowers)
- Domain adaptation techniques
- Larger backbone (ResNet-101 or EfficientNet)
- Self-supervised pre-training on additional desert imagery

---

## 🌐 Live Demo

**https://desertvision.netlify.app**

Built with React + TypeScript + Vite + Framer Motion. Shows model architecture, per-class statistics, and interactive segmentation visualization.

---

## 📁 Repository Structure

```
Desert-Vision-/
├── train.py                    # Training script
├── test.py                     # Inference on test images
├── README.md
├── runs/
│   └── exp1/
│       ├── best_model.pth      # ← Download from Google Drive
│       ├── results.json        # Final metrics
│       ├── training_curves.png
│       ├── per_class_iou.png
│       ├── confusion_matrix.png
│       └── test_output/
│           ├── masks/          # 1,002 segmentation masks
│           └── overlays/       # 1,002 color overlays
└── src/
    └── frontend/               # React web demo
```

---

## 👥 Team

**Team DesertVision** — Duality AI Elite Hackathon 2026

---

## 🙏 Acknowledgements

- [Duality AI](https://duality.ai) — Falcon Digital Twin Platform & dataset
- [segmentation_models_pytorch](https://github.com/qubvel/segmentation_models.pytorch) — DeepLabV3+ implementation
- [Kaggle](https://kaggle.com) — T4 GPU training environment
