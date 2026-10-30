"use client";

import React, { useEffect, useRef, useState } from "react";

interface ThreeRuntime {
  WebGLRenderer: new (options: {
    canvas: HTMLCanvasElement;
    alpha: boolean;
    antialias: boolean;
  }) => {
    setPixelRatio: (ratio: number) => void;
    setSize: (width: number, height: number) => void;
    render: (scene: unknown, camera: unknown) => void;
    dispose: () => void;
  };
  Scene: new () => { add: (mesh: unknown) => void };
  OrthographicCamera: new (
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number,
  ) => unknown;
  Vector2: new (x: number, y: number) => {
    set: (x: number, y: number) => void;
  };
  Vector3: new (x: number, y: number, z: number) => unknown;
  ShaderMaterial: new (options: Record<string, unknown>) => {
    dispose: () => void;
  };
  PlaneGeometry: new (width: number, height: number) => {
    dispose: () => void;
  };
  Mesh: new (geometry: unknown, material: unknown) => unknown;
  GLSL3: unknown;
  CustomBlending: unknown;
  SrcAlphaFactor: unknown;
  OneFactor: unknown;
}

interface ThreeRenderer {
  setPixelRatio: (ratio: number) => void;
  setSize: (width: number, height: number) => void;
  render: (scene: unknown, camera: unknown) => void;
  dispose: () => void;
}

interface ThreeGeometry {
  dispose: () => void;
}

interface ThreeMaterial {
  dispose: () => void;
}

declare global {
  interface Window {
    THREE?: ThreeRuntime;
  }
}

const shaderVertex = `
  precision mediump float;
  uniform vec2 u_resolution;
  out vec2 fragCoord;
  void main() {
    gl_Position = vec4(position, 1.0);
    fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
    fragCoord.y = u_resolution.y - fragCoord.y;
  }
`;

const shaderFragment = `
  precision mediump float;
  in vec2 fragCoord;
  uniform float u_time;
  uniform float u_opacities[10];
  uniform vec3 u_colors[6];
  uniform float u_total_size;
  uniform float u_dot_size;
  uniform vec2 u_resolution;
  out vec4 fragColor;

  float PHI = 1.61803398874989484820459;
  float random(vec2 xy) {
    return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
  }

  void main() {
    vec2 st = fragCoord.xy;
    st -= abs(floor((mod(u_resolution, u_total_size) - u_dot_size) * 0.5));
    float opacity = step(0.0, st.x) * step(0.0, st.y);
    vec2 grid = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
    float showOffset = random(grid);
    float randomOpacity = random(grid * floor(u_time / 5.0 + showOffset + 5.0));
    opacity *= u_opacities[int(randomOpacity * 10.0)];
    opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
    opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
    float intro = distance(u_resolution / 2.0 / u_total_size, grid) * 0.01;
    opacity *= step(intro, u_time * 3.0);
    fragColor = vec4(u_colors[int(showOffset * 6.0)], opacity);
    fragColor.rgb *= fragColor.a;
  }
`;

