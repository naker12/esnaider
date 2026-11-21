import * as THREE from 'three';
import { DayPhase, WeatherType } from './types';

export interface WeatherAtmospherePreset {
  id: WeatherType;
  label: string;
  skyHex: number;
  fogDensity: number;
  keyColorHex: number;
  keyIntensity: number;
  hemiSkyHex: number;
  hemiIntensity: number;
  rimColorHex: number;
  rimIntensity: number;
  rainMix: number;
  snowMix: number;
  ashMix: number;
  fogOverlayMix: number;
  sunsetMix: number;
}

export const WEATHER_ORDER: WeatherType[] = [
  'despejado',
  'atardecer',
  'lluvia',
  'nieve',
  'tormenta_ceniza',
  'neblina',
];

export const WEATHER_PRESETS: Record<WeatherType, WeatherAtmospherePreset> = {
  despejado: {
    id: 'despejado',
    label: 'Despejado',
    skyHex: 0x111622,
    fogDensity: 0.0175,
    keyColorHex: 0xffdfb0,
    keyIntensity: 1.55,
    hemiSkyHex: 0x88a8d8,
    hemiIntensity: 0.72,
    rimColorHex: 0x6366f1,
    rimIntensity: 0.42,
    rainMix: 0.0,
    snowMix: 0.0,
    ashMix: 0.0,
    fogOverlayMix: 0.0,
    sunsetMix: 0.0,
  },
  atardecer: {
    id: 'atardecer',
    label: 'Atardecer',
    skyHex: 0x2b1922,
    fogDensity: 0.0195,
    keyColorHex: 0xff9b54,
    keyIntensity: 1.75,
    hemiSkyHex: 0xf59e6c,
    hemiIntensity: 0.68,
    rimColorHex: 0xfb7185,
    rimIntensity: 0.72,
    rainMix: 0.0,
    snowMix: 0.0,
    ashMix: 0.0,
    fogOverlayMix: 0.12,
    sunsetMix: 1.0,
  },
  lluvia: {
    id: 'lluvia',
    label: 'Lluvia',
    skyHex: 0x0d1520,
    fogDensity: 0.0265,
    keyColorHex: 0x9db8d8,
    keyIntensity: 0.92,
    hemiSkyHex: 0x607b99,
    hemiIntensity: 0.58,
    rimColorHex: 0x38bdf8,
    rimIntensity: 0.36,
    rainMix: 1.0,
    snowMix: 0.0,
    ashMix: 0.0,
    fogOverlayMix: 0.25,
    sunsetMix: 0.0,
  },
  nieve: {
    id: 'nieve',
    label: 'Nieve',
    skyHex: 0x4b5f78,
    fogDensity: 0.0245,
    keyColorHex: 0xdbeafe,
    keyIntensity: 1.08,
    hemiSkyHex: 0xbae6fd,
    hemiIntensity: 0.85,
    rimColorHex: 0x93c5fd,
    rimIntensity: 0.48,
    rainMix: 0.0,
    snowMix: 1.0,
    ashMix: 0.0,
    fogOverlayMix: 0.35,
    sunsetMix: 0.0,
  },
  tormenta_ceniza: {
    id: 'tormenta_ceniza',
    label: 'Tormenta de Ceniza',
    skyHex: 0x241410,
    fogDensity: 0.031,
    keyColorHex: 0xfb923c,
    keyIntensity: 0.86,
    hemiSkyHex: 0x78402e,
    hemiIntensity: 0.56,
    rimColorHex: 0xf97316,
    rimIntensity: 0.75,
    rainMix: 0.0,
    snowMix: 0.0,
    ashMix: 1.0,
    fogOverlayMix: 0.32,
    sunsetMix: 0.22,
  },
  neblina: {
    id: 'neblina',
    label: 'Neblina',
    skyHex: 0x1c2530,
    fogDensity: 0.044,
    keyColorHex: 0xcfd9e6,
    keyIntensity: 0.98,
    hemiSkyHex: 0x94a3b8,
    hemiIntensity: 0.8,
    rimColorHex: 0x94a3b8,
    rimIntensity: 0.3,
    rainMix: 0.0,
    snowMix: 0.0,
    ashMix: 0.0,
    fogOverlayMix: 1.0,
    sunsetMix: 0.0,
  },
};

export interface ComputedAtmosphere {
  phase: DayPhase;
  phaseLabel: string;
  isNight: boolean;
  skyColor: THREE.Color;
  keyColor: THREE.Color;
  keyIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  rimColor: THREE.Color;
  rimIntensity: number;
  fogDensity: number;
  visibilityMeters: number;
  starOpacity: number;
  nightMix: number;
  sunsetMix: number;
  rainMix: number;
  snowMix: number;
  ashMix: number;
  fogOverlayMix: number;
  lanternFactor: number;
}

const _cDaySky = new THREE.Color(0x6c96c4);
const _cDawnSky = new THREE.Color(0x9b665d);
const _cDuskSky = new THREE.Color(0x4b212a);
const _cNightSky = new THREE.Color(0x080c17);
const _cWeatherTint = new THREE.Color();

const _cSunColor = new THREE.Color(0xfff1d6);
const _cDawnSun = new THREE.Color(0xffb37a);
const _cDuskSun = new THREE.Color(0xff8447);
const _cMoonColor = new THREE.Color(0x9ec5ff);

const _cDayHemi = new THREE.Color(0x9dc2eb);
const _cNightHemi = new THREE.Color(0x283a5c);
const _cDayGround = new THREE.Color(0x453b2c);
const _cNightGround = new THREE.Color(0x12151f);

const _cDayRim = new THREE.Color(0xfde68a);
const _cNightRim = new THREE.Color(0x6366f1);

export function getDayPhaseInfo(hour: number): { phase: DayPhase; label: string; isNight: boolean } {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5.5 && h < 8.0) return { phase: 'amanecer', label: 'Amanecer', isNight: false };
  if (h >= 8.0 && h < 17.25) return { phase: 'dia', label: 'Día', isNight: false };
  if (h >= 17.25 && h < 20.0) return { phase: 'ocaso', label: 'Ocaso', isNight: false };
  return { phase: 'noche', label: 'Noche', isNight: true };
}

export function formatGameHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function smoothWindow(x: number, edge0: number, peak0: number, peak1: number, edge1: number): number {
  const up = THREE.MathUtils.smoothstep(x, edge0, peak0);
  const down = 1 - THREE.MathUtils.smoothstep(x, peak1, edge1);
  return up * down;
}

export function computeAtmosphereState(
  hour: number,
  weather: WeatherType,
  out: ComputedAtmosphere
): ComputedAtmosphere {
  const h = ((hour % 24) + 24) % 24;
  const phaseInfo = getDayPhaseInfo(h);
  const preset = WEATHER_PRESETS[weather];

  // Solar elevation factor: 0 at midnight, 1 at high noon
  const solarWave = Math.sin(((h - 6) / 24) * Math.PI * 2);
  const dayFactor = THREE.MathUtils.smoothstep(solarWave, -0.22, 0.45);
  const nightFactor = 1 - dayFactor;
  const dawnFactor = smoothWindow(h, 4.8, 6.4, 7.2, 8.8);
  const duskFactor = smoothWindow(h, 16.8, 18.2, 19.0, 20.5);

  // Base sky color across 24h cycle
  out.skyColor.copy(_cNightSky).lerp(_cDaySky, dayFactor);
  out.skyColor.lerp(_cDawnSky, dawnFactor * 0.72);
  out.skyColor.lerp(_cDuskSky, duskFactor * 0.85);

  // Key Light (Sun vs Moon)
  out.keyColor.copy(_cMoonColor).lerp(_cSunColor, dayFactor);
  out.keyColor.lerp(_cDawnSun, dawnFactor * 0.65);
  out.keyColor.lerp(_cDuskSun, duskFactor * 0.85);
  out.keyIntensity = THREE.MathUtils.lerp(0.62, 2.15, dayFactor);

  // Hemisphere Light
  out.hemiSkyColor.copy(_cNightHemi).lerp(_cDayHemi, dayFactor);
  out.hemiGroundColor.copy(_cNightGround).lerp(_cDayGround, dayFactor);
  out.hemiIntensity = THREE.MathUtils.lerp(0.34, 0.92, dayFactor);

  // Rim Light
  out.rimColor.copy(_cNightRim).lerp(_cDayRim, dayFactor);
  out.rimIntensity = THREE.MathUtils.lerp(0.32, 0.52, dayFactor);

  // Base visibility fog density across 24h (day = crystal clear, night = dark thick horizon)
  let fogDensity = THREE.MathUtils.lerp(0.032, 0.0085, dayFactor);
  fogDensity += (dawnFactor + duskFactor) * 0.005;

  // Apply synchronized Weather Modifiers on top of time of day
  let rainMix = preset.rainMix;
  let snowMix = preset.snowMix;
  let ashMix = preset.ashMix;
  let fogOverlayMix = preset.fogOverlayMix;
  let sunsetMix = Math.max(preset.sunsetMix, duskFactor * 0.85);

  if (weather === 'lluvia') {
    _cWeatherTint.setHex(dayFactor > 0.4 ? 0x3b4d63 : 0x0b121c);
    out.skyColor.lerp(_cWeatherTint, 0.62);
    out.keyColor.lerp(_cWeatherTint.setHex(0x9db8d8), 0.55);
    out.keyIntensity *= 0.58;
    out.hemiIntensity *= 0.82;
    fogDensity += 0.0135;
  } else if (weather === 'nieve') {
    _cWeatherTint.setHex(dayFactor > 0.4 ? 0x8aa2bf : 0x1c2a3d);
    out.skyColor.lerp(_cWeatherTint, 0.65);
    out.keyColor.lerp(_cWeatherTint.setHex(0xdbeafe), 0.6);
    out.keyIntensity *= 0.72;
    out.hemiSkyColor.lerp(_cWeatherTint.setHex(0xcbe5ff), 0.5);
    out.hemiIntensity = THREE.MathUtils.lerp(out.hemiIntensity, 0.88, 0.45);
    fogDensity += 0.0155;
  } else if (weather === 'tormenta_ceniza') {
    _cWeatherTint.setHex(dayFactor > 0.4 ? 0x45261c : 0x170c09);
    out.skyColor.lerp(_cWeatherTint, 0.78);
    out.keyColor.lerp(_cWeatherTint.setHex(0xfb923c), 0.62);
    out.keyIntensity *= 0.54;
    out.hemiSkyColor.lerp(_cWeatherTint.setHex(0x7c3b28), 0.6);
    out.rimColor.setHex(0xf97316);
    out.rimIntensity = Math.max(out.rimIntensity, 0.75);
    fogDensity += 0.0215;
  } else if (weather === 'neblina') {
    _cWeatherTint.setHex(dayFactor > 0.4 ? 0x6f7f91 : 0x161f2b);
    out.skyColor.lerp(_cWeatherTint, 0.72);
    out.keyColor.lerp(_cWeatherTint.setHex(0xcfd9e6), 0.5);
    out.keyIntensity *= 0.62;
    out.hemiIntensity = THREE.MathUtils.lerp(out.hemiIntensity, 0.78, 0.45);
    fogDensity += 0.0285;
  } else if (weather === 'atardecer') {
    out.skyColor.lerp(_cDuskSky, 0.48);
    out.keyColor.lerp(_cDuskSun, 0.55);
    sunsetMix = Math.max(sunsetMix, 0.92);
    fogDensity += 0.004;
  }

  out.phase = phaseInfo.phase;
  out.phaseLabel = phaseInfo.label;
  out.isNight = phaseInfo.isNight;
  out.fogDensity = fogDensity;
  out.visibilityMeters = Math.max(14, Math.min(130, Math.round(1.05 / fogDensity)));

  const weatherStarDim =
    weather === 'lluvia' || weather === 'nieve' || weather === 'tormenta_ceniza'
      ? 0.2
      : weather === 'neblina'
      ? 0.15
      : 1.0;
  out.starOpacity = THREE.MathUtils.clamp((nightFactor * 1.15 - 0.15) * weatherStarDim, 0, 0.95);
  out.nightMix = THREE.MathUtils.clamp(nightFactor, 0, 1);
  out.sunsetMix = THREE.MathUtils.clamp(sunsetMix, 0, 1);
  out.rainMix = rainMix;
  out.snowMix = snowMix;
  out.ashMix = ashMix;
  out.fogOverlayMix = fogOverlayMix;
  out.lanternFactor = THREE.MathUtils.clamp(
    nightFactor * 1.15 +
      duskFactor * 0.45 +
      (weather === 'neblina' || weather === 'tormenta_ceniza' ? 0.35 : 0),
    0.12,
    1.45
  );

  return out;
}

