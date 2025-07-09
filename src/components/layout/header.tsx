'use client';

import { Search, Bell, UserCircle } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    // Cabecera con el nuevo fondo azul oscuro y borde sutil
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Barra de búsqueda con estilos adaptados al fondo oscuro */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar pacientes, historias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-white text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>
        
        {/* Iconos de acción con colores adaptados */}
        <div className="flex items-center space-x-2 ml-6">
          <button className="relative p-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-primary/10">
            <Bell size={22} />
            {/* Notificación */}
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <button className="p-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-primary/10">
            <UserCircle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
