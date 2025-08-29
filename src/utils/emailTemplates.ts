interface PatientGuideEmailData {
  patientName: string;
  doctorName: string;
  clinicName?: string;
  guideContent: string;
  generatedDate: string;
}

export function generateGuideEmailHTML(data: PatientGuideEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Guía Personalizada del Paciente</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 10px 0 0 0;
          font-size: 16px;
        }
        .patient-info {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 4px solid #007bff;
        }
        .patient-info h2 {
          margin: 0 0 15px 0;
          color: #007bff;
          font-size: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .info-label {
          font-weight: bold;
          color: #555;
        }
        .info-value {
          color: #333;
        }
        .guide-content {
          margin-bottom: 30px;
        }
        .guide-content h2 {
          color: #007bff;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
          color: #666;
          font-size: 14px;
        }
        .disclaimer {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
          color: #856404;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .container {
            padding: 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .info-row {
            flex-direction: column;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Guía Personalizada del Paciente</h1>
          <p>Medicina Anti-Aging Personalizada</p>
        </div>
        
        <div class="patient-info">
          <h2>Información del Paciente</h2>
          <div class="info-row">
            <span class="info-label">Paciente:</span>
            <span class="info-value">${data.patientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Médico:</span>
            <span class="info-value">Dr. ${data.doctorName}</span>
          </div>
          ${data.clinicName ? `
          <div class="info-row">
            <span class="info-label">Clínica:</span>
            <span class="info-value">${data.clinicName}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Fecha de generación:</span>
            <span class="info-value">${data.generatedDate}</span>
          </div>
        </div>
        
        <div class="guide-content">
          <h2>Su Guía Personalizada</h2>
          ${data.guideContent}
        </div>
        
        <div class="disclaimer">
          <strong>Importante:</strong> Esta guía ha sido personalizada específicamente para usted por su médico. 
          Siga las indicaciones proporcionadas y consulte con su médico ante cualquier duda o cambio en su condición.
        </div>
        
        <div class="footer">
          <p>Este documento ha sido generado automáticamente por el sistema de medicina personalizada.</p>
          <p>Para consultas adicionales, contacte a su médico tratante.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generatePatientGuideEmailSubject(patientName: string): string {
  return `Guía Personalizada Anti-Aging - ${patientName}`;
}

export function generatePatientGuideEmailText(data: PatientGuideEmailData): string {
  return `
Estimado/a ${data.patientName},

Adjunto encontrará su guía personalizada de medicina anti-aging, preparada especialmente para usted por el Dr. ${data.doctorName}.

Información del documento:
- Paciente: ${data.patientName}
- Médico: Dr. ${data.doctorName}
${data.clinicName ? `- Clínica: ${data.clinicName}` : ''}
- Fecha de generación: ${data.generatedDate}

Esta guía contiene recomendaciones específicas basadas en su evaluación médica. Por favor, siga las indicaciones proporcionadas y no dude en contactar a su médico ante cualquier consulta.

Saludos cordiales,
Equipo de Medicina Anti-Aging
  `;
}