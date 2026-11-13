import { coinFragmentShader, coinVertexShader } from "@/demo/philosophy/figures/coin-shader";
import { keyLight, type Glint, type Spin } from "@/demo/philosophy/figures/coin-toss";
import { gold } from "@/demo/stickers/gold";

export interface CoinSprite {
  x: number;
  y: number;
  radius: number;
  spin: Spin;
  blur: number;
  opacity: number;
  glint: Glint;
}

const palette = {
  uFace: gold.face,
  uBack: gold.back,
  uRim: gold.rim,
  uBevel: gold.bevel,
  uEdge: gold.edge,
  uGroove: gold.groove,
  uGlint: gold.glint,
  uShade: gold.shade,
};

function linear(hex: string) {
  return [1, 3, 5].map((at) => (Number.parseInt(hex.slice(at, at + 2), 16) / 255) ** 2.2);
}

function compiled(gl: WebGL2RenderingContext, type: GLenum, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function linked(gl: WebGL2RenderingContext) {
  const program = gl.createProgram();
  const vertex = compiled(gl, gl.VERTEX_SHADER, coinVertexShader);
  const fragment = compiled(gl, gl.FRAGMENT_SHADER, coinFragmentShader);
  if (!vertex || !fragment) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function prepared(gl: WebGL2RenderingContext, program: WebGLProgram) {
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const corner = gl.getAttribLocation(program, "aCorner");
  gl.enableVertexAttribArray(corner);
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
  for (const [name, hex] of Object.entries(palette)) {
    gl.uniform3fv(gl.getUniformLocation(program, name), linear(hex));
  }
  gl.uniform3fv(gl.getUniformLocation(program, "uKey"), keyLight);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
}

const roomForOutlineAndSparkle = 1.6;

export function createCoinPainter(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2", { antialias: false });
  const program = gl && linked(gl);
  if (!gl || !program) return undefined;
  prepared(gl, program);
  const at = (name: string) => gl.getUniformLocation(program, name);
  const uniforms = {
    resolution: at("uResolution"),
    center: at("uCenter"),
    radius: at("uRadius"),
    extent: at("uExtent"),
    spin: at("uSpin"),
    blur: at("uBlur"),
    opacity: at("uOpacity"),
    flare: at("uFlare"),
  };

  return {
    clear() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    paint({ x, y, radius, spin, blur, opacity, glint }: CoinSprite) {
      gl.uniform2f(uniforms.center, x, y);
      gl.uniform1f(uniforms.radius, radius);
      gl.uniform1f(uniforms.extent, roomForOutlineAndSparkle + (blur * 2.5) / radius);
      gl.uniformMatrix3fv(uniforms.spin, false, [...spin.right, ...spin.up, ...spin.normal]);
      gl.uniform1f(uniforms.blur, blur);
      gl.uniform1f(uniforms.opacity, opacity);
      gl.uniform4f(uniforms.flare, glint.x, glint.y, glint.strength, 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}
