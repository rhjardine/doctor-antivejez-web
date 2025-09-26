// src/app/(dashboard)/campaigns/page.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, History, Loader2 } from 'lucide-react';
import NewCampaignWizard from '@/components/campaigns/NewCampaignWizard';
import CampaignHistory from '@/components/campaigns/CampaignHistory';
import { Suspense } from 'react';

// Componente de esqueleto para una mejor UX mientras carga el historial
function CampaignHistorySkeleton() {
  return (
    <div className="border rounded-lg p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
      <div className="space-y-4">
        <div className="h-28 bg-gray-100 rounded"></div>
        <div className="h-28 bg-gray-100 rounded"></div>
        <div className="h-28 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800">
            Gestión de Campañas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Crea, gestiona y analiza tus campañas de comunicación multicanal.
          </p>
        </header>

        <Tabs defaultValue="new-campaign" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger 
              value="new-campaign"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <Send className="w-4 h-4 mr-2" />
              Nueva Campaña
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <History className="w-4 h-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new-campaign">
            {/* NewCampaignWizard debe ser un Client Component ('use client') */}
            <NewCampaignWizard />
          </TabsContent>

          <TabsContent value="history">
            <Suspense fallback={<CampaignHistorySkeleton />}>
              {/* CampaignHistory ahora es un Server Component que obtiene datos */}
              <CampaignHistory />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}