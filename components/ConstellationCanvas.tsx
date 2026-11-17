'use client';

import { useEffect, useRef } from 'react';
import type { ConstellationGraph } from '@/lib/constellation.ts';
import { nodePosition } from '@/lib/constellation.ts';
import { createRig } from '@/lib/motion-blitz/camera.js';
import { dpr as capDpr, hasWebGL } from '@/lib/motion-blitz/env.js';
import { GRADES, LOOKS } from '@/lib/motion-blitz/looks-tokens.js';

type Props = {
  graph: ConstellationGraph;
  onUnavailable: () => void;
};

type NodeMesh = {
  slug: string;
  title: string;
  href: string;
  mesh: import('three').Mesh;
};

export default function ConstellationCanvas({ graph, onUnavailable }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const tooltip = tooltipRef.current;
    if (!host) return;
    if (!hasWebGL(1) || graph.nodes.length === 0) {
      onUnavailable();
      return;
    }

    let disposed = false;
    let stop = () => {};

    void (async () => {
      const THREE = await import('three');
      if (disposed || !hostRef.current) return;

      const look = LOOKS.black_mist.fixed ?? { bg: '#0D0D0D', mist: '#D6DCE1', accent: '#D4CEC2', line: '#4A4F57' };
      const grade = GRADES.black_mist;
      const site = getComputedStyle(host);
      const cyan = (site.getPropertyValue('--cyan') || '#22d3ee').trim();
      const text = (site.getPropertyValue('--text') || look.ink || '#f8fafc').trim();
      const bg = (site.getPropertyValue('--bg') || look.bg).trim();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(bg);

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default', preserveDrawingBuffer: true });
      renderer.setPixelRatio(capDpr(1.5, 1.25));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(look.mist || '#d6dce1', 0.55));
      const key = new THREE.DirectionalLight(0xf8fafc, 1.15);
      key.position.set(2.4, 3.2, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(new THREE.Color(cyan), 0.55);
      rim.position.set(-3, 1.2, -2);
      scene.add(rim);

      const cluster = new THREE.Group();
      scene.add(cluster);

      const nodes: NodeMesh[] = [];
      const count = graph.nodes.length;
      const geometry = new THREE.SphereGeometry(0.14, 24, 16);
      for (const [index, node] of graph.nodes.entries()) {
        const severity = node.severity == null ? 3 : Math.max(1, Math.min(10, node.severity));
        const scale = 0.85 + Math.min(severity, 5) * 0.08;
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(cyan),
          emissive: new THREE.Color(cyan),
          emissiveIntensity: 0.55,
          roughness: 0.45,
          metalness: 0.12,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const [x, y, z] = nodePosition(node.slug, index, count);
        mesh.position.set(x * 1.7, y * 1.7, z * 1.7);
        mesh.scale.setScalar(scale);
        mesh.userData = { slug: node.slug, title: node.title, href: node.href };
        cluster.add(mesh);
        nodes.push({ slug: node.slug, title: node.title, href: node.href, mesh });
      }

      const bySlug = new Map(nodes.map((item) => [item.slug, item]));
      const edgeMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(look.line || text),
        transparent: true,
        opacity: 0.35 * grade.saturation,
      });
      for (const edge of graph.edges) {
        const from = bySlug.get(edge.from);
        const to = bySlug.get(edge.to);
        if (!from || !to) continue;
        const strength = edge.strength == null ? 2 : Math.max(1, Math.min(3, edge.strength));
        const points = [from.mesh.position.clone(), to.mesh.position.clone()];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), edgeMat.clone());
        line.material.opacity = 0.2 + (strength / 3) * 0.55;
        line.userData = { reason: edge.reason, strength: edge.strength, from: edge.from, to: edge.to };
        cluster.add(line);
      }

      const rig = createRig(
        {
          lens: '50mm',
          f_stop: 4,
          rig: 'orbit',
          framing: 'medium',
          move: 'subtle',
          focus_target: 'cluster',
          angle: 'eye',
          side: 'center',
          compose: 'center',
          handheld: 0,
          seed: 17,
        },
        {
          anchors: { cluster: { pos: [0, 0, 0], height: 3.6, view: [0, 0.08, 1] } },
          aspect: 16 / 9,
          start: 0,
          duration: 1,
        },
      );

      scene.fog = new THREE.Fog(new THREE.Color(bg), rig.dist * 0.85, rig.dist * 2.6);

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let hovered: NodeMesh | null = null;
      let visible = true;
      let raf = 0;
      const start = performance.now();

      const sizeToHost = () => {
        const width = Math.max(1, host.clientWidth);
        const height = Math.max(1, host.clientHeight);
        renderer.setPixelRatio(capDpr(1.5, 1.25));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const setTooltip = (node: NodeMesh | null, reason?: string | null, event?: PointerEvent) => {
        if (!tooltip) return;
        if (!node) {
          tooltip.hidden = true;
          tooltip.textContent = '';
          host.style.cursor = 'default';
          return;
        }
        tooltip.hidden = false;
        tooltip.textContent = reason ? `${node.title} — ${reason}` : node.title;
        host.style.cursor = 'pointer';
        if (event) {
          const box = host.getBoundingClientRect();
          const offset = 12;
          const maxLeft = Math.max(0, box.width - tooltip.offsetWidth);
          const maxTop = Math.max(0, box.height - tooltip.offsetHeight);
          const left = Math.min(Math.max(0, event.clientX - box.left + offset), maxLeft);
          const top = Math.min(Math.max(0, event.clientY - box.top + offset), maxTop);
          tooltip.style.left = `${left}px`;
          tooltip.style.top = `${top}px`;
        }
      };

      const pick = (event: PointerEvent): { node: NodeMesh | null; reason: string | null } => {
        const box = host.getBoundingClientRect();
        pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
        pointer.y = -((event.clientY - box.top) / box.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(nodes.map((item) => item.mesh));
        if (!hits.length) return { node: null, reason: null };
        const mesh = hits[0].object as import('three').Mesh;
        const node = nodes.find((item) => item.mesh === mesh) ?? null;
        let reason: string | null = null;
        if (node) {
          const edge = graph.edges.find((item) => item.from === node.slug || item.to === node.slug);
          reason = edge?.reason ?? null;
        }
        return { node, reason };
      };

      const onPointerMove = (event: PointerEvent) => {
        const next = pick(event);
        hovered = next.node;
        setTooltip(next.node, next.reason, event);
      };
      const onPointerLeave = () => {
        hovered = null;
        setTooltip(null);
      };
      const onClick = (event: PointerEvent) => {
        const next = pick(event);
        if (next.node) window.location.assign(next.node.href);
      };
      const onKey = (event: KeyboardEvent) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (hovered) {
          event.preventDefault();
          window.location.assign(hovered.href);
        }
      };

      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerleave', onPointerLeave);
      host.addEventListener('click', onClick);
      host.addEventListener('keydown', onKey);

      const tick = (now: number) => {
        if (disposed) return;
        if (visible) {
          const t = ((now - start) / 24000) % 1;
          rig.apply(camera, t);
          renderer.render(scene, camera);
        }
        raf = window.requestAnimationFrame(tick);
      };

      const view = new IntersectionObserver(
        (entries) => {
          visible = entries.some((entry) => entry.isIntersecting);
        },
        { threshold: 0.05 },
      );
      view.observe(host);

      const resize = new ResizeObserver(() => sizeToHost());
      resize.observe(host);
      sizeToHost();
      raf = window.requestAnimationFrame(tick);

      stop = () => {
        window.cancelAnimationFrame(raf);
        view.disconnect();
        resize.disconnect();
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
        host.removeEventListener('click', onClick);
        host.removeEventListener('keydown', onKey);
        geometry.dispose();
        edgeMat.dispose();
        for (const child of cluster.children) {
          const line = child as import('three').Line;
          if (line.geometry) line.geometry.dispose();
          const material = (child as import('three').Mesh).material;
          if (material && !Array.isArray(material) && material !== edgeMat) material.dispose();
        }
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      stop();
    };
  }, [graph, onUnavailable]);

  return (
    <div className="constellation__stage" ref={hostRef} tabIndex={0} aria-label="Story constellation">
      <div className="constellation__tooltip" ref={tooltipRef} hidden />
    </div>
  );
}
