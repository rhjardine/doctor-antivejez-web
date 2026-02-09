'use client';

import { Search, Bell, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar pacientes, historias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center space-x-4 ml-6">
          <ThemeToggle />

          <button className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-all">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>

          <button className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-muted-foreground hover:text-foreground transition-all">
            <UserCircle size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
