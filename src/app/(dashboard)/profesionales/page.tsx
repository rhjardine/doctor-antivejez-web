import { FaUserMd } from 'react-icons/fa';

export default function ProfesionalesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
      <div className="text-center">
        <FaUserMd className="text-8xl text-gray-300 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profesionales</h1>
        <p className="text-gray-600 mb-8">
          Esta sección está actualmente en desarrollo
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
          <span className="text-sm font-medium">Próximamente disponible</span>
        </div>
      </div>
    </div>
  );
}
