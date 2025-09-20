// components/campaigns/CampaignDetails.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Mail, Smartphone, MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
// ===== INICIO DE LA INTEGRACIÓN =====
import { getCampaignDetails } from '@/lib/actions/campaigns.actions';
import { toast } from 'sonner';
import { Campaign, CampaignMessage } from '@prisma/client'; // Importamos los tipos
// ===== FIN DE LA INTEGRACIÓN =====

// Combinamos los tipos para incluir los mensajes anidados
type CampaignWithMessages = Campaign & { messages: CampaignMessage[] };

const channelIcons: Record<string, React.ElementType> = {
  EMAIL: Mail,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
};

const statusIcons: Record<string, React.ElementType> = {
  Sent: CheckCircle,
  Failed: XCircle,
};

const statusColors: Record<string, string> = {
  Sent: 'text-green-600',
  Failed: 'text-red-600',
};

export default function CampaignDetails({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<CampaignWithMessages | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const result = await getCampaignDetails(campaignId);
      if (result.success && result.data) {
        setCampaign(result.data as CampaignWithMessages);
      } else {
        toast.error(result.error || 'No se pudieron cargar los detalles.');
      }
      setLoading(false);
    };
    fetchDetails();
  }, [campaignId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return <p className="text-center text-red-500">No se encontraron datos para esta campaña.</p>;
  }

  const totalProcessed = campaign.sentCount + campaign.failedCount;
  const progress = campaign.totalContacts > 0 ? (totalProcessed / campaign.totalContacts) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{campaign.name}</CardTitle>
          <CardDescription>
            Campaña enviada el {new Date(campaign.createdAt).toLocaleDateString('es-ES')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <Badge>{campaign.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contactos Totales</p>
              <p className="text-2xl font-bold">{campaign.totalContacts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Envíos Exitosos</p>
              <p className="text-2xl font-bold text-green-600">{campaign.sentCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Envíos Fallidos</p>
              <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
            </div>
          </div>
          <div>
            <Label>Progreso General</Label>
            <Progress value={progress} className="w-full mt-1" />
          </div>
          <div>
            <Label>Cuerpo del Mensaje</Label>
            <div className="p-4 bg-slate-50 rounded-md border mt-1">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{campaign.messageBody}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Envíos Individuales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contacto</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaign.messages.map((msg) => {
                const Icon = statusIcons[msg.status];
                const color = statusColors[msg.status];
                const ChannelIcon = channelIcons[msg.channel];
                return (
                  <TableRow key={msg.id}>
                    <TableCell className="font-medium">{msg.contactName}</TableCell>
                    <TableCell>
                      {ChannelIcon && <ChannelIcon className="w-5 h-5 text-gray-500" />}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${color}`}>
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{msg.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {msg.status === 'Failed' ? (msg.error || 'Error desconocido') : `ID: ${msg.providerId || 'N/A'}`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}