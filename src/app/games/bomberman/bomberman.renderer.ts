import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  DynamicDrawUsage,
  FogExp2,
  Group,
  HalfFloatType,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { FUSE_MS, type BombermanState, type GameEvent } from "./bomberman.engine";
import { BLOCK, COLS, type EnemyKind, key, type PowerKind, ROWS, WALL } from "./bomberman.levels";

export interface RendererOptions {
  /** `prefers-reduced-motion`: sin sacudidas, menos partículas y brillo más suave */
  reducedMotion: boolean;
}

const BLOCK_COLORS = [0xff7ac6, 0xb66dff, 0x4d7cff, 0x38d9f5, 0xffb347];
const ENEMY_COLORS: Record<EnemyKind, number> = { balloon: 0xff7ac6, ghost: 0xb66dff, hunter: 0xff4d6d };
const POWER_COLORS: Record<PowerKind, number> = { bomb: 0xffb347, range: 0xff4d6d, speed: 0x38d9f5 };

/** Color por encima de 1: el bloom lo hace brillar. */
function hot(hex: number, power = 2.4): Color {
  return new Color(hex).multiplyScalar(power);
}

interface Flame3D {
  group: Group;
  age: number;
  delay: number;
}

interface Shock {
  mesh: Mesh;
  age: number;
}

interface Debris {
  mesh: Mesh;
  vx: number;
  vy: number;
  vz: number;
  spin: number;
  age: number;
}

interface Burst {
  light: PointLight;
  age: number;
}

const MAX_SPARKS = 900;
const SPARK_LIFE = 0.9;

/**
 * Pinta el estado del motor con Three.js. No decide nada del juego: recibe el estado y los eventos
 * y los convierte en luz, color y partículas. Todo lo que crea se libera en `dispose()`.
 */
export class BombermanRenderer {
  private readonly renderer: WebGLRenderer;
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(38, 1, 0.1, 120);
  private readonly world = new Group();
  private readonly reduced: boolean;

  // Geometrías y materiales compartidos (se liberan al final)
  private readonly geo = {
    block: new RoundedBoxGeometry(0.94, 0.94, 0.94, 5, 0.12),
    wall: new RoundedBoxGeometry(1, 1.1, 1, 4, 0.07),
    wallTop: new BoxGeometry(0.9, 0.06, 0.9),
    tile: new BoxGeometry(1, 0.2, 1),
    flameOuter: new BoxGeometry(0.94, 0.9, 0.94),
    flameCore: new BoxGeometry(0.55, 1.1, 0.55),
    bomb: new SphereGeometry(0.4, 40, 30),
    spark: new SphereGeometry(0.07, 8, 6),
    body: new CapsuleGeometry(0.2, 0.28, 10, 24),
    head: new SphereGeometry(0.27, 40, 30),
    eye: new SphereGeometry(0.045, 14, 10),
    foot: new SphereGeometry(0.09, 16, 12),
    balloon: new SphereGeometry(0.36, 40, 30),
    ghost: new ConeGeometry(0.36, 0.8, 16),
    hunter: new IcosahedronGeometry(0.38, 0),
    powerBomb: new SphereGeometry(0.22, 14, 12),
    powerRange: new OctahedronGeometry(0.28),
    powerSpeed: new ConeGeometry(0.22, 0.5, 6),
    exit: new TorusGeometry(0.34, 0.07, 10, 28),
    shock: new RingGeometry(0.4, 0.55, 40),
    ring: new RingGeometry(0.27, 0.37, 48),
    debris: new BoxGeometry(0.16, 0.16, 0.16)
  };

