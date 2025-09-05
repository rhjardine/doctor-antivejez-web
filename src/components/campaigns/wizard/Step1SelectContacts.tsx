// components/campaigns/wizard/Step1SelectContacts.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contact, Channel } from '../NewCampaignWizard';
// ===== INICIO DE LA CONEXIÓN AL BACKEND =====
import { getContactsFromDB } from '@/lib/actions/campaigns.actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
// ===== FIN DE LA CONEXIÓN AL BACKEND =====

interface Step1SelectContactsProps {
  selectedContacts: Contact[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export default function Step1SelectContacts({ selectedContacts, setSelectedContacts }: Step1SelectContactsProps) {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'RENDER PG' | 'GODADDY MYSQL'>('ALL');
  const [consentFilter, setConsentFilter] = useState<'ALL' | Channel>('ALL');

  useEffect(() => {
    const loadContacts = async () => {
      setLoading(true);
      const result = await getContactsFromDB();
      if (result.success && result.data) {
        setAllContacts(result.data);
      } else {
        toast.error(result.error || 'Error al cargar contactos.');
      }
      setLoading(false);
    };
    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    return allContacts.filter(contact => {
      const searchMatch = searchTerm === '' || 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const originMatch = originFilter === 'ALL' || contact.origin === originFilter;
      
      const consentMatch = consentFilter === 'ALL' || contact.consent.includes(consentFilter);

      return searchMatch && originMatch && consentMatch;
    });
  }, [searchTerm, originFilter, consentFilter, allContacts]);
  
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
            <SelectItem value="GODADDY MYSQL" disabled>GoDaddy MySQL (Próximamente)</SelectItem>
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

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={!loading && filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length}
                  onCheckedChange={handleSelectAll}
                  disabled={loading || filteredContacts.length === 0}
                />
              </TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Origen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-gray-500">Cargando contactos...</p>
                </TableCell>
              </TableRow>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-gray-500">
                  No se encontraron contactos con los filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <p>{selectedContacts.length} de {filteredContacts.length} contactos seleccionados.</p>
        {/* Paginación futura */}
      </div>
    </div>
  );
}