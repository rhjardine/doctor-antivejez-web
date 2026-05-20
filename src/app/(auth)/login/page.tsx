'use client';

import { useState, useEffect, useRef, Suspense } from 'react';

// ─── Resolución Segura de Dependencias para Next.js ──────────────────────
// Usamos referencias dinámicas con require para evitar que el compilador del visor lance errores de resolución estática.
let signIn: any = async () => ({ error: null });
let useRouter: any = () => ({ push: () => {}, refresh: () => {} });
let useSearchParams: any = () => ({ get: () => null });

try {
  const nextAuth = require('next-auth/react');
  signIn = nextAuth.signIn;
} catch (e) {
  // Fallback seguro si no está en entorno Next.js
}

try {
  const nextNav = require('next/navigation');
  useRouter = nextNav.useRouter;
  useSearchParams = nextNav.useSearchParams;
} catch (e) {
  // Fallback seguro si no está en entorno Next.js
}

// ─── Clase de Partícula de Longevidad / ADN para Canvas ───────────────────
class BiotechParticle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  size: number = 0;
  alpha: number = 0;
  type: 'dna' | 'cell' | 'atom' = 'cell';
  angle: number = 0;
  rotationSpeed: number = 0;
  amplitude: number = 0;
  frequency: number = 0;

  constructor(width: number, height: number) {
    this.reset(width, height, true);
  }

  reset(width: number, height: number, init = false) {
    this.x = Math.random() * width;
    this.y = init ? Math.random() * height : height + 50; // Iniciar desde abajo si es regeneración
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -(Math.random() * 0.4 + 0.1); // Flotar suavemente hacia arriba
    this.size = Math.random() * 3 + 1.5;
    this.alpha = Math.random() * 0.4 + 0.15;
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.01;
    this.amplitude = Math.random() * 15 + 5;
    this.frequency = Math.random() * 0.02 + 0.005;

    // Distribución de tipos de micropartículas clínicas
    const rand = Math.random();
    if (rand < 0.25) {
      this.type = 'dna';
      this.size = Math.random() * 6 + 12; // Las hebras de ADN son estructuras más grandes
    } else if (rand < 0.45) {
      this.type = 'atom';
      this.size = Math.random() * 5 + 6;
    } else {
      this.type = 'cell';
    }
  }

  update(width: number, height: number, mouseX: number, mouseY: number) {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += this.rotationSpeed;

    // Interacción suave de antigravedad con el puntero del ratón
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 180) {
      const force = (180 - dist) / 180;
      // Empujar suavemente las partículas en dirección opuesta al ratón
      this.x += (dx / dist) * force * 1.5;
      this.y += (dy / dist) * force * 1.5;
    }

    // Si salen de la pantalla, regenerar abajo
    if (this.y < -50 || this.x < -50 || this.x > width + 50) {
      this.reset(width, height);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'dna') {
      // 🧬 DIBUJAR HEBRA DE ADN PROCEDURAL EN MINIATURA
      const length = this.size * 1.8;
      const points = 8;
      ctx.beginPath();
      ctx.strokeStyle = '#23bcef';
      ctx.lineWidth = 1;

      // Cadena A y B con diferencia de fase de Pi
      for (let i = 0; i < points; i++) {
        const t = (i / points) * length - length / 2;
        const wave1 = Math.sin(i * 0.8) * 6;
        const wave2 = Math.sin(i * 0.8 + Math.PI) * 6;

        // Dibujar peldaño/enlace de bases nitrogenadas
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(35, 188, 239, ${this.alpha * 0.6})`;
          ctx.moveTo(t, wave1);
          ctx.lineTo(t, wave2);
          ctx.stroke();
        }

        // Nodo de la cadena A
        ctx.beginPath();
        ctx.fillStyle = '#23bcef';
        ctx.arc(t, wave1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Nodo de la cadena B
        ctx.beginPath();
        ctx.fillStyle = '#1e40af';
        ctx.arc(t, wave2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'atom') {
      // ⚛️ CÉLULA NÚCLEO / ÁTOMO DE LONGEVIDAD
      ctx.beginPath();
      ctx.strokeStyle = '#23bcef';
      ctx.lineWidth = 0.8;
      // Órbita elíptica 1
      ctx.ellipse(0, 0, this.size, this.size / 2.5, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      // Órbita elíptica 2
      ctx.ellipse(0, 0, this.size, this.size / 2.5, -Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();

      // Núcleo brillante
      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ⚪ MICROESFERA/COLÁGENO FLOTANTE
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.3, 'rgba(35, 188, 239, 0.5)');
      gradient.addColorStop(1, 'rgba(7, 11, 26, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ─── FORMULARIO DE INICIO DE SESIÓN (AISLADO PARA SUSPENSE) ────────────────

function LoginFormCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados de inicio de sesión
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Capturar errores del query-string (ej. redirección por bloqueo del middleware)
  const isBlocked = searchParams ? searchParams.get('blocked') : null;

  // 🔐 Envío del formulario de Login hacia NextAuth
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        // Manejo semántico de errores del proveedor de credenciales (Throttling, etc.)
        if (res.error.includes('attempts') || res.error.includes('intentos')) {
          setError(res.error);
        } else {
          setError('Credenciales incorrectas. Verifique su correo y contraseña.');
        }
        setLoading(false);
      } else {
        // Redirección exitosa con recarga forzada para sincronizar la nueva cookie de sesión
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('[Login Submit Error]:', err);
      setError('Ocurrió un error en el servidor. Intente de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0c122c]/65 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.6)] p-8 relative overflow-hidden transition-all duration-300 hover:border-white/20 w-full">
      
      {/* Destello sutil en el borde superior de la caja */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#23bcef]/45 to-transparent" />

      {/* 🎯 Logotipo Integrado Estilo PWA (Fusión Cromática con mix-blend-screen) */}
      <div className="flex flex-col items-center mb-8 relative">
        <div className="absolute -top-6 w-32 h-10 bg-[#23bcef]/25 blur-2xl rounded-full pointer-events-none" />
        <div className="relative drop-shadow-[0_0_15px_rgba(35,188,239,0.3)]">
          <img
            src="/images/Logoico.jpeg"
            alt="Doctor AntiVejez Logo"
            width={200}
            height={55}
            className="mix-blend-screen select-none object-contain"
          />
        </div>
        <p className="text-[10px] text-[#23bcef] tracking-[0.25em] font-black uppercase text-center mt-4">
          Portal Clínico Profesional
        </p>
      </div>

      {/* ⚠️ Alertas de Seguridad o Errores de Acceso */}
      {isBlocked && !error && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-[11px] text-amber-200 font-bold uppercase tracking-wider leading-snug">
            Acceso restringido. Inicie sesión con una cuenta autorizada para este módulo.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="text-[11px] text-red-200 font-bold uppercase tracking-wider leading-snug">
            {error}
          </p>
        </div>
      )}

      {/* 📝 Formulario */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Campo Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
            Correo Electrónico
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-[#23bcef] transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <input
              id="email"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@doctorantivejez.com"
              className="w-full bg-[#070b1a]/70 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#23bcef]/50 focus:ring-2 focus:ring-[#23bcef]/10 focus:bg-[#070b1a]/95"
            />
          </div>
        </div>

        {/* Campo Contraseña */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">
            Contraseña de Acceso
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-[#23bcef] transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <input
              id="password"
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#070b1a]/70 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-[#23bcef]/50 focus:ring-2 focus:ring-[#23bcef]/10 focus:bg-[#070b1a]/95"
            />
          </div>
        </div>

        {/* Botón de Envío Premium (Gradiente y Aura Neon al pasar cursor) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full relative group mt-8 h-12 bg-gradient-to-r from-[#23bcef] to-blue-600 hover:from-[#39c8f9] hover:to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_4px_20px_rgba(35,188,239,0.3)] hover:shadow-[0_4px_30px_rgba(35,188,239,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando credenciales...
            </span>
          ) : (
            'Ingresar al Sistema'
          )}
        </button>
      </form>

      {/* Copyright sutil corporativo */}
      <div className="mt-8 text-center">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
          © {new Date().getFullYear()} Doctor AntiVejez · Longevity System
        </span>
      </div>

    </div>
  );
}

// ─── CONTENEDOR PRINCIPAL (PAGE LAYOUT CON INTEGRACIÓN CANVAS) ─────────────

export default function LoginPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tracking de ratón para el efecto Antigravedad
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // 🧪 Inicializador del Canvas interactivo de partículas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: BiotechParticle[] = [];

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Ajustar densidad de partículas según resolución de pantalla para optimizar rendimiento
      const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 25000), 55);
      particles = Array.from({ length: particleCount }, () => new BiotechParticle(canvas.width, canvas.height));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Bucle de renderizado fluido
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar fondo degradado sutil de forma nativa para mejor integración cromática
      const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGradient.addColorStop(0, '#070b1a');
      bgGradient.addColorStop(1, '#0e1736');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Actualizar y dibujar cada microestructura de ADN/célula
      particles.forEach((p) => {
        p.update(canvas.width, canvas.height, mouseRef.current.x, mouseRef.current.y);
        p.draw(ctx);
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      {/* 🔮 Lienzo del fondo dinámico interactivo */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* 💡 Luces volumétricas decorativas fijas para atmósfera estética */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-[#23bcef]/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-blue-600/[0.06] blur-[150px] pointer-events-none z-0" />

      {/* 📦 Contenedor del Formulario Estilo Glassmorphism protegido con Suspense */}
      <div className="relative z-10 w-full max-w-md px-6 py-12">
        <Suspense fallback={
          <div className="bg-[#0c122c]/65 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_24px_50px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center min-h-[450px]">
            <svg className="animate-spin h-8 w-8 text-[#23bcef] mb-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-[10px] text-[#23bcef] tracking-[0.25em] font-black uppercase text-center">
              Cargando Portal...
            </p>
          </div>
        }>
          <LoginFormCard />
        </Suspense>
      </div>
    </div>
  );
}