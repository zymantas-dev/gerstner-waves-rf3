# Gerstner Sea Lab

An interactive ocean built from Gerstner (trochoidal) waves in React and Three.js. Click open water on a map, pull its real marine forecast from Open-Meteo, and the three wave layers are tuned to that sea state - then adjust direction, steepness and wavelength by hand and watch a ship ride the surface.

Live: https://gerstner-waves.kodeo.lt/

![](img/demo1.png)
![](img/demo2.png)

## How it works

- **Waves** - the vertex shader sums three Gerstner waves (`src/components/OceanScene.tsx`). Each wave displaces vertices horizontally *and* vertically, which gives the sharp crests a plain sine surface lacks. Normals come from the analytic tangent/binormal, and the ship samples the same function on the CPU (`src/lib/waves.ts`) so it floats on the exact surface drawn.
- **Forecast** - `src/lib/marine.ts` calls the Open-Meteo marine API; `wavesFromMarine` maps wave height, period and direction (swell + wind waves) onto the wave parameters, with unit tests in `src/lib/waves.test.ts`.
- **Map** - MapLibre with OpenFreeMap tiles; only ocean surfaces are selectable.
- **No WebGL** - the page shows an explanatory message instead of a blank screen.

## Run it

```bash
npm install
npm run dev      # dev server
npm test         # wave maths unit tests
npm run build    # type-check + production build
```

## Stack

React 18, Vite, TypeScript, three, @react-three/fiber, @react-three/drei, maplibre-gl, vitest.

## References

- [Trochoidal wave](https://en.wikipedia.org/wiki/Trochoidal_wave)
- [Gerstner water in three.js](https://sbcode.net/threejs/gerstnerwater/)

## Credits

- Marine forecast: [Open-Meteo](https://open-meteo.com/en/docs/marine-weather-api)
- Map tiles: [OpenFreeMap](https://openfreemap.org/) / OpenStreetMap contributors
- [Cargo ship model](https://sketchfab.com/3d-models/cargo-ship-c95d341642c949bd85a03c97a15f81c3) on Sketchfab
