# Implementation Plan - Phase 1 (Modak Ball) & Phase 2 (Mushak Characters)

Implement procedural 3D assets for the Modak Ball and Mushak Characters for the Ganesha Volleyball Game using Three.js primitives and React Three Fiber, without external 3D model files (.gltf/.glb) or new dependencies, and preserving existing court geometry, camera, and lighting.

## User Review Required

> [!IMPORTANT]
> **Court Coordinates & Positioning**:
> - The court is split along the Z-axis by the net at `z = 0`.
> - The player half (`#f2a23a` orange/saffron) is at `z > 0`. The Player Mushak will be mounted at `[0, 0.08, 4.2]` with `rotation={[0, Math.PI, 0]}` to face the net.
> - The opponent half (`#1fb7b0` teal) is at `z < 0`. The Opponent Mushak will be mounted at `[0, 0.08, -4.2]` with `rotation={[0, 0, 0]}` to face the net.
> - The Modak Ball will be suspended at `[0, BALL_HEIGHT, 0]` (`BALL_HEIGHT = 1.18`), matching the current volleyball position and proportions (`BALL_RADIUS = 0.42`).

## Proposed Changes

### 1. Procedural Modak Ball Component

#### [NEW] [ModakBall.jsx](file:///c:/Users/Saksham/OneDrive/Desktop/ganesha-vollyball-game/src/ModakBall.jsx)
- **Geometry**:
  - Central teardrop dumpling base created using a `LatheGeometry` from a smooth 2D curve profile (pinched top tip tapering outward to a rounded plump base).
  - 10 radial curved pleat ribs running vertically along the perimeter from base to tip using angled tapered capsule/tube segments to create distinct, visible traditional modak pleats.
  - Twisted conical crown tip at the apex.
- **Material**:
  - Warm golden/cream color (`#fbe39d` / `#f5dc8e`), roughness `0.35`, metalness `0.08`, subtle warm specular highlight.
- **API**:
  - Accepts `position`, `rotation`, `scale`, and forwards `ref` to the top-level `<group>`.
  - Default `position = [0, BALL_HEIGHT, 0]`.

---

### 2. Procedural Mushak Component

#### [NEW] [Mushak.jsx](file:///c:/Users/Saksham/OneDrive/Desktop/ganesha-vollyball-game/src/Mushak.jsx)
- **Structure (Three.js Primitives Only)**:
  - **Body**: Plump, rounded capsule/egg shape (`#968a7f` warm mouse grey/taupe) with a cream belly patch (`#f3ebe1`).
  - **Head**: Cute spherical head positioned forward and atop body, with tapered snout cone and glossy dark button nose (`#221616`).
  - **Ears**: Large rounded mouse ears with contrasting soft pinkish/peach inner-ear discs (`#f3b4a8`).
  - **Eyes**: Glossy bead eyes (`#1a1a1a`) with tiny white highlight spheres for an expressive cartoon look.
  - **Limbs**: Small rounded front resting paws in an alert volleyball pose and grounded rear feet flat at `y = 0`.
  - **Tail**: Slender S-curved multi-segment tubular tail curving gracefully behind the body.
- **Visual Variants**:
  - `variant="player"`:
    - Saffron/red tilak on the forehead (`#d9381e` vermilion mark with `#fbbf24` golden bindu).
    - Orange/saffron athletic wristbands/ear accents (`#ea580c`), matching the orange court half.
  - `variant="opponent"`:
    - Cyan/teal forehead motif (`#0891b2`).
    - Teal/cyan wristbands/ear accents (`#0d9488`), matching the teal court half.
- **API**:
  - Accepts `position`, `rotation`, `scale`, `variant = 'player'`, and forwards `ref` to the top-level `<group>`.

---

### 3. Scene Integration

#### [MODIFY] [GameScene.jsx](file:///c:/Users/Saksham/OneDrive/Desktop/ganesha-vollyball-game/src/components/GameScene.jsx)
- Replace `<Volleyball />` with `<ModakBall position={[0, BALL_HEIGHT, 0]} />`.
- Mount Player Mushak at `position={[0, 0.08, 4.2]}` facing the net (`rotation={[0, Math.PI, 0]}`).
- Mount Opponent Mushak at `position={[0, 0.08, -4.2]}` facing the net (`rotation={[0, 0, 0]}`).
- Preserve all existing court setups, net components, lighting, and camera configurations.

---

## Verification Plan

### Automated Verification
- Run `npm run lint` to verify code quality and absence of syntax or lint errors.
- Run `npm run build` or Vite build check to verify clean compilation.

### Visual Verification
- Use `browser_subagent` to open `http://localhost:5173`.
- Take screenshots and verify:
  1. Modak Ball: Traditional pleated shape, golden-cream color, proper scale and height.
  2. Mushaks: Cute plump mouse anatomy, distinct player (tilak/saffron) vs opponent (teal), grounded on court floor, facing the net.
  3. Preservation of all existing lighting, court, and net visuals.
