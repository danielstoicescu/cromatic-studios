// Cromatic · hero car (TASK-112): the page that renders the hero Dacia. Driven by _source/drive.mjs (Playwright).
//   HERO.studio(o)  the car alone in a neutral room from a few angles (to check the shape)
//   HERO.shot(o)    the car in one of Lia's frames: the camera, the sun and the city's surroundings from the map
//                   (capture.mjs), path traced (o.mode "pt") or rasterised ("raster"), composited over the plate
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildHeroDacia, DIM } from "./dacia1300-hero.js";
import { studio } from "./studio.js";
import { shot } from "./shot.js";
window.THREE = THREE;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const make = () => buildHeroDacia(THREE, { RoundedBoxGeometry });
window.HERO = { THREE, renderer, make, DIM, studio: (o) => studio(THREE, renderer, make, o, RoomEnvironment), shot: (o) => shot(THREE, renderer, make, o), ready: true };
