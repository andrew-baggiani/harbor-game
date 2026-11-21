import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import tailgate from "@/content/scenarios/mon-01-tailgate.json";
import phishing from "@/content/scenarios/mon-02-phishing.json";
import vishing from "@/content/scenarios/mon-03-vishing.json";
import usbScenario from "@/content/scenarios/mon-04-usb.json";

/**
 * Hero visual for the public site: a first-person walk through a grey-box
 * "rehearsal set" of the Monday office, with the game's HUD on top. It shows
 * the product is a first-person game without showing unfinished art.
 */

type Choice = { key: "E" | "Q"; label: string; good: boolean; result: string };
type Beat = {
  to: [number, number, number];
  look: string; // target name
  walk: number; // seconds moving
  clock: string;
  objective: string;
  choices: [Choice, Choice];
  controls: Record<string, string[]>;
  caption?: [string, string];
};

const BEATS: Beat[] = [
  {
    to: [0.1, 1.65, -4.6],
    look: "visitor",
    walk: 4.2,
    clock: "18:42",
    objective: "Get to floor 14",
    caption: ["Courier", "Mind getting that? My hands are full."],
    controls: tailgate.controls,
    choices: [
      { key: "E", label: "Hold the door", good: false, result: "No badge, and now he's inside. You'll see him again at the end of the shift." },
      { key: "Q", label: "Let it close", good: true, result: "He can buzz reception like everyone else. Polite and safe." },
    ],
  },
  {
    to: [0.2, 1.65, -12.4],
    look: "monitor",
    walk: 3.6,
    clock: "19:10",
    objective: "Check your inbox",
    controls: phishing.controls,
    choices: [
      { key: "E", label: "Report it", good: true, result: "Lookalike domain, fake deadline. Reporting it lets IT pull it from every inbox." },
      { key: "Q", label: "Open the link", good: false, result: "A copy of your sign-in page. Whatever you type goes straight to them." },
    ],
  },
  {
    to: [0.2, 1.65, -12.4],
    look: "phone",
    walk: 1.2,
    clock: "19:36",
    objective: "Answer the desk phone",
    caption: ["IT Service Desk · ext 4101", "Hi, it's Dan from IT. I just need the code we sent you."],
    controls: vishing.controls,
    choices: [
      { key: "E", label: "Read out the code", good: false, result: "That code was your second factor. Real IT never asks for it." },
      { key: "Q", label: "Hang up, call 4100", good: true, result: "You called the real help desk number. Nobody named Dan works there." },
    ],
  },
  {
    to: [-0.2, 1.65, -17],
    look: "usb",
    walk: 3.4,
    clock: "20:40",
    objective: "Head to the elevator",
    controls: usbScenario.controls,
    choices: [
      { key: "E", label: "Hand it to IT", good: true, result: "Unknown drives go to IT, unplugged. That's the whole trick." },
      { key: "Q", label: "Plug it in", good: false, result: "75 seconds from now, the printer on your floor starts acting up." },
    ],
  },
];

const FW: Record<string, string> = {
  "CIS_v8.1": "CIS",
  "NIST_800-53r5": "NIST 800-53",
  "NIST_800-171r2": "NIST 800-171",
  CMMC_L2: "CMMC",
  HIPAA: "HIPAA",
  "CSF_2.0": "CSF",
};
const controlLine = (c: Record<string, string[]>) =>
  Object.entries(c)
    .filter(([, ids]) => ids.length)
    .slice(0, 4)
    .map(([fw, ids]) => `${FW[fw] ?? fw} ${ids[0]}`)
    .join(", ");

const VIOLET = 0x8b2cf5;
const MINT = 0x19f5a5;

function screenTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0f1626";
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = "#1b2740";
  g.fillRect(0, 0, 150, 320);
  for (let i = 0; i < 7; i++) {
    const y = 18 + i * 42;
    g.fillStyle = i === 0 ? "#2b62d9" : "#18233a";
    g.fillRect(162, y, 336, 34);
    g.fillStyle = i === 0 ? "#ffffff" : "#5d6b8a";
    g.fillRect(174, y + 8, i === 0 ? 210 : 160 + ((i * 37) % 90), 6);
    g.fillStyle = i === 0 ? "#cfe0ff" : "#3b4864";
    g.fillRect(174, y + 20, 120 + ((i * 53) % 120), 5);
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle = "#33415f";
    g.fillRect(16, 24 + i * 30, 90 - i * 6, 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function build(scene: THREE.Scene) {
  const targets: Record<string, THREE.Object3D> = {};
  const edgeGrey = new THREE.LineBasicMaterial({ color: 0x4a5672 });
  const edgeViolet = new THREE.LineBasicMaterial({ color: VIOLET });
  const wall = new THREE.MeshStandardMaterial({ color: 0x2a3142, roughness: 0.9 });
  const prop = new THREE.MeshStandardMaterial({ color: 0x6a7591, roughness: 0.65 });
  const figure = new THREE.MeshStandardMaterial({ color: 0x6a7591, roughness: 0.6 });

  const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat = prop, edge = edgeGrey) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edge);
    m.add(e);
    scene.add(m);
    return m;
  };

  // Floor with a faint blocking grid, like tape marks on a rehearsal stage.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 60), new THREE.MeshStandardMaterial({ color: 0x1a1f2b, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -10;
  scene.add(floor);
  const grid = new THREE.GridHelper(40, 40, 0x4a2f8a, 0x2a3142);
  grid.position.set(0, 0.002, -10);
  scene.add(grid);

  // Corridor walls and ceiling strip lights.
  box(0.2, 3.2, 26, -3.1, 1.6, -9, wall);
  box(0.2, 3.2, 8, 3.1, 1.6, -4, wall);
  box(0.2, 3.2, 10, 3.1, 1.6, -18, wall);
  for (let z = 1; z > -22; z -= 4) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.12), new THREE.MeshBasicMaterial({ color: 0xcdd6ee }));
    strip.position.set(0, 3.15, z);
    scene.add(strip);
  }

  // Glass door at the end of the lobby.
  box(0.12, 2.6, 0.12, -1.2, 1.3, -8, prop, edgeViolet);
  box(0.12, 2.6, 0.12, 1.2, 1.3, -8, prop, edgeViolet);
  box(2.52, 0.14, 0.14, 0, 2.62, -8, prop, edgeViolet);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x6fb7ff, transparent: true, opacity: 0.08, roughness: 0.1 }),
  );
  glass.position.set(0.58, 1.27, -8);
  glass.rotation.y = -0.9;
  scene.add(glass);

  // The courier waiting on the other side, arms full.
  const visitor = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.95, 6, 12), figure);
  body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), figure);
  head.position.y = 1.72;
  visitor.add(body, head);
  const parcel = box(0.55, 0.4, 0.35, 0, 0, 0, new THREE.MeshStandardMaterial({ color: 0x6b5a43 }));
  scene.remove(parcel);
  parcel.position.set(0, 1.15, 0.3);
  visitor.add(parcel);
  visitor.position.set(0.15, 0, -9.3);
  scene.add(visitor);
  targets.visitor = visitor;

  // Desk with a monitor and a desk phone.
  box(1.8, 0.06, 0.8, 1.7, 0.74, -14.2);
  box(0.06, 0.72, 0.7, 0.86, 0.37, -14.2);
  box(0.06, 0.72, 0.7, 2.54, 0.37, -14.2);
  const monitor = new THREE.Group();
  const bezel = box(0.9, 0.56, 0.04, 0, 0, 0, prop, edgeGrey);
  scene.remove(bezel);
  monitor.add(bezel);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.5), new THREE.MeshBasicMaterial({ map: screenTexture() }));
  screen.position.z = 0.025;
  monitor.add(screen);
  monitor.position.set(1.75, 1.12, -14.42);
  monitor.rotation.y = -0.35;
  scene.add(monitor);
  targets.monitor = monitor;
  const glow = new THREE.PointLight(0x5b8cff, 2.2, 3.5);
  glow.position.set(1.6, 1.2, -13.9);
  scene.add(glow);

  const phone = box(0.26, 0.08, 0.2, 1.1, 0.81, -13.95, prop, edgeGrey);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5f }));
  led.position.set(0.09, 0.05, 0.06);
  phone.add(led);
  targets.phone = phone;

  // A dropped USB stick near the elevator.
  const usb = box(0.06, 0.02, 0.14, 0.5, 0.012, -18.4, new THREE.MeshStandardMaterial({ color: 0x9aa3b8 }), edgeGrey);
  targets.usb = usb;

  // Elevator at the end of the floor.
  box(2.2, 2.8, 0.2, -0.2, 1.4, -21.4, wall, edgeGrey);
  box(0.9, 2.3, 0.05, -0.66, 1.15, -21.28, new THREE.MeshStandardMaterial({ color: 0x8a7650, metalness: 0.6, roughness: 0.35 }));
  box(0.9, 2.3, 0.05, 0.26, 1.15, -21.28, new THREE.MeshStandardMaterial({ color: 0x8a7650, metalness: 0.6, roughness: 0.35 }));

  scene.add(new THREE.HemisphereLight(0xa8b6d8, 0x1a1e28, 1.6));
  const warm = new THREE.PointLight(0xffc58a, 14, 10);
  warm.position.set(1.4, 2.6, -13.5);
  scene.add(warm);
  const cool = new THREE.PointLight(0x9fb6ff, 12, 16);
  cool.position.set(0, 2.8, -4);
  scene.add(cool);

  return { targets, led };
}

