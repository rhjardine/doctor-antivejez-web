// components/campaigns/NewCampaignWizard.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Importaremos los componentes de los pasos cuando los creemos
// import Step1SelectContacts from './wizard/Step1SelectContacts';
// import Step2ComposeMessage from './wizard/Step2ComposeMessage';
// import Step3ReviewAndSend from './wizard/Step3ReviewAndSend';

// ===== ANÁLISIS Y CONVERSIÓN =====
// 1. Definimos tipos para la configuración de la campaña y los contactos
export type Channel = 'EMAIL' | 'SMS';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  origin: 'RENDER PG' | 'GODADDY MYSQL';
  consent: Channel[];
}

export interface CampaignConfig {
  name: string;
  channels: Set<Channel>;
  message: string;
  mediaFile: File | null;
}

const steps = [
  { id: 1, name: 'Seleccionar Contactos', description: 'Elige los destinatarios para tu campaña.' },
  { id: 2, name: 'Crear Mensaje', description: 'Redacta el contenido y elige los canales.' },
  { id: 3, name: 'Revisar y Enviar', description: 'Confirma los detalles antes de lanzar.' },
];

// Componentes de Pasos (simulados por ahora)
const Step1SelectContacts = ({ selectedContacts, setSelectedContacts }: { selectedContacts: Contact[], setSelectedContacts: React.Dispatch<React.SetStateAction<Contact[]>> }) => (
    <div className="text-center p-10">
        <h2 className="text-xl font-semibold">Paso 1: Seleccionar Contactos</h2>
        <p className="text-gray-500 mt-2">Aquí irá la tabla de contactos para seleccionar.</p>
        <p className="mt-4 font-bold">Contactos seleccionados: {selectedContacts.length}</p>
    </div>
);
const Step2ComposeMessage = ({ campaignConfig, setCampaignConfig }: { campaignConfig: CampaignConfig, setCampaignConfig: React.Dispatch<React.SetStateAction<CampaignConfig>> }) => (
    <div className="text-center p-10">
        <h2 className="text-xl font-semibold">Paso 2: Crear Mensaje</h2>
        <p className="text-gray-500 mt-2">Aquí irán los campos para el mensaje y la selección de canales.</p>
    </div>
);
const Step3ReviewAndSend = ({ contacts, config }: { contacts: Contact[], config: CampaignConfig }) => (
    <div className="text-center p-10">
        <h2 className="text-xl font-semibold">Paso 3: Revisar y Enviar</h2>
        <p className="text-gray-500 mt-2">Aquí se mostrará el resumen final de la campaña.</p>
        <p className="mt-4 font-bold">{contacts.length} contactos recibirán el mensaje por {Array.from(config.channels).join(', ')}.</p>
    </div>
);


export default function NewCampaignWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    channels: new Set(['EMAIL']),
    message: '',
    mediaFile: null,
    name: `Campaña ${new Date().toLocaleDateString('es-ES')}`,
  });
  const [isSending, setIsSending] = useState(false);

  const goToNextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const goToPrevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleCreateCampaign = async () => {
    setIsSending(true);
    toast.info('Encolando campaña para envío...');
    
    // Simulación de la lógica de envío
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Lógica real con Server Action irá aquí
    console.log("Creando campaña con la siguiente configuración:", {
      config: campaignConfig,
      contacts: selectedContacts.map(c => c.id),
    });

    toast.success('¡Campaña encolada exitosamente!', {
      description: `${selectedContacts.length * campaignConfig.channels.size} mensajes se enviarán en segundo plano.`,
    });
    
    // Resetear estado para una nueva campaña
    setCurrentStep(1);
    setSelectedContacts([]);
    setCampaignConfig({
      channels: new Set(['EMAIL']), message: '', mediaFile: null, name: `Campaña ${new Date().toLocaleDateString('es-ES')}`
    });
    setIsSending(false);
  };

  const StepsComponent = () => {
    switch (currentStep) {
      case 1:
        return <Step1SelectContacts selectedContacts={selectedContacts} setSelectedContacts={setSelectedContacts} />;
      case 2:
        return <Step2ComposeMessage campaignConfig={campaignConfig} setCampaignConfig={setCampaignConfig} />;
      case 3:
        return <Step3ReviewAndSend contacts={selectedContacts} config={campaignConfig} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 md:space-x-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  currentStep >= step.id ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {step.id}
              </div>
              <p className={`mt-2 text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-gray-500'}`}>
                {step.name}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-20px] ${currentStep > index + 1 ? 'bg-primary' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <StepsComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={goToPrevStep} 
          disabled={currentStep === 1 || isSending}
        >
          Anterior
        </Button>
        {currentStep < steps.length ? (
          <Button 
            onClick={goToNextStep} 
            disabled={currentStep === 1 && selectedContacts.length === 0}
            className="bg-primary text-white hover:bg-primary/90"
          >
            Siguiente
          </Button>
        ) : (
          <Button 
            onClick={handleCreateCampaign} 
            disabled={isSending} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSending ? 'Enviando...' : 'Confirmar y Enviar Campaña'}
          </Button>
        )}
      </div>
    </div>
  );
}