export const WeatherPostShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1280, 720) },
    uRainMix: { value: 0 },
    uSnowMix: { value: 0 },
    uAshMix: { value: 0 },
    uFogMix: { value: 0 },
    uSunsetMix: { value: 0 },
    uNightMix: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uRainMix;
    uniform float uSnowMix;
    uniform float uAshMix;
    uniform float uFogMix;
    uniform float uSunsetMix;
    uniform float uNightMix;
    varying vec2 vUv;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float rainLayer(vec2 uv, float scale, float speed, float slant) {
      vec2 st = uv;
      st.x += st.y * slant;
      st *= vec2(scale, scale * 0.22);
      st.y += uTime * speed;

      vec2 cell = floor(st);
      vec2 f = fract(st);
      float rnd = hash21(cell);

      float xOffset = 0.2 + 0.6 * fract(rnd * 17.3);
      float distX = abs(f.x - xOffset);
      float streakWidth = smoothstep(0.055, 0.0, distX);

      float yFade = smoothstep(0.0, 0.25, f.y) * smoothstep(1.0, 0.35, f.y);
      float densityMask = step(0.45, rnd);

      return streakWidth * yFade * densityMask;
    }

    void main() {
      vec2 uv = vUv;

      if (uRainMix > 0.01) {
        float edgeMask = smoothstep(0.25, 0.85, length(uv - 0.5));
        float ripple = sin(uv.y * 42.0 + uTime * 11.0 + uv.x * 16.0) * 0.0012;
        uv.x += ripple * uRainMix * edgeMask;
      }

      vec4 tex = texture2D(tDiffuse, clamp(uv, 0.001, 0.999));
      vec3 col = tex.rgb;
      float luma = dot(col, vec3(0.299, 0.587, 0.114));

      // 0. Nocturnal atmosphere: cool moonlight shadow shift + perimeter darkness
      if (uNightMix > 0.005) {
        vec3 lunarTone = mix(col, vec3(luma) * vec3(0.68, 0.8, 1.12), 0.28);
        float nightVig = smoothstep(0.28, 0.95, length(vUv - 0.5));
        col = mix(col, lunarTone * (1.0 - nightVig * 0.26), uNightMix * 0.85);
      }

      // 1. Sunset (Atardecer): warm golden-crimson grading + upper horizon glow
      if (uSunsetMix > 0.005) {
        vec3 warmShadows = vec3(0.18, 0.07, 0.12);
        vec3 warmHighlights = vec3(1.16, 0.84, 0.58);
        vec3 graded = mix(col * warmShadows * 2.2, col * warmHighlights, smoothstep(0.05, 0.7, luma));
        float horizonGlow = smoothstep(0.25, 0.92, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y));
        float sunBeam = pow(max(0.0, 1.0 - abs(vUv.x - 0.5) * 1.4), 2.0);
        graded += vec3(0.32, 0.13, 0.05) * horizonGlow * (0.45 + 0.55 * sunBeam);
        col = mix(col, graded, uSunsetMix);
      }

      // 2. Fog / Mist (Neblina): drifting atmospheric veil + soft contrast wash
      if (uFogMix > 0.005) {
        vec2 aspectUv = vec2(vUv.x * (uResolution.x / max(1.0, uResolution.y)), vUv.y);
        float mist1 = noise2(aspectUv * 3.2 + vec2(uTime * 0.09, uTime * 0.02));
        float mist2 = noise2(aspectUv * 6.5 - vec2(uTime * 0.14, -uTime * 0.03));
        float mistPattern = 0.55 * mist1 + 0.45 * mist2;
        float heightFade = mix(0.65, 0.25, vUv.y);
        vec3 mistColor = mix(vec3(0.24, 0.29, 0.36), vec3(0.11, 0.14, 0.21), uNightMix);
        vec3 desaturated = mix(col, vec3(luma), 0.28);
        col = mix(col, desaturated, uFogMix * 0.65);
        col = mix(col, mistColor, clamp(uFogMix * (0.22 + mistPattern * 0.28) * heightFade, 0.0, 0.54));
      }

      // 3. Rain (Lluvia): cool storm tint + multi-layered falling raindrops + subtle vignette
      if (uRainMix > 0.005) {
        vec2 aspectUv = vec2(vUv.x * (uResolution.x / max(1.0, uResolution.y)), vUv.y);
        float r1 = rainLayer(aspectUv, 42.0, 4.6, 0.16);
        float r2 = rainLayer(aspectUv + vec2(0.37, 0.19), 64.0, 6.2, 0.19);
        float r3 = rainLayer(aspectUv + vec2(0.71, 0.53), 28.0, 3.5, 0.14);
        float rainStreaks = clamp(r1 * 0.55 + r2 * 0.4 + r3 * 0.65, 0.0, 1.0);

        vec3 stormTint = mix(col, vec3(luma) * vec3(0.76, 0.88, 1.05), 0.36 * uRainMix);
        col = stormTint + vec3(0.45, 0.58, 0.72) * rainStreaks * 0.34 * uRainMix;

        float vig = smoothstep(0.4, 0.95, length(vUv - 0.5));
        col *= 1.0 - vig * 0.22 * uRainMix;
      }

      // 4. Snow (Nieve): crisp cool glacial tint + soft frost vignette
      if (uSnowMix > 0.005) {
        vec3 frostTint = mix(col, vec3(luma) * vec3(0.86, 0.95, 1.12), 0.24 * uSnowMix);
        float frostVig = smoothstep(0.42, 0.98, length(vUv - 0.5));
        col = mix(col, frostTint + vec3(0.05, 0.08, 0.13) * frostVig, uSnowMix);
      }

      // 5. Ash Storm (Tormenta de Ceniza): warm volcanic grading + subtle heat haze edge
      if (uAshMix > 0.005) {
        vec3 ashGrade = mix(col, vec3(luma) * vec3(1.18, 0.74, 0.54), 0.42 * uAshMix);
        float emberVig = smoothstep(0.35, 0.95, length(vUv - 0.5));
        ashGrade += vec3(0.18, 0.05, 0.01) * emberVig * uAshMix;
        col = mix(col, ashGrade * (1.0 - emberVig * 0.18), uAshMix);
      }

      gl_FragColor = vec4(col, tex.a);
    }
  `,
};