export function RehearsalScene({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const reticle = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState(0);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<Choice | null>(null);
  const choiceRef = useRef<Choice | null>(null);
  const choose = (c: Choice) => {
    if (choiceRef.current) return;
    choiceRef.current = c;
    setPicked(c);
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.prepend(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101319);
    scene.fog = new THREE.Fog(0x101319, 10, 34);
    scene.add(new THREE.AmbientLight(0x8090b0, 0.6));
    const camera = new THREE.PerspectiveCamera(56, 1, 0.05, 60);
    const { targets, led } = build(scene);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Camera state: position plus a smoothed look-at point.
    const pos = new THREE.Vector3(0, 1.65, 2.5);
    const look = new THREE.Vector3(0, 1.5, -9);
    const center = new THREE.Vector3();
    let from = pos.clone();
    let i = 0;
    let t = 0;
    let lastLocked = false;
    let chosenAt = -1;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const box3 = new THREE.Box3();
    const corner = new THREE.Vector3();
    const placeReticle = (obj: THREE.Object3D) => {
      const r = reticle.current;
      if (!r) return;
      box3.setFromObject(obj);
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let k = 0; k < 8; k++) {
        corner.set(k & 1 ? box3.max.x : box3.min.x, k & 2 ? box3.max.y : box3.min.y, k & 4 ? box3.max.z : box3.min.z).project(camera);
        const x = (corner.x * 0.5 + 0.5) * el.clientWidth;
        const y = (-corner.y * 0.5 + 0.5) * el.clientHeight;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      const pad = 14;
      r.style.transform = `translate(${minX - pad}px, ${minY - pad}px)`;
      r.style.width = `${Math.max(24, maxX - minX + pad * 2)}px`;
      r.style.height = `${Math.max(24, maxY - minY + pad * 2)}px`;
    };

    const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const clock = new THREE.Clock();
    let raf = 0;

    if (still) {
      // One composed frame at the desk.
      pos.set(0.2, 1.65, -12.4);
      targets.monitor.getWorldPosition(look);
      camera.position.copy(pos);
      camera.lookAt(look);
      renderer.render(scene, camera);
      setBeat(1);
      setLocked(true);
      placeReticle(targets.monitor);
    } else {
      const loop = () => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!visible) return;
        const b = BEATS[i];
        t += dt;
        const target = targets[b.look];
        target.getWorldPosition(center);
        const walking = t < b.walk;
        const k = walking ? ease(t / b.walk) : 1;
        pos.lerpVectors(from, new THREE.Vector3(...b.to), k);
        const bob = walking ? Math.sin(clock.elapsedTime * 7.5) * 0.022 : 0;
        camera.position.set(pos.x, pos.y + bob, pos.z);
        look.lerp(center, 1 - Math.pow(0.02, dt));
        camera.lookAt(look);
        led.visible = b.look !== "phone" || Math.sin(clock.elapsedTime * 14) > 0;
        const nowLocked = !walking;
        if (nowLocked !== lastLocked) {
          lastLocked = nowLocked;
          setLocked(nowLocked);
        }
        placeReticle(target);
        // Hold on the target until the visitor picks (or 7s pass), then show the result.
        if (!walking && choiceRef.current && chosenAt < 0) chosenAt = t;
        const done = chosenAt >= 0 ? t > chosenAt + 4.2 : t > b.walk + 7;
        if (done) {
          chosenAt = -1;
          choiceRef.current = null;
          setPicked(null);
          from = pos.clone();
          i = (i + 1) % BEATS.length;
          if (i === 0) {
            from.set(0, 1.65, 2.5);
            look.set(0, 1.5, -9);
          }
          t = 0;
          setBeat(i);
        }
        renderer.render(scene, camera);
      };
      loop();
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const b = BEATS[beat];
  const onKey = (e: React.KeyboardEvent) => {
    if (!locked) return;
    const c = b.choices.find((x) => x.key === e.key.toUpperCase());
    if (c) {
      e.preventDefault();
      choose(c);
    }
  };
  return (
    <div
      ref={host}
      tabIndex={0}
      onKeyDown={onKey}
      role="group"
      aria-label="Playable sketch of the Monday shift. Press E or Q when a prompt appears."
      className={`relative overflow-hidden focus:outline-none ${className}`}
    >
      {/* HUD, in the game's own type. */}
      <div className="pointer-events-none absolute inset-0 font-game text-[#f4f0e6]" aria-hidden="true">
        <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
          <p className="text-[13px] font-semibold tracking-[0.18em] text-[#c4a574]">MONDAY {b.clock}</p>
          <p className="mt-0.5 text-lg font-semibold uppercase sm:text-xl">{b.objective}</p>
        </div>
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        <div
          ref={reticle}
          className="brackets absolute left-0 top-0"
          style={{
            "--arm": "18px",
            "--stroke": "3px",
            "--inset": locked ? "0px" : "-10px",
            "--c": locked ? "var(--color-site-violet)" : "rgba(139,44,245,0.45)",
          } as React.CSSProperties}
        />
        {b.caption && locked && !picked && (
          <div className="absolute left-1/2 bottom-[22%] w-[min(88%,30rem)] -translate-x-1/2 rounded-md bg-black/55 px-4 py-2.5 text-center font-ui text-[15px] backdrop-blur-sm">
            <span className="font-game text-[13px] font-semibold uppercase tracking-[0.14em] text-[#c4a574]">{b.caption[0]}</span>
            <p className="mt-0.5 [text-wrap:balance]">{b.caption[1]}</p>
          </div>
        )}
      </div>
      {locked && !picked && (
        <div className="absolute bottom-5 left-1/2 flex w-[calc(100%-1.5rem)] -translate-x-1/2 flex-wrap justify-center gap-2 font-game text-[#f4f0e6] sm:bottom-7 sm:gap-3">
          {b.choices.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => choose(c)}
              className="flex items-center gap-2 whitespace-nowrap rounded-md bg-black/55 px-2.5 py-1.5 text-[14px] font-semibold uppercase tracking-wide backdrop-blur-sm transition-colors hover:bg-black/75 sm:text-base"
            >
              <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-white/25 border-b-[3px] border-b-white/35 bg-white/[0.07] px-1.5 font-game text-sm">
                {c.key}
              </kbd>
              {c.label}
            </button>
          ))}
        </div>
      )}
      {picked && (
        <div className="absolute inset-x-3 bottom-4 mx-auto max-w-[34rem] rounded-lg border bg-black/70 px-4 py-3 backdrop-blur-md sm:bottom-6 sm:px-5 sm:py-4" style={{ borderColor: picked.good ? "var(--color-site-mint)" : "var(--color-site-alarm)" }} role="status">
          <p className="font-game text-[15px] font-semibold uppercase tracking-[0.12em]" style={{ color: picked.good ? "var(--color-site-mint)" : "var(--color-site-alarm)" }}>
            {picked.good ? "Good call" : "Logged as a miss"}
          </p>
          <p className="mt-1 text-[15px] leading-snug text-[#f4f0e6]">{picked.result}</p>
          <p className="mt-2 text-[13px] text-[#a6abba]">Recorded against {controlLine(b.controls)}</p>
        </div>
      )}
    </div>
  );
}
