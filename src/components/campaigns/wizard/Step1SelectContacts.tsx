// components/campaigns/wizard/Step1SelectContacts.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contact, Channel } from '../NewCampaignWizard'; // Importamos los tipos

// --- DATOS SIMULADOS ---
const mockContacts: Contact[] = [
  { id: '1', name: 'Ana García', email: 'ana.garcia@example.com', phone: '+15551234567', origin: 'RENDER PG', consent: ['EMAIL', 'SMS'] },
  { id: '2', name: 'Carlos Rodríguez', email: 'carlos.r@example.com', phone: null, origin: 'GODADDY MYSQL', consent: ['EMAIL'] },
  { id: '3', name: 'Beatriz Fernández', email: 'bea.fernandez@example.com', phone: '+15553456789', origin: 'RENDER PG', consent: ['EMAIL'] },
  { id: '4', name: 'David Martínez', email: 'david.m@example.com', phone: '+15554567890', origin: 'GODADDY MYSQL', consent: ['EMAIL', 'SMS'] },
  { id: '5', name: 'Elena Pérez', email: 'elena.perez@example.com', phone: '+15555678901', origin: 'RENDER PG', consent: ['SMS'] },
  { id: '6', name: 'Juan Pérez', email: 'juan.perez@example.com', phone: '+15551234567', origin: 'RENDER PG', consent: [] },
];

// --- PROPS DEL COMPONENTE ---
interface Step1SelectContactsProps {
  selectedContacts: Contact[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export default function Step1SelectContacts({ selectedContacts, setSelectedContacts }: Step1SelectContactsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'RENDER PG' | 'GODADDY MYSQL'>('ALL');
  const [consentFilter, setConsentFilter] = useState<'ALL' | Channel>('ALL');

  const filteredContacts = useMemo(() => {
    return mockContacts.filter(contact => {
      const searchMatch = searchTerm === '' || 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const originMatch = originFilter === 'ALL' || contact.origin === originFilter;
      
      const consentMatch = consentFilter === 'ALL' || contact.consent.includes(consentFilter);

      return searchMatch && originMatch && consentMatch;
    });
  }, [searchTerm, originFilter, consentFilter]);
  
  const selectedIds = useMemo(() => new Set(selectedContacts.map(c => c.id)), [selectedContacts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(filteredContacts);
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectRow = (contact: Contact, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contact]);
    } else {
      setSelectedContacts(prev => prev.filter(c => c.id !== contact.id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paso 1: Seleccionar Contactos</h2>
        <p className="text-gray-500 mt-1">Elige los destinatarios para tu campaña. Puedes buscar y filtrar para acotar tu selección.</p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input 
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select value={originFilter} onValueChange={(value) => setOriginFilter(value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los orígenes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los orígenes</SelectItem>
            <SelectItem value="RENDER PG">Render PG</SelectItem>
            <SelectItem value="GODADDY MYSQL">GoDaddy MySQL</SelectItem>
          </SelectContent>
        </Select>
        <Select value={consentFilter} onValueChange={(value) => setConsentFilter(value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Cualquier consentimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Cualquier consentimiento</SelectItem>
            <SelectItem value="EMAIL">Email Opt-In</SelectItem>
            <SelectItem value="SMS">SMS/WA Opt-In</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de Contactos */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedContacts.length > 0 && selectedContacts.length === filteredContacts.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Origen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map(contact => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.has(contact.id)}
                    onCheckedChange={(checked) => handleSelectRow(contact, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email || 'N/A'}</TableCell>
                <TableCell>{contact.phone || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={contact.origin === 'RENDER PG' ? 'default' : 'secondary'}
                    className={contact.origin === 'RENDER PG' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                  >
                    {contact.origin}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Resumen y Paginación (simplificada) */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <p>{selectedContacts.length} de {filteredContacts.length} contactos seleccionados.</p>
        <div className="flex items-center gap-2">
          {/* Aquí iría un componente de paginación real */}
          <Button variant="outline" size="sm">Anterior</Button>
          <span>Página 1 de 1</span>
          <Button variant="outline" size="sm">Siguiente</Button>
        </div>
      </div>
    </div>
  );
}