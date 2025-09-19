// components/campaigns/CampaignHistory.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mail, Smartphone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
// ===== INICIO DE LA INTEGRACIÓN =====
// Importamos el nuevo componente de detalles
import CampaignDetails from './CampaignDetails';
// ===== FIN DE LA INTEGRACIÓN =====

type CampaignStatus = 'QUEUED' | 'SENDING' | 'COMPLETED' | 'CANCELED';
type Channel = 'EMAIL' | 'SMS';

interface Campaign {
  id: string;
  name: string;
  channels: Channel[];
  status: CampaignStatus;
  totalContacts: number;
  sentCount: number;
  createdAt: string;
}

const mockCampaigns: Campaign[] = [
  { id: 'cam_123', name: 'Recordatorio Citas Septiembre', channels: ['EMAIL', 'SMS'], status: 'COMPLETED', totalContacts: 150, sentCount: 148, createdAt: '2025-09-01T10:00:00Z' },
  { id: 'cam_456', name: 'Promoción Bienestar Otoño', channels: ['EMAIL'], status: 'SENDING', totalContacts: 4200, sentCount: 1250, createdAt: '2025-09-05T11:30:00Z' },
  { id: 'cam_789', name: 'Resultados de Laboratorio', channels: ['SMS'], status: 'QUEUED', totalContacts: 50, sentCount: 0, createdAt: '2025-09-06T09:00:00Z' },
];

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  QUEUED: { label: 'En Cola', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  SENDING: { label: 'Enviando', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-800 border-green-200' },
  CANCELED: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-red-200' },
};

const channelIcons: Record<Channel, React.ElementType> = {
  EMAIL: Mail,
  SMS: Smartphone,
};

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  // ===== INICIO DE LA INTEGRACIÓN =====
  // Nuevo estado para manejar la vista de detalles
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  // ===== FIN DE LA INTEGRACIÓN =====

  useEffect(() => {
    const fetchCampaigns = () => {
      setLoading(true);
      setTimeout(() => {
        setCampaigns(mockCampaigns);
        setLoading(false);
      }, 1000);
    };
    fetchCampaigns();
  }, []);

  // Si hay una campaña seleccionada, mostramos el componente de detalles
  if (selectedCampaignId) {
    return (
      <div>
        <Button 
          variant="outline" 
          onClick={() => setSelectedCampaignId(null)} 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Historial
        </Button>
        <CampaignDetails campaignId={selectedCampaignId} />
      </div>
    );
  }

  // Si no, mostramos la tabla del historial
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Campañas</CardTitle>
        <CardDescription>Visualiza el estado y las métricas de tus campañas. Haz clic en una campaña para ver los detalles.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Canales</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Progreso</TableHead>
              <TableHead className="text-right">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               <TableRow>
                 <TableCell colSpan={5} className="h-24 text-center">
                   <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                 </TableCell>
               </TableRow>
            ) : campaigns.length > 0 ? (
              campaigns.map(campaign => {
                const progress = campaign.totalContacts > 0 ? ((campaign.sentCount) / campaign.totalContacts) * 100 : 0;
                const statusInfo = statusConfig[campaign.status];
                return (
                  // ===== INICIO DE LA INTEGRACIÓN =====
                  // Hacemos que toda la fila sea clickeable
                  <TableRow 
                    key={campaign.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedCampaignId(campaign.id)}
                  >
                  {/* ===== FIN DE LA INTEGRACIÓN ===== */}
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {campaign.channels.map(channel => {
                           const Icon = channelIcons[channel];
                           return <Icon key={channel} className="w-5 h-5 text-gray-500" title={channel} />
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <Progress value={progress} className="w-[60%]" />
                         <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {campaign.sentCount} / {campaign.totalContacts} enviados
                      </p>
                    </TableCell>
                    <TableCell className="text-right">{new Date(campaign.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  No se han creado campañas todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}