  private readonly mat = {
    wall: new MeshStandardMaterial({ color: 0x4a3aa8, roughness: 0.5, metalness: 0.15, emissive: new Color(0x2a1f78), emissiveIntensity: 0.5 }),
    wallTop: new MeshBasicMaterial({ color: hot(0x38d9f5, 1.25), toneMapped: false }),
    // Blanco: el color real de cada baldosa va por instancia y se multiplica con este
    tile: new MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }),
    flameOuter: new MeshBasicMaterial({ color: hot(0xff6a00, 2.2), toneMapped: false, transparent: true, opacity: 0.88 }),
    flameCore: new MeshBasicMaterial({ color: hot(0xfff1a8, 3.2), toneMapped: false }),
    bomb: new MeshStandardMaterial({ color: 0x14102f, roughness: 0.3, metalness: 0.6, emissive: new Color(0xff2d2d), emissiveIntensity: 0.25 }),
    spark: new MeshBasicMaterial({ color: hot(0xffd24d, 3), toneMapped: false }),
    body: new MeshStandardMaterial({ color: 0xf5f7ff, roughness: 0.4 }),
    helmet: new MeshStandardMaterial({ color: 0x38d9f5, roughness: 0.25, metalness: 0.3, emissive: new Color(0x38d9f5), emissiveIntensity: 0.25 }),
    visor: new MeshStandardMaterial({ color: 0x07051a, roughness: 0.2 }),
    antenna: new MeshBasicMaterial({ color: hot(0xff7ac6, 2.6), toneMapped: false }),
    eye: new MeshBasicMaterial({ color: 0xffffff }),
    exit: new MeshBasicMaterial({ color: hot(0x3ddc84, 2.4), toneMapped: false }),
    exitOff: new MeshBasicMaterial({ color: 0x4a4a66 }),
    // Contorno: casco invertido apenas mayor que la pieza; da el trazo oscuro de dibujo animado y separa del fondo
    outline: new MeshBasicMaterial({ color: 0x0a0620, side: BackSide }),
    ringPlayer: new MeshBasicMaterial({ color: hot(0x38d9f5, 1.7), toneMapped: false, transparent: true, opacity: 0.9, side: DoubleSide }),
    ringEnemy: new MeshBasicMaterial({ color: hot(0xff4d6d, 1.5), toneMapped: false, transparent: true, opacity: 0.8, side: DoubleSide }),
    shock: new MeshBasicMaterial({ color: hot(0xffb347, 2.6), toneMapped: false, transparent: true, side: DoubleSide, depthWrite: false })
  };

  private readonly blockMats = BLOCK_COLORS.map((c) => new MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.05, emissive: new Color(c), emissiveIntensity: 0.14 }));
  private readonly enemyMats = Object.fromEntries(
    (Object.keys(ENEMY_COLORS) as EnemyKind[]).map((k) => [k, new MeshStandardMaterial({ color: ENEMY_COLORS[k], roughness: 0.3, emissive: new Color(ENEMY_COLORS[k]), emissiveIntensity: 0.55 })])
  ) as Record<EnemyKind, MeshStandardMaterial>;
  private readonly ghostMat = new MeshStandardMaterial({
    color: ENEMY_COLORS.ghost,
    roughness: 0.3,
    emissive: new Color(ENEMY_COLORS.ghost),
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.78
  });
  private readonly powerMats = Object.fromEntries((Object.keys(POWER_COLORS) as PowerKind[]).map((k) => [k, new MeshBasicMaterial({ color: hot(POWER_COLORS[k], 2.2), toneMapped: false })])) as Record<
    PowerKind,
    MeshBasicMaterial
  >;

  // Objetos vivos
  private readonly blocks = new Map<string, Mesh>();
  private readonly bombs = new Map<number, Group>();
  private readonly enemies = new Map<number, Group>();
  private readonly powerUps = new Map<string, Mesh>();
  private readonly flames: Flame3D[] = [];
  private readonly shocks: Shock[] = [];
  private readonly debris: Debris[] = [];
  private readonly bursts: Burst[] = [];
  private readonly player: Group;
  private readonly exitMesh: Mesh;
  private readonly walls: InstancedMesh;
  private readonly wallTops: InstancedMesh;
  private readonly tiles: InstancedMesh;

  // Partículas de chispas (un solo `Points` con buffer circular)
  private readonly sparkGeo = new BufferGeometry();
  private readonly sparkPos = new Float32Array(MAX_SPARKS * 3);
  private readonly sparkCol = new Float32Array(MAX_SPARKS * 3);
  private readonly sparkVel = new Float32Array(MAX_SPARKS * 3);
  private readonly sparkLife = new Float32Array(MAX_SPARKS);
  private readonly sparkMat = new PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false });
  private readonly sparkPoints: Points;
  private sparkHead = 0;

  // Polvo flotante de ambiente
  private readonly dustGeo = new BufferGeometry();
  private readonly dustMat = new PointsMaterial({ size: 0.07, color: 0xa78bfa, transparent: true, opacity: 0.7, depthWrite: false });
  private readonly dust: Points;

  private time = 0;
  private shake = 0;
  private level = -1;
  private aspect = 1;
  private playerWalk = 0;
  private readonly dummy = new Object3D();
  private disposed = false;

  public constructor(canvas: HTMLCanvasElement, options: RendererOptions) {
    this.reduced = options.reducedMotion;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    this.scene.background = new Color(0x07051a);
    this.scene.fog = new FogExp2(0x07051a, 0.01);
    this.scene.add(this.world);

    // Luces: relleno suave y una direccional que proyecta sombras
    this.scene.add(new AmbientLight(0x8a7bff, 0.55));
    this.scene.add(new HemisphereLight(0xb9a8ff, 0x1a1040, 0.6));
    const sun = new DirectionalLight(0xffe9d6, 1.5);
    sun.position.set(-6, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -9;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    // Post-proceso: el bloom hace brillar llamas, antenas y bordes de neón
    // El compositor dibuja en su propio buffer: sin MSAA aquí los bordes salen dentados y sin la densidad
    // de píxeles de la pantalla salen borrosos, aunque el renderer tenga antialias.
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new Vector2(256, 256), this.reduced ? 0.35 : 0.6, 0.45, 1.0);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    // Suelo en damero y muros fijos (instanciados: una sola llamada de dibujo cada uno)
    this.tiles = new InstancedMesh(this.geo.tile, this.mat.tile, COLS * ROWS);
    this.tiles.receiveShadow = true;
    const wallCells: [number, number][] = [];
    let t = 0;
    const tileA = new Color(0x241d66);
    const tileB = new Color(0x362b8f);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        this.dummy.position.set(x - COLS / 2 + 0.5, -0.1, y - ROWS / 2 + 0.5);
        this.dummy.updateMatrix();
        this.tiles.setMatrixAt(t, this.dummy.matrix);
        this.tiles.setColorAt(t, (x + y) % 2 ? tileA : tileB);
        t++;
        if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1 || (x % 2 === 0 && y % 2 === 0)) wallCells.push([x, y]);
      }
    }
    this.world.add(this.tiles);

    this.walls = new InstancedMesh(this.geo.wall, this.mat.wall, wallCells.length);
    this.wallTops = new InstancedMesh(this.geo.wallTop, this.mat.wallTop, wallCells.length);
    this.walls.castShadow = true;
    this.walls.receiveShadow = true;
    wallCells.forEach(([x, y], i) => {
      this.dummy.position.set(x - COLS / 2 + 0.5, 0.45, y - ROWS / 2 + 0.5);
      this.dummy.updateMatrix();
      this.walls.setMatrixAt(i, this.dummy.matrix);
      this.dummy.position.y = 1.02;
      this.dummy.updateMatrix();
      this.wallTops.setMatrixAt(i, this.dummy.matrix);
    });
    this.world.add(this.walls, this.wallTops);

    this.player = this.buildPlayer();
    this.world.add(this.player);

    this.exitMesh = new Mesh(this.geo.exit, this.mat.exitOff);
    this.exitMesh.rotation.x = Math.PI / 2;
    this.exitMesh.visible = false;
    this.world.add(this.exitMesh);

    // Chispas
    for (let i = 0; i < MAX_SPARKS; i++) this.sparkPos[i * 3 + 1] = -100;
    this.sparkGeo.setAttribute("position", new BufferAttribute(this.sparkPos, 3).setUsage(DynamicDrawUsage));
    this.sparkGeo.setAttribute("color", new BufferAttribute(this.sparkCol, 3).setUsage(DynamicDrawUsage));
    this.sparkPoints = new Points(this.sparkGeo, this.sparkMat);
    this.sparkPoints.frustumCulled = false;
    this.scene.add(this.sparkPoints);

    // Polvo de ambiente
    const dustCount = this.reduced ? 40 : 140;
    const dust = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dust[i * 3] = (Math.random() - 0.5) * 22;
      dust[i * 3 + 1] = Math.random() * 7;
      dust[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    this.dustGeo.setAttribute("position", new BufferAttribute(dust, 3));
    this.dust = new Points(this.dustGeo, this.dustMat);
    this.scene.add(this.dust);

    this.setSize(canvas.clientWidth || 640, canvas.clientHeight || 560);
  }

  public setSize(width: number, height: number): void {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    this.aspect = w / h;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w, h);
    this.camera.aspect = this.aspect;
    this.placeCamera();
  }

  /** Encuadra todo el tablero: el ancho manda en pantallas verticales y el alto en las anchas. */
  private placeCamera(): void {
    const tan = Math.tan(MathUtils.degToRad(this.camera.fov / 2));
    // Más cenital que antes: menos deformación en la fila cercana y todos los muros a la vista
    const tilt = MathUtils.degToRad(this.aspect < 0.9 ? 72 : 67);
    const needH = ROWS * Math.sin(tilt) + 2;
    const needW = COLS + 1.8;
    const dist = Math.max(needH / (2 * tan), needW / (2 * tan * this.aspect));
    this.camera.position.set(0, Math.sin(tilt) * dist, Math.cos(tilt) * dist + 0.4);
    this.camera.lookAt(0, 0, 0.2);
  }

  /** Efectos de un paso del motor: explosiones, bloques que saltan, golpes, premios. */
  public pushEvents(events: readonly GameEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case "explode":
          this.spawnExplosion(e.x, e.y, e.cells);
          break;
        case "blockDestroyed":
          this.spawnDebris(e.x, e.y);
          break;
        case "enemyKilled":
          this.spawnSparks(e.x, e.y, 0.5, ENEMY_COLORS[e.kind], this.reduced ? 14 : 40, 4);
          break;
        case "powerUp":
          this.spawnSparks(e.x + 0.5, e.y + 0.5, 0.6, POWER_COLORS[e.kind], this.reduced ? 12 : 36, 3.2);
          break;
        case "playerHit":
          this.addShake(0.4);
          break;
      }
    }
  }

  /** Sincroniza la escena con el estado y dibuja un cuadro. `dt` en segundos. */
  public frame(state: BombermanState, dt: number, paused: boolean): void {
    if (this.disposed) return;
    this.time += dt;
    if (state.level !== this.level) this.resetLevel(state);
    this.syncBlocks(state);
    this.syncEntities(state, paused);
    this.syncPowerUps(state);
    this.syncExit(state);
    this.animateFlames(dt);
    this.animateFx(dt);
    this.animateCamera(dt);
    this.composer.render(dt);
  }

  // ---- Construcción ----

  private buildPlayer(): Group {
    const g = new Group();
    const body = new Mesh(this.geo.body, this.mat.body);
    body.position.y = 0.38;
    const head = new Mesh(this.geo.head, this.mat.helmet);
    head.position.y = 0.78;
    const visor = new Mesh(this.geo.head, this.mat.visor);
    visor.scale.set(0.8, 0.55, 0.6);
    visor.position.set(0, 0.78, 0.15);
    for (const dx of [-0.07, 0.07]) {
      const eye = new Mesh(this.geo.eye, this.mat.eye);
      eye.position.set(dx, 0.79, 0.27);
      g.add(eye);
    }
    const stick = new Mesh(this.geo.eye, this.mat.eye);
    stick.scale.set(0.5, 4, 0.5);
    stick.position.set(0, 1.12, 0);
    const tip = new Mesh(this.geo.foot, this.mat.antenna);
    tip.position.set(0, 1.24, 0);
    for (const dx of [-0.11, 0.11]) {
      const foot = new Mesh(this.geo.foot, this.mat.body);
      foot.position.set(dx, 0.08, 0.04);
      foot.name = "foot";
      g.add(foot);
    }
    this.outline(body, 1.1);
    this.outline(head, 1.08);
    g.add(body, head, visor, stick, tip, this.ground(this.mat.ringPlayer));
    g.traverse((o) => {
      o.castShadow = o.name !== "ring";
    });
    return g;
  }

  private buildBomb(): Group {
    const g = new Group();
    const ball = new Mesh(this.geo.bomb, this.mat.bomb);
    ball.position.y = 0.36;
    ball.castShadow = true;
    this.outline(ball, 1.07);
    const spark = new Mesh(this.geo.spark, this.mat.spark);
    spark.position.set(0.12, 0.78, 0);
    spark.name = "spark";
    g.add(ball, spark);
    return g;
  }

  private buildEnemy(kind: EnemyKind): Group {
    const g = new Group();
    const body = new Mesh(kind === "balloon" ? this.geo.balloon : kind === "ghost" ? this.geo.ghost : this.geo.hunter, kind === "ghost" ? this.ghostMat : this.enemyMats[kind]);
    body.position.y = kind === "ghost" ? 0.55 : 0.42;
    if (kind === "ghost") body.rotation.x = Math.PI;
    body.castShadow = true;
    body.name = "body";
    this.outline(body, 1.07);
    g.add(body, this.ground(this.mat.ringEnemy));
    const eyeMat = kind === "hunter" ? this.mat.antenna : this.mat.eye;
    for (const dx of [-0.13, 0.13]) {
      const eye = new Mesh(this.geo.eye, eyeMat);
      eye.scale.setScalar(2);
      eye.position.set(dx, kind === "ghost" ? 0.68 : 0.5, 0.3);
      g.add(eye);
    }
    return g;
  }

  /** Trazo oscuro alrededor de una pieza: hijo de la misma malla, así hereda sus animaciones. */
  private outline(mesh: Mesh, scale: number): void {
    const edge = new Mesh(mesh.geometry, this.mat.outline);
    edge.scale.setScalar(scale);
    mesh.add(edge);
  }

  /** Anillo luminoso en el suelo: hace que personajes y enemigos se distingan al primer vistazo. */
  private ground(material: MeshBasicMaterial): Mesh {
    const ring = new Mesh(this.geo.ring, material);
    ring.name = "ring";
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    return ring;
  }

  private buildPower(kind: PowerKind): Mesh {
    const geo = kind === "bomb" ? this.geo.powerBomb : kind === "range" ? this.geo.powerRange : this.geo.powerSpeed;
    return new Mesh(geo, this.powerMats[kind]);
  }

  private resetLevel(state: BombermanState): void {
    this.level = state.level;
    for (const m of this.blocks.values()) this.world.remove(m);
    this.blocks.clear();
    for (const g of this.bombs.values()) this.world.remove(g);
    this.bombs.clear();
    for (const g of this.enemies.values()) this.world.remove(g);
    this.enemies.clear();
    for (const m of this.powerUps.values()) this.world.remove(m);
    this.powerUps.clear();
    for (const f of this.flames.splice(0)) this.world.remove(f.group);
    for (const s of this.shocks.splice(0)) this.world.remove(s.mesh);
    for (const d of this.debris.splice(0)) this.world.remove(d.mesh);
    for (const b of this.bursts.splice(0)) this.scene.remove(b.light);
    this.sparkLife.fill(0);
    for (let i = 0; i < MAX_SPARKS; i++) this.sparkPos[i * 3 + 1] = -100;
    this.sparkGeo.attributes["position"].needsUpdate = true;

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (state.grid[y][x] !== BLOCK) continue;
        const m = new Mesh(this.geo.block, this.blockMats[(x * 7 + y * 3) % this.blockMats.length]);
        m.position.set(...this.at(x, y, 0.46));
        m.castShadow = true;
        m.receiveShadow = true;
        // Entrada con rebote escalonada por distancia a la esquina
        m.scale.setScalar(0.001);
        m.userData["pop"] = (x + y) * 0.025;
        this.blocks.set(key(x, y), m);
        this.world.add(m);
      }
    }
  }

  // ---- Sincronización con el estado ----

  private at(x: number, y: number, h: number): [number, number, number] {
    return [x - COLS / 2 + 0.5, h, y - ROWS / 2 + 0.5];
  }

  private syncBlocks(state: BombermanState): void {
    for (const [k, mesh] of this.blocks) {
      const [x, y] = k.split(",").map(Number);
      if (state.grid[y][x] !== BLOCK) {
        this.world.remove(mesh);
        this.blocks.delete(k);
        continue;
      }
      const delay = mesh.userData["pop"] as number;
      const t = MathUtils.clamp((this.time - delay) / 0.35, 0, 1);
      // Rebote con sobreimpulso (easeOutBack)
      const c1 = 1.70158;
      const s = t >= 1 ? 1 : Math.max(0.001, 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2));
      mesh.scale.setScalar(s);
    }
  }

  private syncEntities(state: BombermanState, paused: boolean): void {
    const p = state.player;
    this.player.position.set(p.x - COLS / 2, 0, p.y - ROWS / 2);
    const [fx, fz] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.facing];
    const target = Math.atan2(fx, fz);
    this.player.rotation.y = lerpAngle(this.player.rotation.y, target, 0.35);
    if (p.moving && !paused) this.playerWalk += 0.28;
    const bob = p.moving ? Math.abs(Math.sin(this.playerWalk)) * 0.1 : Math.sin(this.time * 2.4) * 0.015;
    this.player.position.y = bob;
    const squash = 1 + (p.moving ? Math.sin(this.playerWalk * 2) * 0.04 : 0);
    this.player.scale.set(1.5, 1.5 * squash, 1.5);
    // Parpadeo mientras es invulnerable
    this.player.visible = p.invuln <= 0 || Math.floor(this.time * 14) % 2 === 0;
    this.player.children
      .filter((c) => c.name === "foot")
      .forEach((foot, i) => {
        foot.position.z = 0.04 + (p.moving ? Math.sin(this.playerWalk + i * Math.PI) * 0.1 : 0);
      });

    // Bombas: laten más rápido a medida que se acaba la mecha
    const liveBombs = new Set<number>();
    for (const b of state.bombs) {
      liveBombs.add(b.id);
      let g = this.bombs.get(b.id);
      if (!g) {
        g = this.buildBomb();
        g.position.set(...this.at(b.tx, b.ty, 0));
        this.bombs.set(b.id, g);
        this.world.add(g);
      }
      const urgency = 1 - MathUtils.clamp(b.fuse / FUSE_MS, 0, 1);
      const pulse = 1 + Math.sin(this.time * (8 + urgency * 22)) * (0.06 + urgency * 0.08);
      g.scale.setScalar(pulse);
      const spark = g.getObjectByName("spark");
      if (spark) spark.scale.setScalar(0.7 + Math.abs(Math.sin(this.time * 30)) * 1.1);
      this.mat.bomb.emissiveIntensity = 0.25 + urgency * 1.6 * Math.abs(Math.sin(this.time * (6 + urgency * 20)));
    }
    for (const [id, g] of this.bombs) {
      if (liveBombs.has(id)) continue;
      this.world.remove(g);
      this.bombs.delete(id);
    }

    // Enemigos: cada tipo se mueve a su manera
    const liveEnemies = new Set<number>();
    for (const e of state.enemies) {
      liveEnemies.add(e.id);
      let g = this.enemies.get(e.id);
      if (!g) {
        g = this.buildEnemy(e.kind);
        this.enemies.set(e.id, g);
        this.world.add(g);
      }
      const wobble = this.time * (e.kind === "hunter" ? 9 : 5) + e.id;
      const lift = e.kind === "ghost" ? 0.12 + Math.sin(wobble) * 0.1 : Math.abs(Math.sin(wobble)) * 0.1;
      g.scale.setScalar(1.4);
      g.position.set(e.x - COLS / 2, lift, e.y - ROWS / 2);
      g.rotation.y = lerpAngle(g.rotation.y, Math.atan2(e.last?.dx ?? 0, e.last?.dy ?? 1), 0.2);
      const body = g.getObjectByName("body");
      if (body) {
        const squash = 1 + Math.sin(wobble * 2) * 0.07;
        body.scale.set(1 / squash, squash, 1 / squash);
        if (e.kind === "hunter") body.rotation.y += 0.05;
      }
    }
    for (const [id, g] of this.enemies) {
      if (liveEnemies.has(id)) continue;
      this.world.remove(g);
      this.enemies.delete(id);
    }
  }

  private syncPowerUps(state: BombermanState): void {
    const live = new Set<string>();
    for (const u of state.powerUps) {
      const k = key(u.x, u.y);
      live.add(k);
      let m = this.powerUps.get(k);
      if (!m) {
        m = this.buildPower(u.kind);
        this.powerUps.set(k, m);
        this.world.add(m);
      }
      m.position.set(...this.at(u.x, u.y, 0.45 + Math.sin(this.time * 3 + u.x) * 0.1));
      m.rotation.y = this.time * 2.2;
      m.scale.setScalar(1.45 + Math.sin(this.time * 6) * 0.1);
    }
    for (const [k, m] of this.powerUps) {
      if (live.has(k)) continue;
      this.world.remove(m);
      this.powerUps.delete(k);
    }
  }

  private syncExit(state: BombermanState): void {
    const revealed = state.grid[state.exit.y][state.exit.x] !== BLOCK && state.grid[state.exit.y][state.exit.x] !== WALL;
    this.exitMesh.visible = revealed;
    if (!revealed) return;
    this.exitMesh.material = state.exitOpen ? this.mat.exit : this.mat.exitOff;
    this.exitMesh.position.set(...this.at(state.exit.x, state.exit.y, 0.12));
    const open = state.exitOpen;
    this.exitMesh.rotation.z = this.time * (open ? 3 : 0.4);
    this.exitMesh.scale.setScalar(open ? 1 + Math.sin(this.time * 5) * 0.14 : 0.9);
  }

  // ---- Efectos ----

  /** Explosión en cruz: la llama brota del centro y recorre cada brazo, con luz, onda y chispas. */
  private spawnExplosion(ox: number, oy: number, cells: [number, number][]): void {
    for (const [x, y] of cells) {
      const group = new Group();
      const outer = new Mesh(this.geo.flameOuter, this.mat.flameOuter);
      const core = new Mesh(this.geo.flameCore, this.mat.flameCore);
      group.add(outer, core);
      group.position.set(...this.at(x, y, 0.45));
      group.scale.setScalar(0.001);
      this.world.add(group);
      // El retraso crece con la distancia al centro: se ve cómo avanza por los ejes X e Y
      this.flames.push({ group, age: 0, delay: (Math.abs(x - ox) + Math.abs(y - oy)) * 0.035 });
      if (!this.reduced || (x === ox && y === oy)) this.spawnSparks(x + 0.5, y + 0.5, 0.45, 0xff9a2e, this.reduced ? 3 : 7, 3.4);
    }
    // Onda de choque en el suelo
    const ring = new Mesh(this.geo.shock, this.mat.shock.clone());
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(...this.at(ox, oy, 0.06));
    this.world.add(ring);
    this.shocks.push({ mesh: ring, age: 0 });
    // Destello de luz
    const light = new PointLight(0xff8a2a, 40, 12, 1.6);
    light.position.set(...this.at(ox, oy, 1.2));
    this.scene.add(light);
    this.bursts.push({ light, age: 0 });
    this.addShake(0.22 + Math.min(cells.length, 16) * 0.012);
  }

  private spawnDebris(x: number, y: number): void {
    const count = this.reduced ? 3 : 8;
    const color = BLOCK_COLORS[(x * 7 + y * 3) % BLOCK_COLORS.length];
    for (let i = 0; i < count; i++) {
      const mesh = new Mesh(this.geo.debris, this.blockMats[(x * 7 + y * 3) % this.blockMats.length]);
      mesh.position.set(...this.at(x, y, 0.4));
      this.world.add(mesh);
      this.debris.push({ mesh, vx: (Math.random() - 0.5) * 4.5, vy: 2.5 + Math.random() * 3.5, vz: (Math.random() - 0.5) * 4.5, spin: (Math.random() - 0.5) * 14, age: 0 });
    }
    this.spawnSparks(x + 0.5, y + 0.5, 0.45, color, this.reduced ? 4 : 14, 3);
  }

  /** Chispas en un buffer circular; las más viejas se reciclan. */
  private spawnSparks(cx: number, cy: number, h: number, hex: number, count: number, speed: number): void {
    const c = hot(hex, 2.4);
    for (let n = 0; n < count; n++) {
      const i = this.sparkHead;
      this.sparkHead = (this.sparkHead + 1) % MAX_SPARKS;
      this.sparkPos[i * 3] = cx - COLS / 2 + (Math.random() - 0.5) * 0.4;
      this.sparkPos[i * 3 + 1] = h;
      this.sparkPos[i * 3 + 2] = cy - ROWS / 2 + (Math.random() - 0.5) * 0.4;
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.sparkVel[i * 3] = Math.cos(a) * v;
      this.sparkVel[i * 3 + 1] = 1.5 + Math.random() * speed;
      this.sparkVel[i * 3 + 2] = Math.sin(a) * v;
      this.sparkCol[i * 3] = c.r;
      this.sparkCol[i * 3 + 1] = c.g;
      this.sparkCol[i * 3 + 2] = c.b;
      this.sparkLife[i] = SPARK_LIFE * (0.6 + Math.random() * 0.4);
    }
  }

  private addShake(amount: number): void {
    if (!this.reduced) this.shake = Math.min(1, this.shake + amount);
  }

  private animateFlames(dt: number): void {
    for (let i = this.flames.length - 1; i >= 0; i--) {
      const f = this.flames[i];
      f.age += dt;
      const t = f.age - f.delay;
      const life = 0.5;
      if (t >= life) {
        this.world.remove(f.group);
        this.flames.splice(i, 1);
        continue;
      }
      if (t < 0) continue;
      const k = t / life;
      // Crece rápido con sobreimpulso y se encoge al final; el núcleo vibra
      const grow = Math.min(1, t / 0.08);
      const fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      const s = Math.max(0.001, grow * (1 + Math.sin(k * 18) * 0.05) * fade);
      f.group.scale.set(s, 0.6 + s * 0.7, s);
      f.group.rotation.y = k * 2;
    }
  }

  private animateFx(dt: number): void {
    for (let i = this.shocks.length - 1; i >= 0; i--) {
      const s = this.shocks[i];
      s.age += dt;
      const k = s.age / 0.5;
      if (k >= 1) {
        this.world.remove(s.mesh);
        (s.mesh.material as MeshBasicMaterial).dispose();
        this.shocks.splice(i, 1);
        continue;
      }
      s.mesh.scale.setScalar(1 + k * 5);
      (s.mesh.material as MeshBasicMaterial).opacity = 1 - k;
    }

    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.age += dt;
      const k = b.age / 0.55;
      if (k >= 1) {
        this.scene.remove(b.light);
        b.light.dispose();
        this.bursts.splice(i, 1);
        continue;
      }
      b.light.intensity = 40 * (1 - k) * (this.reduced ? 0.6 : 1);
    }

    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.age += dt;
      d.vy -= 14 * dt;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.rotation.x += d.spin * dt;
      d.mesh.rotation.z += d.spin * dt;
      d.mesh.scale.setScalar(Math.max(0.001, 1 - d.age / 0.8));
      if (d.age > 0.8) {
        this.world.remove(d.mesh);
        this.debris.splice(i, 1);
      }
    }

    let touched = false;
    for (let i = 0; i < MAX_SPARKS; i++) {
      if (this.sparkLife[i] <= 0) continue;
      touched = true;
      this.sparkLife[i] -= dt;
      if (this.sparkLife[i] <= 0) {
        this.sparkPos[i * 3 + 1] = -100;
        continue;
      }
      this.sparkVel[i * 3 + 1] -= 9 * dt;
      this.sparkPos[i * 3] += this.sparkVel[i * 3] * dt;
      this.sparkPos[i * 3 + 1] = Math.max(0.02, this.sparkPos[i * 3 + 1] + this.sparkVel[i * 3 + 1] * dt);
      this.sparkPos[i * 3 + 2] += this.sparkVel[i * 3 + 2] * dt;
    }
    if (touched) {
      this.sparkGeo.attributes["position"].needsUpdate = true;
      this.sparkGeo.attributes["color"].needsUpdate = true;
    }

    // El polvo sube despacio y reaparece abajo
    const pos = this.dustGeo.attributes["position"] as BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + dt * 0.25;
      if (y > 7) y = 0;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(this.time * 0.4 + i) * dt * 0.1);
    }
    pos.needsUpdate = true;
  }

  private animateCamera(dt: number): void {
    this.shake = Math.max(0, this.shake - dt * 2.4);
    const s = this.shake * this.shake;
    this.world.position.set((Math.random() - 0.5) * s * 0.5, 0, (Math.random() - 0.5) * s * 0.5);
    if (!this.reduced) this.world.rotation.y = Math.sin(this.time * 0.25) * 0.02;
  }

  /** Libera geometrías, materiales, el compositor y el contexto WebGL (P9). */
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const b of this.bursts) b.light.dispose();
    for (const s of this.shocks) (s.mesh.material as MeshBasicMaterial).dispose();
    Object.values(this.geo).forEach((g) => g.dispose());
    Object.values(this.mat).forEach((m) => m.dispose());
    this.blockMats.forEach((m) => m.dispose());
    Object.values(this.enemyMats).forEach((m) => m.dispose());
    Object.values(this.powerMats).forEach((m) => m.dispose());
    this.ghostMat.dispose();
    this.sparkGeo.dispose();
    this.sparkMat.dispose();
    this.dustGeo.dispose();
    this.dustMat.dispose();
    this.tiles.dispose();
    this.walls.dispose();
    this.wallTops.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

function lerpAngle(from: number, to: number, t: number): number {
  const d = MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;
  return from + d * t;
}
