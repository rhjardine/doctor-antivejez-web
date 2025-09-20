// components/campaigns/CampaignHistory.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Mail, Smartphone, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CampaignDetails from './CampaignDetails';
// ===== INICIO DE LA INTEGRACIÓN =====
import { getCampaignHistory } from '@/lib/actions/campaigns.actions';
import { toast } from 'sonner';
import { Campaign } from '@prisma/client'; // Importamos el tipo generado por Prisma
// ===== FIN DE LA INTEGRACIÓN =====

type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP';

const statusConfig: Record<string, { label: string; className: string }> = {
  IN_PROGRESS: { label: 'En Progreso', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  COMPLETED: { label: 'Completada', className: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED_WITH_ERRORS: { label: 'Completada con Errores', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  FAILED: { label: 'Fallida', className: 'bg-red-100 text-red-800 border-red-200' },
};

const channelIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
};

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  useEffect(() => {
    // Solo cargamos el historial si no estamos viendo los detalles de una campaña
    if (!selectedCampaignId) {
      const fetchCampaigns = async () => {
        setLoading(true);
        const result = await getCampaignHistory();
        if (result.success && result.data) {
          setCampaigns(result.data);
        } else {
          toast.error(result.error || 'No se pudo cargar el historial.');
        }
        setLoading(false);
      };
      fetchCampaigns();
    }
  }, [selectedCampaignId]); // Se vuelve a ejecutar cuando volvemos de la vista de detalles

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
                const totalProcessed = campaign.sentCount + campaign.failedCount;
                const progress = campaign.totalContacts > 0 ? (totalProcessed / campaign.totalContacts) * 100 : 0;
                const statusInfo = statusConfig[campaign.status] || { label: campaign.status, className: 'bg-gray-100 text-gray-800' };
                return (
                  <TableRow 
                    key={campaign.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedCampaignId(campaign.id)}
                  >
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {campaign.channels.map(channel => {
                           const Icon = channelIcons[channel];
                           return Icon ? <Icon key={channel} className="w-5 h-5 text-gray-500" title={channel} /> : null;
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
                        {totalProcessed} / {campaign.totalContacts} procesados
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