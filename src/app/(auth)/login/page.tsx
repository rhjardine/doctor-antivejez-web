'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth.actions';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(formData);

      if (result.success) {
        toast.success('Inicio de sesión exitoso');
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Error al iniciar sesión');
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary-dark/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-dark mb-2">Doctor AntiVejez</h1>
          <p className="text-gray-600">Sistema de Gestión Médica Antienvejecimiento</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="doctor@ejemplo.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p className="font-medium mb-1">Credenciales de prueba:</p>
            <p>Email: admin@doctorantivejez.com</p>
            <p>Contraseña: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
