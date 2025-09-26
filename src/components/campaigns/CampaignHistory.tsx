// src/components/campaigns/CampaignHistory.tsx

import { getCampaigns } from '@/lib/actions/campaign.actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List, Clock, CheckCircle, XCircle, Send, Eye } from 'lucide-react';
import CampaignDetails from './CampaignDetails'; // Importamos el nuevo Server Component

// Helper para formatear fechas
const formatDate = (date: Date) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Helper para el estilo del badge de estado
const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status.toLowerCase().includes('completed')) return 'default';
  if (status.toLowerCase().includes('progress')) return 'secondary';
  if (status.toLowerCase().includes('failed')) return 'destructive';
  return 'outline';
};

const CampaignHistory = async () => {
  const campaigns = await getCampaigns();

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay campañas</CardTitle>
          <CardDescription>
            Aún no se ha enviado ninguna campaña.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <List className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">
            Los resultados de tus envíos aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Campañas</CardTitle>
        <CardDescription>
          Un registro de todas las campañas enviadas y su estado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">{campaign.name}</h3>
                  <Badge variant={getStatusVariant(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(campaign.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 flex-shrink-0" />
                    <span>{campaign.totalContacts} Contactos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{campaign.sentCount} Éxitos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>{campaign.failedCount} Fallos</span>
                  </div>
                </div>
              </div>
              <div className="w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
                {/* El Dialog ahora contiene el componente de detalles, que cargará los datos específicos */}
                <CampaignDetails campaignId={campaign.id} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignHistory;