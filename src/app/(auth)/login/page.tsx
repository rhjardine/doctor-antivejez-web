import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

// --- Componente de Fallback para Suspense ---
// Muestra una UI de carga mientras el componente principal se prepara.
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}

// --- Página Principal ---
// Esta página ahora envuelve el formulario en un <Suspense>,
// lo que resuelve el error de pre-renderizado en Next.js.
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary-dark/10 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