function SocialIcon({ type }: { type: "google" | "github" | "apple" }) {
  if (type === "google") {
    return (
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0" aria-hidden="true">
      {type === "github" ? (
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" />
      ) : (
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.79 3.59-.76 1.56.04 2.88.75 3.65 1.89-3.08 1.75-2.58 5.61.35 6.75-1.01 2.37-2.39 4.39-4.29 4.29zM12.03 7.25c-.15-2.23 1.66-4.07 3.72-4.25.36 2.38-1.92 4.34-3.72 4.25z" />
      )}
    </svg>
  );
}

export default function ModernLoginSignup() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    let active = true;
    let animationId = 0;
    let cleanupResize: (() => void) | undefined;
    let renderer: ThreeRenderer | undefined;
    let geometry: ThreeGeometry | undefined;
    let material: ThreeMaterial | undefined;

    const initThree = (three: ThreeRuntime) => {
      if (!canvasRef.current || !active) return;
      renderer = new three.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: false,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      const scene = new three.Scene();
      const camera = new three.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const resolution = new three.Vector2(window.innerWidth * 2, window.innerHeight * 2);
      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: resolution },
        u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1] },
        u_colors: { value: Array.from({ length: 6 }, () => new three.Vector3(1, 1, 1)) },
        u_total_size: { value: 20 },
        u_dot_size: { value: 6 },
      };
      material = new three.ShaderMaterial({
        vertexShader: shaderVertex,
        fragmentShader: shaderFragment,
        uniforms,
        glslVersion: three.GLSL3,
        blending: three.CustomBlending,
        blendSrc: three.SrcAlphaFactor,
        blendDst: three.OneFactor,
        transparent: true,
      });
      geometry = new three.PlaneGeometry(2, 2);
      scene.add(new three.Mesh(geometry, material));
      const startTime = performance.now();
      const animate = () => {
        if (!active || !renderer) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000;
        renderer.render(scene, camera);
      };
      animate();
      const handleResize = () => {
        renderer?.setSize(window.innerWidth, window.innerHeight);
        resolution.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener("resize", handleResize);
      cleanupResize = () => window.removeEventListener("resize", handleResize);
    };

    if (window.THREE) {
      initThree(window.THREE);
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.async = true;
      script.onload = () => {
        if (window.THREE) initThree(window.THREE);
      };
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      cleanupResize?.();
      if (animationId) cancelAnimationFrame(animationId);
      renderer?.dispose();
      geometry?.dispose();
      material?.dispose();
    };
  }, []);

  const socialButton =
    "flex w-full items-center justify-center gap-2 rounded-md border border-neutral-700 bg-transparent px-3 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
  const input =
    "w-full rounded-md border border-[#3E5A3F] bg-[#0F1F17] px-3.5 py-2.5 text-sm text-[#C7CBB8] outline-none placeholder:text-[#6B7F67] focus:border-[#C7CBB8] focus:ring-2 focus:ring-[#C7CBB8]/10";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0F1F17] px-4 font-sans text-[#C7CBB8]">
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,31,23,0.45),transparent)]" />
      <section className="relative z-10 flex w-full max-w-[400px] flex-col items-center rounded-xl border border-[#3E5A3F] bg-[#1E3A2E] p-8 shadow-2xl">
        <div className="flex w-full max-w-[360px] flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-full border border-[#6B7F67] bg-[#0F1F17] font-pixel text-lg font-bold text-[#C7CBB8]">
            CP
          </div>
          <h1 className="font-display text-[1.05rem] leading-7 tracking-tight sm:text-[1.15rem]">
            {isLogin ? "Sign in to CampusPulse" : "Create your CampusPulse account"}
          </h1>
          <p className="mb-4 mt-1 text-sm leading-6 text-[#6B7F67]">
            {isLogin ? "Sign in to your account." : "Create a new account to get started."}
          </p>

          <form
            className="flex w-full flex-col gap-2.5"
            onSubmit={(event) => event.preventDefault()}
          >
            {!isLogin && (
              <input className={input} type="text" placeholder="Full name" aria-label="Full name" required />
            )}
            <input className={input} type="email" placeholder="name@work-email.com" aria-label="Email address" required />
            <button type="submit" className="w-full rounded-md bg-neutral-100 px-3 py-2.5 text-sm font-medium text-black transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {isLogin ? "Continue with email" : "Sign up with email"}
            </button>
          </form>

          <div className="my-4 h-px w-full bg-neutral-800" />
          <button type="button" className={socialButton}><SocialIcon type="google" />{isLogin ? "Continue with Google" : "Sign up with Google"}</button>
          <button type="button" className={`${socialButton} mt-1.5`}><SocialIcon type="github" />{isLogin ? "Continue with GitHub" : "Sign up with GitHub"}</button>
          <button type="button" className={`${socialButton} mt-1.5`}><SocialIcon type="apple" />{isLogin ? "Continue with Apple" : "Sign up with Apple"}</button>

          <p className="mt-5 text-sm text-neutral-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin((current) => !current)}
              className="font-medium text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
          <p className="mt-3 text-center text-xs leading-5 text-neutral-600">
            By proceeding, you agree to our{" "}
            <a href="#" className="text-neutral-400 underline">Terms of Service</a>{" "}
            and <a href="#" className="text-neutral-400 underline">Privacy Policy</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
