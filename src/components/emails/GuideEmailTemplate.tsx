// src/components/emails/GuideEmailTemplate.tsx

import { PatientWithDetails } from '@/types';
import { GuideCategory, GuideFormValues } from '@/types/guide';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Hr,
} from '@react-email/components';

import PrintableGuideContent from '../patient-guide/PrintableGuideContent';

interface GuideEmailTemplateProps {
  patient: PatientWithDetails;
  guideData: GuideCategory[];
  formValues: GuideFormValues;
}

// ✅ CORRECCIÓN: Cambiado a una función con exportación por defecto.
// Esto crea un punto de entrada único y claro para este módulo,
// eliminando la causa raíz del error de renderizado en el servidor.
export default function GuideEmailTemplate({
  patient,
  guideData,
  formValues,
}: GuideEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Tu Guía de Tratamiento Personalizada de Doctor AntiVejez</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* 
            Se mantiene tu corrección de 'showIcons'. Es una excelente medida defensiva,
            ya que las librerías de iconos a menudo son la causa de estos problemas
            de renderizado en el servidor.
          */}
          <PrintableGuideContent
            patient={patient}
            guideData={guideData}
            formValues={formValues}
            showIcons={false} 
          />
          <Hr style={hr} />
          <Text style={footer}>
            Centro Médico Doctor AntiVejez, Calle Choroní, Quinta San Onofre, Chuao, Miranda.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Estilos para el correo (sin cambios)
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};