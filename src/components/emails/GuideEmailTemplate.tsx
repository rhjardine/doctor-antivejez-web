import React from 'react';
import { PatientWithDetails } from '@/types';
import { GuideCategory, GuideFormValues } from '@/types/guide';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Img,
  Heading,
  Text,
  Hr,
} from '@react-email/components';

// Importamos el componente que ya sabe cómo renderizar la guía
// NOTA: La ruta puede necesitar ajuste. Asumo que está en 'components/guides'
import PrintableGuideContent from '../guides/PrintableGuideContent';

interface GuideEmailTemplateProps {
  patient: PatientWithDetails;
  guideData: GuideCategory[];
  formValues: GuideFormValues;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const GuideEmailTemplate = ({
  patient,
  guideData,
  formValues,
}: GuideEmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Tu Guía de Tratamiento Personalizada de Doctor AntiVejez</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Usamos el componente que ya tenemos para renderizar el contenido */}
        <PrintableGuideContent
          patient={patient}
          guideData={guideData}
          formValues={formValues}
        />
        <Hr style={hr} />
        <Text style={footer}>
          Centro Médico Doctor AntiVejez, Calle Choroní, Quinta San Onofre, Chuao, Miranda.
        </Text>
      </Container>
    </Body>
  </Html>
);

// Estilos para el correo
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