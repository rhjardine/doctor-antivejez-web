'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contact } from '../NewCampaignWizard'; // Se importa el tipo 'Contact' actualizado
import { getContactsFromDB } from '@/lib/actions/campaigns.actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Step1SelectContactsProps {
  selectedContacts: Contact[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export default function Step1SelectContacts({ selectedContacts, setSelectedContacts }: Step1SelectContactsProps) {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
    if (!searchTerm) return allContacts;
    return allContacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allContacts]);
  
  const selectedIds = useMemo(() => new Set(selectedContacts.map(c => c.id)), [selectedContacts]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedContacts(checked ? filteredContacts : []);
  };

  const handleSelectRow = (contact: Contact, checked: boolean) => {
    setSelectedContacts(prev => 
      checked ? [...prev, contact] : prev.filter(c => c.id !== contact.id)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paso 1: Seleccionar Contactos</h2>
        <p className="text-gray-500 mt-1">Elige los destinatarios para tu campaña. La lista incluye todos los pacientes del sistema.</p>
      </div>

      {/* ===== REFACTORIZACIÓN: SE ELIMINAN LOS FILTROS DE ORIGEN ===== */}
      <Input 
        placeholder="Buscar por nombre o email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-48 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell><Checkbox checked={selectedIds.has(contact.id)} onCheckedChange={(checked) => handleSelectRow(contact, !!checked)} /></TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email || 'N/A'}</TableCell>
                  <TableCell>{contact.phone || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4} className="h-48 text-center text-gray-500">No se encontraron contactos.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-600">
        <p>{selectedContacts.length} de {filteredContacts.length} contactos seleccionados.</p>
      </div>
    </div>
  );
}