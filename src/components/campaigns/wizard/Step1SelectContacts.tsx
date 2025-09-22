'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contact, Channel } from '../NewCampaignWizard';
import { getContactsFromDB } from '@/lib/actions/campaigns.actions';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { parse } from 'csv-parse/sync';
import { Label } from '@/components/ui/label'; // <-- Añadí esta importación que probablemente faltaba

interface Step1SelectContactsProps {
  selectedContacts: Contact[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
}

export default function Step1SelectContacts({ selectedContacts, setSelectedContacts }: Step1SelectContactsProps) {
  const [dbContacts, setDbContacts] = useState<Contact[]>([]);
  const [csvContacts, setCsvContacts] = useState<Contact[]>([]);
  const [contactSource, setContactSource] = useState<'db' | 'csv'>('db');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadDbContacts = async () => {
      setLoading(true);
      const result = await getContactsFromDB();
      if (result.success && result.data) {
        setDbContacts(result.data);
      } else {
        toast.error(result.error || 'Error al cargar contactos de la base de datos.');
      }
      setLoading(false);
    };
    loadDbContacts();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast.error('Por favor, seleccione un archivo con formato CSV.');
      return;
    }

    setLoading(true);
    try {
      const fileContent = await file.text();
      const records: any[] = parse(fileContent, {
        columns: header => header.map((h: string) => h.toLowerCase().trim()),
        skip_empty_lines: true,
      });

      // ===== INICIO DE LA CORRECCIÓN =====
      // Le decimos explícitamente a TypeScript que el valor 'GODADDY MYSQL'
      // es del tipo esperado por la interfaz 'Contact'.
      const importedContacts: Contact[] = records.map((record, index) => {
        const phone = (record.phone_code && record.phone) 
          ? `+58${record.phone_code}${record.phone}` 
          : ((record.cellphone_code && record.cellphone) 
              ? `+58${record.cellphone_code}${record.cellphone}` 
              : null);

        return {
          id: `csv-${record.identification_id || index}`,
          name: `${record.names || ''} ${record.surnames || ''}`.trim(),
          email: record.email && record.email !== 'NULL' ? record.email : null,
          phone: phone,
          origin: 'GODADDY MYSQL', // TypeScript ahora entiende que este valor es válido
          consent: ['WHATSAPP'],
        };
      }).filter(c => c.phone);

      setCsvContacts(importedContacts);
      // ===== FIN DE LA CORRECCIÓN =====
      setContactSource('csv');
      setSelectedContacts([]);
      toast.success(`${importedContacts.length} contactos cargados desde CSV.`);
    } catch (error: any) {
      toast.error('Error al procesar el archivo CSV', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const allContacts = contactSource === 'db' ? dbContacts : csvContacts;

  const filteredContacts = useMemo(() => {
    return allContacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <p className="text-gray-500 mt-1">Elige los destinatarios para tu campaña.</p>
      </div>

      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border">
        <div className="flex-1">
          <h3 className="font-semibold">Fuente de Contactos</h3>
          <div className="flex gap-2 mt-2">
            <Button variant={contactSource === 'db' ? 'default' : 'outline'} onClick={() => { setContactSource('db'); setSelectedContacts([]); }}>
              Pacientes (Render PG)
            </Button>
            <Button variant={contactSource === 'csv' ? 'default' : 'outline'} onClick={() => { setContactSource('csv'); setSelectedContacts([]); }}>
              Desde Archivo (MySQL Legado)
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <Label htmlFor="csv-upload" className="font-semibold">Cargar Archivo Legado</Label>
          <div className="relative mt-2">
            <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="pr-12" />
            <Upload className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <Input 
        placeholder="Buscar por nombre..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
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
              <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell><Checkbox checked={selectedIds.has(contact.id)} onCheckedChange={(checked) => handleSelectRow(contact, !!checked)} /></TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.email || 'N/A'}</TableCell>
                  <TableCell>{contact.phone || 'N/A'}</TableCell>
                  <TableCell><Badge variant={contact.origin === 'RENDER PG' ? 'default' : 'secondary'}>{contact.origin}</Badge></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="h-48 text-center text-gray-500">No se encontraron contactos.</TableCell></TableRow>
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