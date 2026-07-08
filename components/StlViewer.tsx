"use client";

/**
 * In-browser 3D viewer for STL files (three.js).
 *
 * Renders any STL by URL — an upload in Supabase Storage or an external
 * link (GitHub blob links are converted to raw URLs by lib/urls.ts before
 * they get here). Drag to rotate, scroll to zoom.
 *
 * Note: external servers must allow cross-origin downloads (CORS).
 * raw.githubusercontent.com and Supabase Storage both do. If a file
 * refuses to load, the viewer shows a friendly error instead of crashing.
 */
import { useEffect, useRef, useState } from "react";

export default function StlViewer({ url, name }: { url: string; name?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    // three.js is heavy (~600KB) — import it only when a viewer actually
    // mounts, so pages without 3D models never download it.
    (async () => {
      const THREE = await import("three");
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      const width = mount.clientWidth;
      const height = mount.clientHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f2f8);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);

      // Simple studio lighting: soft ambient + one key light.
      scene.add(new THREE.HemisphereLight(0xffffff, 0x667799, 1.2));
      const key = new THREE.DirectionalLight(0xffffff, 1.4);
      key.position.set(1, 2, 3);
      scene.add(key);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      let frame = 0;
      const animate = () => {
        frame = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };

      new STLLoader().load(
        url,
        (geometry) => {
          if (disposed) return;
          geometry.computeBoundingBox();
          geometry.center(); // put the model at the origin

          const material = new THREE.MeshStandardMaterial({
            color: 0x8a9bf8, // friendly blue-violet plastic look
            roughness: 0.55,
            metalness: 0.1,
          });
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);

          // Frame the camera so any model, tiny or huge, fills the view.
          const size = geometry.boundingBox!.getSize(new THREE.Vector3()).length();
          camera.position.set(size * 0.7, size * 0.55, size * 0.9);
          camera.near = size / 100;
          camera.far = size * 10;
          camera.updateProjectionMatrix();
          controls.update();

          animate();
        },
        undefined,
        () => setError("Couldn't load this 3D file (bad link, or the server blocks downloads).")
      );

      cleanup = () => {
        cancelAnimationFrame(frame);
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [url]);

  return (
    <div className="stl-viewer-box" ref={mountRef}>
      {error && (
        <p className="muted small" style={{ padding: 16 }}>
          ⚠️ {error} <a href={url}>Download it instead.</a>
        </p>
      )}
      <span className="stl-hint">{name ? `${name} — ` : ""}drag to rotate · scroll to zoom</span>
    </div>
  );
}
