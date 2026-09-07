'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Box, LoaderCircle, RefreshCw } from 'lucide-react';
import { model, parts, type ModelPart } from '@/lib/tool-data';
import { offsetForPart } from '@/lib/exploration.mjs';

type Props = {
  amount: number;
  selected: string | null;
  isolated: boolean;
  cameraRevision: number;
  focusRevision: number;
  highlightIds: string[];
  onSelect: (id: string | null) => void;
  onReady: (ready: boolean) => void;
};
type Entry = {
  mesh: THREE.Mesh;
  part: ModelPart;
  origin: THREE.Vector3;
  material: THREE.MeshStandardMaterial;
};
export default function ToolViewer(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  current.current = props;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [percent, setPercent] = useState(0);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let disposed = false,
      frame = 0,
      renderer: THREE.WebGLRenderer | undefined,
      environment: THREE.Texture | undefined;
    let observer: ResizeObserver | undefined,
      controls: OrbitControls | undefined;
    const entries: Entry[] = [];
    const disposableGeometries = new Set<THREE.BufferGeometry>();
    const disposableMaterials = new Set<THREE.Material>();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.015, 250);
    const defaultPosition = new THREE.Vector3(-5.8, 3.1, 9.7);
    const defaultTarget = new THREE.Vector3(0, -0.1, 0);
    camera.position.copy(defaultPosition);
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const root = new THREE.Group();
    root.scale.setScalar(0.02);
    root.position.set(
      ...(model.bounds.center.map((n) => -n * 0.02) as [
        number,
        number,
        number,
      ]),
    );
    scene.add(root);
    let lastCamera = -1,
      lastFocus = -1,
      lastIsolated = false,
      lastSelected: string | null = null,
      amount = 0;
    let dragStart: [number, number] | null = null;
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    const click = (event: PointerEvent) => {
      if (
        !dragStart ||
        Math.hypot(event.clientX - dragStart[0], event.clientY - dragStart[1]) >
          5
      ) {
        dragStart = null;
        return;
      }
      dragStart = null;
      const rect = host.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        entries.filter((e) => e.mesh.visible).map((e) => e.mesh),
        false,
      )[0];
      current.current.onSelect(hit?.object.userData.cadId || null);
    };
    const down = (e: PointerEvent) => {
      if (e.button === 0) dragStart = [e.clientX, e.clientY];
    };
    const lost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(frame);
      if (!disposed) {
        setStatus('error');
        current.current.onReady(false);
      }
    };
    function fitSelected(id: string | null) {
      const entry = entries.find((e) => e.part.id === id);
      if (!entry || !controls) return;
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(entry.mesh),
        size = box.getSize(new THREE.Vector3()).length(),
        center = box.getCenter(new THREE.Vector3());
      const distance = Math.max(
        0.6,
        (size / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.1,
      );
      const direction = camera.position
        .clone()
        .sub(controls.target)
        .normalize();
      controls.target.copy(center);
      camera.position.copy(center).addScaledVector(direction, distance);
      camera.zoom = 1;
      camera.updateProjectionMatrix();
      controls.update();
    }
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.4;
      host.appendChild(renderer.domElement);
      renderer.domElement.setAttribute(
        'aria-label',
        'Bosch EXACT ION 2-700 可旋转三维模型；也可使用模型部件列表选择零件',
      );
      renderer.domElement.setAttribute('role', 'img');
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(defaultTarget);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.minDistance = 0.15;
      controls.maxDistance = 35;
      controls.maxPolarAngle = Math.PI * 0.94;
      controls.update();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.04).texture;
      scene.environment = environment;
      room.dispose();
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight(0xcbe0ff, 0x27303f, 2.0));
      const key = new THREE.DirectionalLight(0xe2eeff, 3.3);
      key.position.set(-5, 8, 6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x71b5ed, 4);
      rim.position.set(6, 2, -4);
      scene.add(rim);
      const floor = new THREE.GridHelper(18, 36, 0x455770, 0x2b3a4d);
      floor.position.y = -4.32;
      (floor.material as THREE.Material).transparent = true;
      (floor.material as THREE.Material).opacity = 0.18;
      scene.add(floor);
      disposableGeometries.add(floor.geometry);
      disposableMaterials.add(floor.material as THREE.Material);
      const resize = () => {
        if (!renderer || !host.clientWidth || !host.clientHeight) return;
        camera.aspect = host.clientWidth / host.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(host.clientWidth, host.clientHeight);
      };
      observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();
      renderer.domElement.addEventListener('pointerdown', down);
      renderer.domElement.addEventListener('pointerup', click);
      renderer.domElement.addEventListener('webglcontextlost', lost);
      setStatus('loading');
      current.current.onReady(false);
      setPercent(0);
      new GLTFLoader().load(
        '/models/tool.glb',
        (gltf) => {
          if (disposed) {
            gltf.scene.traverse((o) => {
              if (o instanceof THREE.Mesh) {
                o.geometry.dispose();
                const materials = Array.isArray(o.material)
                  ? o.material
                  : [o.material];
                materials.forEach((m) => m.dispose());
              }
            });
            return;
          }
          root.add(gltf.scene);
          const originalMaterials = new Set<THREE.Material>();
          gltf.scene.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return;
            const part = parts.find(
              (p) => p.id === object.userData.cadId || p.id === object.name,
            );
            if (!part) return;
            const original = Array.isArray(object.material)
              ? object.material
              : [object.material];
            original.forEach((m) => originalMaterials.add(m));
            object.geometry.deleteAttribute('color');
            const metal =
              part.group === 'fasteners' ||
              part.group === 'nose' ||
              (part.index >= 14 && part.index <= 17);
            const material = new THREE.MeshStandardMaterial({
              color: part.displayColor,
              metalness: metal ? 0.65 : 0.14,
              roughness: metal ? 0.35 : 0.62,
              side: THREE.DoubleSide,
            });
            object.material = material;
            object.userData.cadId = part.id;
            entries.push({
              mesh: object,
              part,
              origin: object.position.clone(),
              material,
            });
            disposableGeometries.add(object.geometry);
            disposableMaterials.add(material);
          });
          originalMaterials.forEach((m) => m.dispose());
          lastCamera = -1;
          lastFocus = -1;
          lastIsolated = !current.current.isolated;
          lastSelected = null;
          setStatus('ready');
          setPercent(100);
          current.current.onReady(true);
        },
        (event) => {
          if (!disposed && event.total)
            setPercent(Math.round((event.loaded / event.total) * 100));
        },
        () => {
          if (!disposed) {
            setStatus('error');
            current.current.onReady(false);
          }
        },
      );
      const targetPosition = new THREE.Vector3();
      let lastTime = performance.now();
      const animate = (time: number) => {
        if (disposed || !renderer || !controls) return;
        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;
        const state = current.current;
        amount = reduceMotion
          ? state.amount
          : THREE.MathUtils.damp(amount, state.amount, 9, dt);
        entries.forEach((entry) => {
          const [x, y, z] = offsetForPart(
            entry.part,
            state.isolated ? 0 : amount,
          );
          targetPosition.copy(entry.origin).add(new THREE.Vector3(x, y, z));
          entry.mesh.position.copy(targetPosition);
          entry.mesh.visible =
            !state.isolated || entry.part.id === state.selected;
          const selected = entry.part.id === state.selected;
          entry.material.emissive.set(
            selected
              ? '#4b8cd2'
              : state.highlightIds.includes(entry.part.id)
                ? '#1d4160'
                : '#000000',
          );
          entry.material.emissiveIntensity = selected ? 0.6 : 0.16;
        });
        const isolationChanged =
          state.isolated !== lastIsolated ||
          (state.isolated && state.selected !== lastSelected);
        if (
          state.cameraRevision !== lastCamera ||
          (isolationChanged && !state.isolated)
        ) {
          camera.position.copy(defaultPosition);
          controls.target.copy(defaultTarget);
          lastCamera = state.cameraRevision;
          camera.zoom = 1;
          controls.update();
        }
        if (
          entries.length &&
          ((isolationChanged && state.isolated) ||
            (state.focusRevision !== lastFocus && state.focusRevision > 0))
        )
          fitSelected(state.selected);
        if (!state.isolated) {
          camera.zoom = 1 / (1 + amount * 0.92);
          camera.updateProjectionMatrix();
        }
        lastIsolated = state.isolated;
        lastSelected = state.selected;
        lastFocus = state.focusRevision;
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    } catch {
      current.current.onReady(false);
      setStatus('error');
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      controls?.dispose();
      if (renderer) {
        renderer.domElement.removeEventListener('pointerdown', down);
        renderer.domElement.removeEventListener('pointerup', click);
        renderer.domElement.removeEventListener('webglcontextlost', lost);
        renderer.domElement.remove();
        renderer.dispose();
      }
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      environment?.dispose();
    };
  }, [retry]);
  return (
    <div className="scene-wrap">
      <div className="three-canvas" ref={container} />
      {status === 'loading' && (
        <div className="model-loading">
          <LoaderCircle size={26} className="animate-spin" />
          <strong>正在载入官方三维模型</strong>
          <span>{percent ? `${percent}%` : '准备几何部件…'}</span>
          <small>首次加载约 17 MB</small>
        </div>
      )}
      {status === 'error' && (
        <div className="model-loading error">
          <Box size={28} />
          <strong>三维模型暂时无法显示</strong>
          <p>请使用支持 WebGL 的浏览器。零件目录和官方图纸仍可查看。</p>
          <button
            className="secondary-button"
            onClick={() => setRetry((v) => v + 1)}
          >
            <RefreshCw size={15} />
            重新载入
          </button>
        </div>
      )}
    </div>
  );
}
