# EXACT ION 2-700 · 拆解实验室

Chinese Three.js workstation built from Bosch's official EXACT ION CAD, service catalogue and2025 manual.

## Run

Node22.13+ and npm are required.

```sh
npm install
npm run dev
npm test
npx tsc --noEmit
npm run build
```

The application is in `app` and `components`. `lib/exploration.mjs` owns reversible view state and structural separation paths. `lib/data` preserves source metadata, service numbers and catalogue variants. The GLB contains34 independently selectable mesh bodies, including9 individually addressable housing screws. The catalogue contains36 unique service part numbers including accessories and alternatives.

## Evidence boundary

The model is the official2013 LPack STEP export, triangulated with0.2mm linear deflection. Display materials have been adjusted for legibility. Each geometric body retains its CAD identifier and original assembly membership. The current official service catalogue may refer to different revisions.

The provided CAD does not contain independently selectable motor or planetary-gear geometry. The site links these catalogue items to official diagrams and does not fabricate their meshes. Geometric counts are not a complete physical bill of materials. The battery pack stays together during explosion. Internal translation paths explain layout only; they are not a verified workshop disassembly sequence. Battery,bit and marking-ring handling is separately sourced to the manual.

Source links are included in `lib/data/catalogue.json` and the site's reference page. `scripts/convert-cad.cjs` documents the asset conversion and needs `occt-import-js@0.0.23` in its execution environment. The original STEP source archive is linked in the manifest and is not duplicated in this repository.

## Validation

Node tests cover reversible offsets, playback endpoints, stage navigation, isolation/reset interactions, reduced-motion view changes, all34 shipped model identities and all36 deduplicated catalogue numbers. Type checking and production compilation are required before publishing. An independent binary review checked all mesh indices, normals and restored positions; source coordinate errors were under0.000004mm. Independent code review findings on range naming and reduced-motion isolation were resolved.

Optional WebMCP tools use the same view state. No supported WebMCP validation context was available in this environment, so live registration/execution was not verified. Browser UI testing was not requested and was not performed.
