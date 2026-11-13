export const coinShape = { halfThickness: 0.1, dome: 0.32, texelsPerRadius: 7 };

export const coinVertexShader = `#version 300 es
in vec2 aCorner;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uExtent;
out vec2 vPoint;

void main() {
  vPoint = aCorner * uExtent;
  vec2 pixel = uCenter + vec2(vPoint.x, -vPoint.y) * uRadius;
  vec2 clip = pixel / uResolution * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`;

export const coinFragmentShader = `#version 300 es
precision highp float;

in vec2 vPoint;
out vec4 outColor;

uniform mat3 uSpin;
uniform float uRadius;
uniform float uBlur;
uniform float uOpacity;
uniform vec4 uFlare;
uniform vec3 uFace;
uniform vec3 uBack;
uniform vec3 uRim;
uniform vec3 uBevel;
uniform vec3 uEdge;
uniform vec3 uGroove;
uniform vec3 uGlint;
uniform vec3 uShade;
uniform vec3 uKey;

const float HALF = ${coinShape.halfThickness};
const float DOME = ${coinShape.dome};
const float REEDS = 44.0;
const float TEXELS = ${coinShape.texelsPerRadius}.0;

float starDistance(vec2 q) {
  vec2 a = pow(abs(q) / 0.47, vec2(0.6));
  return (a.x + a.y - 1.0) * 0.28;
}

vec3 relief(vec2 q, float soft) {
  float r = length(q);
  float rim = smoothstep(0.79 - soft, 0.85 + soft, r);
  float ring = 1.0 - smoothstep(0.012, 0.04 + soft, abs(r - 0.655));
  float emblem = 1.0 - smoothstep(-0.015 - soft, 0.02 + soft, starDistance(q));
  return vec3(rim, ring, emblem);
}

float height(vec2 q, float soft) {
  vec3 parts = relief(q, soft);
  return parts.x + parts.y * 0.35 - parts.z * 0.7;
}

vec3 environment(vec3 r) {
  vec3 low = mix(uShade, uGroove, 0.55);
  vec3 high = mix(uBevel, uGlint, 0.7);
  float lift = smoothstep(-0.8, 0.9, r.y * 0.85 - r.x * 0.4 + r.z * 0.15);
  vec3 sky = mix(low, high, lift * lift * (3.0 - 2.0 * lift));
  float key = max(dot(r, uKey), 0.0);
  sky += uGlint * (pow(key, 6.0) * 0.7 + pow(key, 48.0) * 2.2);
  float fill = max(dot(r, normalize(vec3(0.75, -0.5, 0.42))), 0.0);
  sky += uBevel * pow(fill, 4.0) * 0.3;
  float strip = (dot(r, vec3(0.6402, -0.6402, 0.4243)) - 0.02) / (0.05 + uBlur * 0.03);
  sky += uGlint * exp(-strip * strip) * smoothstep(-0.2, 0.5, r.z) * 0.85;
  return sky;
}

vec3 lit(vec3 n, vec3 albedo, float polish) {
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), n);
  float wrap = 0.5 + 0.5 * dot(n, uKey);
  vec3 matte = albedo * (0.62 + 0.62 * wrap * wrap);
  vec3 mirror = albedo * environment(r) * 1.55;
  float fresnel = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);
  return mix(matte, mirror, polish) + uBevel * fresnel * 0.2;
}

float ellipseDistance(vec2 p, float squash) {
  float k0 = length(vec2(p.x, p.y / squash));
  float k1 = length(vec2(p.x, p.y / (squash * squash)));
  float estimate = k0 * (k0 - 1.0) / max(k1, 0.0001);
  return max(estimate, max(abs(p.x) - 1.0, abs(p.y) - squash));
}

vec3 faceColor(vec2 q, float facing, float soft, float calm, float polish) {
  float r = length(q);
  vec3 parts = relief(q, soft);
  float step = max(0.02, soft);
  float dx = height(q + vec2(step, 0.0), soft) - height(q - vec2(step, 0.0), soft);
  float dy = height(q + vec2(0.0, step), soft) - height(q - vec2(0.0, step), soft);
  vec2 bump = vec2(dx, dy) / (2.0 * step) * 0.085 * calm;
  float fillet = smoothstep(0.93, 1.0, r) * 0.85;
  vec3 local = normalize(vec3(q * DOME - bump + q / max(r, 0.001) * fillet, 1.0));
  vec3 n = uSpin * vec3(local.xy, facing * local.z);
  vec3 base = facing > 0.0 ? uFace : uBack;
  vec3 albedo = mix(base, uRim, clamp(parts.z * 0.9 + parts.y * 0.75, 0.0, 1.0) * calm);
  albedo = mix(albedo, mix(base, uBevel, 0.5), parts.x * 0.55);
  return lit(n, albedo, polish);
}

vec3 sideColor(float angle, float along, float polish) {
  float period = 6.2832 * uRadius / REEDS;
  float reeded = smoothstep(1.6, 4.5, period / (1.0 + uBlur * 2.0));
  float wave = sin(angle * REEDS);
  vec3 radial = vec3(cos(angle), sin(angle), 0.0);
  vec3 around = vec3(-radial.y, radial.x, 0.0);
  vec3 local = normalize(radial + around * wave * 0.5 * reeded + vec3(0.0, 0.0, along * 0.55));
  vec3 albedo = mix(uEdge, uGroove, (0.5 - 0.5 * wave) * reeded * 0.75 + (1.0 - reeded) * 0.2);
  return lit(uSpin * local, albedo, polish * 0.9);
}

struct Pose {
  float facing;
  float squash;
  float sweep;
  vec2 axis;
  vec2 across;
};

Pose pose() {
  vec3 normal = uSpin[2];
  float tilt = sqrt(max(1.0 - normal.z * normal.z, 0.0));
  vec2 axis = tilt > 0.0005 ? normal.xy / tilt : vec2(0.0, 1.0);
  float facing = normal.z >= 0.0 ? 1.0 : -1.0;
  return Pose(facing, max(abs(normal.z), 1.2 / uRadius), HALF * tilt, axis, vec2(-axis.y, axis.x));
}

float outlineAt(Pose at, vec2 point) {
  vec2 spot = vec2(dot(point, at.across), dot(point, at.axis));
  return ellipseDistance(vec2(spot.x, spot.y - clamp(spot.y, -at.sweep, at.sweep)), at.squash);
}

float faceEdgeAt(Pose at, vec2 point) {
  vec2 spot = vec2(dot(point, at.across), dot(point, at.axis));
  return ellipseDistance(vec2(spot.x, spot.y - at.facing * at.sweep), at.squash);
}

vec3 surface(Pose at, vec2 point, float onFace, float soft, float calm, float polish) {
  vec3 origin = transpose(uSpin) * vec3(point, 0.0);
  vec3 ray = -vec3(uSpin[0].z, uSpin[1].z, uSpin[2].z);
  float reach = abs(ray.z) > 0.0005 ? (at.facing * HALF - origin.z) / ray.z : 0.0;
  vec3 cap = origin + reach * ray;
  vec2 q = cap.xy * min(1.0, 0.985 / max(length(cap.xy), 0.0001));
  float a = dot(ray.xy, ray.xy);
  float b = dot(origin.xy, ray.xy);
  float c = dot(origin.xy, origin.xy) - 1.0;
  float inside = b * b - a * c;
  vec3 side = origin + ((-b - sqrt(max(inside, 0.0))) / max(a, 0.0001)) * ray;
  bool grazes = inside > 0.0 && abs(side.z) <= HALF * 1.2;
  float angle = grazes ? atan(side.y, side.x) : atan(cap.y, cap.x);
  float along = grazes ? clamp(side.z / HALF, -1.0, 1.0) : at.facing;
  vec3 color = mix(sideColor(angle, along, polish), faceColor(q, at.facing, soft, calm, polish), onFace);
  color = color / (1.0 + max(color - 1.0, 0.0) * 0.55);
  return pow(max(color, 0.0), vec3(1.0 / 2.2));
}

vec3 screen(vec3 color) {
  return pow(color, vec3(1.0 / 2.2));
}

vec3 toneColor(float tone) {
  vec3 tones[6] = vec3[6](uGroove, uEdge, uRim, uFace, uBevel, uGlint);
  return screen(tones[int(clamp(tone, 0.0, 5.0))]);
}

float edgeTone(vec2 point) {
  vec3 origin = transpose(uSpin) * vec3(point, 0.0);
  float light = dot(uSpin * normalize(vec3(origin.xy, 0.0)), uKey);
  return light > 0.3 ? 2.0 : (light > -0.25 ? 1.0 : 0.0);
}

float faceTone(Pose at, vec2 point) {
  vec3 origin = transpose(uSpin) * vec3(point, 0.0);
  vec3 ray = -vec3(uSpin[0].z, uSpin[1].z, uSpin[2].z);
  vec3 cap = origin + ((at.facing * HALF - origin.z) / ray.z) * ray;
  vec2 q = cap.xy;
  float r = length(q);
  float faceLight = dot(uSpin[2] * at.facing, uKey);
  float tone = faceLight > 0.9 ? 4.0 : (faceLight > 0.3 ? 3.0 : (faceLight > -0.15 ? 2.0 : 1.0));
  vec2 lightOnFace = vec2(dot(uKey, uSpin[0]), dot(uKey, uSpin[1]));
  float towardLight = dot(q / max(r, 0.001), lightOnFace / max(length(lightOnFace), 0.001));
  if (r > 0.7) tone += towardLight > 0.3 ? 1.0 : (towardLight < -0.3 ? -1.0 : 0.0);
  if (r < 0.7 && starDistance(q * 0.72) < 0.0) tone -= 1.0;
  vec3 mirrored = reflect(vec3(0.0, 0.0, -1.0), uSpin * normalize(vec3(q * DOME, at.facing)));
  float band = dot(mirrored, vec3(0.6402, -0.6402, 0.4243)) - 0.02;
  if (abs(band) < 0.085 && r < 0.92) tone += 1.0;
  if (dot(mirrored, uKey) > 0.985) tone = 5.0;
  return tone;
}

float twinkle(vec2 cell) {
  if (uFlare.z < 0.12) return 0.0;
  vec2 d = abs(cell - floor(uFlare.xy * TEXELS));
  float arm = floor(uFlare.z * 2.6 + 0.4);
  float reach = max(d.x, d.y);
  bool onArm = min(d.x, d.y) < 0.5 && reach <= arm;
  bool onCorner = arm >= 2.0 && d.x == 1.0 && d.y == 1.0;
  if (onArm) return reach < 0.5 ? 1.0 : (reach < arm ? 0.8 : 0.5);
  return onCorner ? 0.5 : 0.0;
}

vec4 texel(Pose at, vec2 cell) {
  vec2 point = (cell + 0.5) / TEXELS;
  float pitch = 1.0 / TEXELS;
  vec4 result = vec4(0.0);
  if (outlineAt(at, point) < 0.0) {
    bool onFace = faceEdgeAt(at, point) < 0.0;
    result = vec4(toneColor(onFace ? faceTone(at, point) : edgeTone(point)), 1.0);
  } else {
    float beside = min(
      min(outlineAt(at, point + vec2(pitch, 0.0)), outlineAt(at, point - vec2(pitch, 0.0))),
      min(outlineAt(at, point + vec2(0.0, pitch)), outlineAt(at, point - vec2(0.0, pitch)))
    );
    if (beside < 0.0) result = vec4(screen(mix(uShade, uGroove, 0.45)), 1.0);
  }
  float spark = twinkle(cell);
  vec4 flash = vec4(mix(screen(uBevel), vec3(1.0), spark), 1.0);
  return mix(result, flash, spark > 0.0 ? 0.4 + 0.6 * spark : 0.0);
}

vec4 pixelArt(Pose at, float softness) {
  vec2 t = vPoint * TEXELS - 0.5;
  vec2 base = floor(t);
  vec2 w = clamp((t - base - 0.5) / max(fwidth(t), vec2(softness)) + 0.5, 0.0, 1.0);
  vec4 c00 = texel(at, base);
  vec4 c10 = texel(at, base + vec2(1.0, 0.0));
  vec4 c01 = texel(at, base + vec2(0.0, 1.0));
  vec4 c11 = texel(at, base + vec2(1.0, 1.0));
  c00.rgb *= c00.a;
  c10.rgb *= c10.a;
  c01.rgb *= c01.a;
  c11.rgb *= c11.a;
  return mix(mix(c00, c10, w.x), mix(c01, c11, w.x), w.y);
}

vec4 outOfFocus(Pose at) {
  float edgeWidth = max(uBlur * 1.15, 0.7) / uRadius;
  float coverage = 1.0 - smoothstep(-edgeWidth, edgeWidth, outlineAt(at, vPoint));
  float onFace = 1.0 - smoothstep(-edgeWidth, edgeWidth, faceEdgeAt(at, vPoint));
  float soft = (0.8 + uBlur * 1.6) / uRadius;
  float polish = mix(0.66, 0.46, clamp(uBlur / 4.0, 0.0, 1.0));
  vec3 shown = surface(at, vPoint, onFace, soft, 1.0 / (1.0 + uBlur * 0.55), polish);
  vec2 away = vPoint - uFlare.xy;
  float bloom = exp(-dot(away, away) / (uFlare.w * uFlare.w * 0.3));
  return vec4(shown * coverage + screen(uGlint) * uFlare.z * bloom * 0.3, coverage);
}

void main() {
  Pose at = pose();
  float blurInTexels = uBlur * TEXELS / uRadius;
  float defocus = smoothstep(0.45, 1.5, blurInTexels);
  vec4 crisp = defocus < 1.0 ? pixelArt(at, min(blurInTexels, 0.5)) : vec4(0.0);
  vec4 soft = defocus > 0.0 ? outOfFocus(at) : vec4(0.0);
  outColor = mix(crisp, soft, defocus) * uOpacity;
}`;
