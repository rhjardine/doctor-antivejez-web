'use server';

import { prisma } from '@/lib/db';
import {
  GuideFormValues,
  StandardFormItem,
  RevitalizationFormItem,
  MetabolicFormItem,
  RemocionFormItem,
  GuideCategory,
} from '@/types/guide';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';
import {
  generateGuideEmailHTML,
  generatePatientGuideEmailSubject,
  generatePatientGuideEmailText,
} from '@/utils/emailTemplates';

/**
 * Obtiene la estructura completa de la guía (categorías e ítems)
 * desde la base de datos para construir el formulario dinámicamente.
 */
export async function getGuideTemplate() {
  try {
    const categories = await prisma.guideCategory.findMany({
    include: {
    items: {
    where: { isDefault: true },
    orderBy: { name: 'asc' },
    },
    },
    orderBy: { order: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error('Error fetching guide template:', error);
    return { success: false, error: 'No se pudo cargar la plantilla de la guía.' };
  }
}

/**
 * Guarda la guía personalizada de un paciente en la base de datos.
 * Esta versión maneja la creación de nuevos ítems dinámicos de manera más robusta.
 */
export async function savePatientGuide(
  patientId: string,
  formData: GuideFormValues,
  newItems: { tempId: string; name: string; categoryId: string }[],
) {
  try {
    const { guideDate, selections, observaciones } = formData;

    const result = await prisma.$transaction(async (tx) => {
    // 1. Verificar que el paciente existe
    const patient = await tx.patient.findUnique({
    where: { id: patientId },
    });

    if (!patient) {
    throw new Error('Paciente no encontrado');
    }

    // 2. Crear la guía principal
    const patientGuide = await tx.patientGuide.create({
    data: {
    patientId,
    guideDate: new Date(guideDate),
    observations: observaciones || null,
    },
    });

    // 3. Crear los nuevos ítems y mapear sus IDs temporales a las nuevas IDs de la BD
    const tempIdToDbIdMap = new Map<string, string>();

    for (const newItem of newItems) {
    try {
    // Verificar que la categoría existe
    const category = await tx.guideCategory.findUnique({
    where: { id: newItem.categoryId },
    });

    if (!category) {
    console.warn(
    `Categoría ${newItem.categoryId} no encontrada, omitiendo ítem: ${newItem.name}`,
    );
    continue;
    }

    const createdItem = await tx.guideItem.create({
    data: {
    name: newItem.name.trim(),
    categoryId: newItem.categoryId,
    isDefault: false, // Los ítems creados dinámicamente no son por defecto
    },
    });

    tempIdToDbIdMap.set(newItem.tempId, createdItem.id);
    } catch (itemError) {
    console.error(`Error creando ítem ${newItem.name}:`, itemError);
    // Continuar con los demás ítems en caso de error
    }
    }

    // 4. Preparar y validar todas las selecciones para guardarlas en lote
    const selectionsToCreate: any[] = [];

    for (const itemId in selections) {
    if (Object.prototype.hasOwnProperty.call(selections, itemId)) {
    const selectionData = selections[itemId];

    if (selectionData.selected) {
    // Usar la nueva ID de la BD si es un ítem dinámico, o la ID original si es uno por defecto
    const finalItemId = tempIdToDbIdMap.get(itemId) || itemId;

    // Verificar que el ítem existe (para IDs no temporales)
    if (!tempIdToDbIdMap.has(itemId)) {
    const existingItem = await tx.guideItem.findUnique({
    where: { id: itemId },
    });

    if (!existingItem) {
    console.warn(`Ítem ${itemId} no encontrado en la base de datos, omitiendo`);
    continue;
    }
    }

    const dbSelectionData: any = {
    patientGuideId: patientGuide.id,
    guideItemId: finalItemId,
    };

    // Agregar campos específicos según el tipo de formulario
    // Campos de StandardFormItem
    if ((selectionData as StandardFormItem).qty !== undefined) {
    dbSelectionData.qty = (selectionData as StandardFormItem).qty || null;
    }
    if ((selectionData as StandardFormItem).doseType !== undefined) {
    dbSelectionData.doseType = (selectionData as StandardFormItem).doseType || null;
    }
    if ((selectionData as StandardFormItem).freq !== undefined) {
    dbSelectionData.freq = (selectionData as StandardFormItem).freq || null;
    }
    if ((selectionData as StandardFormItem).custom !== undefined) {
    dbSelectionData.custom = (selectionData as StandardFormItem).custom || null;
    }

    // Campos de RevitalizationFormItem
    if ((selectionData as RevitalizationFormItem).complejoB_cc !== undefined) {
    dbSelectionData.complejoB_cc =
    (selectionData as RevitalizationFormItem).complejoB_cc || null;
    }
    if ((selectionData as RevitalizationFormItem).bioquel_cc !== undefined) {
    dbSelectionData.bioquel_cc =
    (selectionData as RevitalizationFormItem).bioquel_cc || null;
    }
    if ((selectionData as RevitalizationFormItem).frequency !== undefined) {
    dbSelectionData.frequency =
    (selectionData as RevitalizationFormItem).frequency || null;
    }

    // Campos de RemocionFormItem
    if ((selectionData as RemocionFormItem).cucharadas !== undefined) {
    dbSelectionData.cucharadas =
    (selectionData as RemocionFormItem).cucharadas || null;
    }
    if ((selectionData as RemocionFormItem).horario !== undefined) {
    dbSelectionData.horario = (selectionData as RemocionFormItem).horario || null;
    }
    if ((selectionData as RemocionFormItem).semanas !== undefined) {
    dbSelectionData.semanas = (selectionData as RemocionFormItem).semanas || null;
    }
    if ((selectionData as RemocionFormItem).alimentacionTipo !== undefined) {
    const alimentacionTipo = (selectionData as RemocionFormItem).alimentacionTipo;
    dbSelectionData.alimentacionTipo =
    alimentacionTipo && alimentacionTipo.length > 0
    ? alimentacionTipo.join(',')
    : null;
    }
    if ((selectionData as RemocionFormItem).tacita_qty !== undefined) {
    dbSelectionData.tacita_qty =
    (selectionData as RemocionFormItem).tacita_qty || null;
    }
    if ((selectionData as RemocionFormItem).tacita !== undefined) {
    dbSelectionData.tacita = (selectionData as RemocionFormItem).tacita || null;
    }
    if ((selectionData as RemocionFormItem).frascos !== undefined) {
    dbSelectionData.frascos = (selectionData as RemocionFormItem).frascos || null;
    }

    // Campos de MetabolicFormItem
    if ((selectionData as MetabolicFormItem).gotas !== undefined) {
    dbSelectionData.gotas = (selectionData as MetabolicFormItem).gotas || null;
    }
    if ((selectionData as MetabolicFormItem).vecesAlDia !== undefined) {
    dbSelectionData.vecesAlDia =
    (selectionData as MetabolicFormItem).vecesAlDia || null;
    }
    if ((selectionData as MetabolicFormItem).horario !== undefined) {
    const horario = (selectionData as MetabolicFormItem).horario;
    dbSelectionData.horario =
    horario && Array.isArray(horario) && horario.length > 0
    ? horario.join(',')
    : null;
    }

    selectionsToCreate.push(dbSelectionData);
    }
    }
    }

    // 5. Insertar todas las selecciones en la base de datos
    if (selectionsToCreate.length > 0) {
    await tx.patientGuideSelection.createMany({
    data: selectionsToCreate,
    });
    }

    return patientGuide;
    });

    revalidatePath(`/historias/${patientId}`);
    return {
    success: true,
    message: 'Guía guardada exitosamente.',
    data: result,
    };
  } catch (error) {
    console.error('Error saving patient guide:', error);
    return {
    success: false,
    error: error instanceof Error ? error.message : 'Ocurrió un error al guardar la guía.',
    };
  }
}

/**
 * Configura el transportador de email usando las variables de entorno
 */
function createEmailTransporter() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: (process.env.SMTP_SECURE ?? 'false') === 'true', // true para puerto 465, false para otros puertos
    auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    },
    tls: {
    rejectUnauthorized: false,
    },
  });

  return transporter;
}

/**
 * Genera el contenido HTML formateado de la guía del paciente
 */
function formatGuideContentAsHTML(formData: GuideFormValues, guideData: GuideCategory[]): string {
  const { selections } = formData;
  let htmlContent = '';

  // Agrupar selecciones por categoría
  const selectionsByCategory = new Map<string, any[]>();

  for (const itemId in selections) {
    const selectionData = selections[itemId];
    if (selectionData.selected) {
    // Buscar el ítem en las categorías
    let foundItem: any = null; // Item puede ser de varios tipos, usamos any para extraer nombre de forma segura
    let categoryName = '';

    for (const category of guideData) {
    const item = category.items.find((i) => i.id === itemId);
    if (item) {
    foundItem = item;
    categoryName = category.title;
    break;
    }
    }

    if (foundItem) {
    if (!selectionsByCategory.has(categoryName)) {
    selectionsByCategory.set(categoryName, []);
    }

    selectionsByCategory.get(categoryName)!.push({
    name: ((foundItem as any).name ?? (foundItem as any).title ?? (foundItem as any).label ?? (foundItem as any).itemName ?? (foundItem as any).productName ?? 'Ítem'),
    details: selectionData,
    });
    }
    }
  }

  // ===== CORRECCIÓN FINAL Y ÚNICA =====
  // Se reemplaza el bucle `for...of` que causa el error de compilación
  // por el método `.forEach()`, que es universalmente compatible y no requiere
  // cambios en la configuración de TypeScript (tsconfig.json).
  selectionsByCategory.forEach((items, categoryName) => {
    htmlContent += `<div style="margin-bottom: 25px;">`;
    htmlContent += `<h3 style="color: #007bff; border-bottom: 1px solid #007bff; padding-bottom: 8px;">${categoryName}</h3>`;
    htmlContent += `<ul style="margin: 10px 0; padding-left: 20px;">`;

    items.forEach((item) => {
    htmlContent += `<li style="margin-bottom: 8px;"><strong>${item.name}</strong>`;

    // Formatear detalles según el tipo
    const details = item.details;
    let detailsText = '';

    // Campos de StandardFormItem
    if (details.qty && details.doseType && details.freq) {
    detailsText += `${details.qty} ${details.doseType}, ${details.freq}`;
    }

    // Campos de RevitalizationFormItem
    if (details.complejoB_cc || details.bioquel_cc) {
    const complejo = details.complejoB_cc ? `Complejo B: ${details.complejoB_cc}cc` : '';
    const bioquel = details.bioquel_cc ? `Bioquel: ${details.bioquel_cc}cc` : '';
    detailsText += [complejo, bioquel].filter(Boolean).join(', ');
    if (details.frequency) detailsText += `, ${details.frequency}`;
    }

    // Campos de RemocionFormItem
    if (details.cucharadas) {
    detailsText += `${details.cucharadas} cucharadas`;
    if (details.horario) detailsText += `, ${details.horario}`;
    if (details.semanas) detailsText += `, por ${details.semanas} semanas`;
    if (details.alimentacionTipo) detailsText += `, ${details.alimentacionTipo}`;
    }

    if (details.tacita_qty && details.tacita) {
    detailsText += `${details.tacita_qty} ${details.tacita}`;
    if (details.frascos) detailsText += `, ${details.frascos} frascos`;
    }

    // Campos de MetabolicFormItem
    if (details.gotas && details.vecesAlDia) {
    detailsText += `${details.gotas} gotas, ${details.vecesAlDia} veces al día`;
    }

    // Custom field
    if (details.custom) {
    detailsText = detailsText ? `${detailsText} - ${details.custom}` : details.custom;
    }

    if (detailsText) {
    htmlContent += `<br><small style="color: #666;">${detailsText}</small>`;
    }

    htmlContent += `</li>`;
    });

    htmlContent += `</ul></div>`;
  });
  // ===== FIN DE LA CORRECCIÓN =====

  return htmlContent;
}

/**
 * Envía la guía del paciente por correo electrónico con formato HTML
 */
export async function sendPatientGuideByEmail(
  patientId: string,
  formData: GuideFormValues,
  guideData: GuideCategory[],
) {
  try {
    // Verificar configuración de email
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return {
    success: false,
    error: 'Configuración de correo no encontrada. Contacte al administrador.',
    };
    }

    // Obtener información del paciente
    const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    });

    if (!patient) {
    return { success: false, error: 'Paciente no encontrado' };
    }

    if (!patient.email) {
    return { success: false, error: 'El paciente no tiene correo electrónico registrado' };
    }

    // Crear transportador de email
    const transporter = createEmailTransporter();

    // Generar contenido formateado de la guía
    const guideContent = formatGuideContentAsHTML(formData, guideData);

    // Preparar datos para el template
    const emailData = {
    patientName: `${patient.firstName} ${patient.lastName}`,
    doctorName: 'Medicina Anti-Aging',
    clinicName: 'Clínica de Medicina Personalizada',
    guideContent: guideContent,
    generatedDate: new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    }).format(new Date(formData.guideDate)),
    };

    // Generar contenido HTML y texto plano
    const htmlContent = generateGuideEmailHTML(emailData);
    const textContent = generatePatientGuideEmailText(emailData);
    const emailSubject = generatePatientGuideEmailSubject(emailData.patientName);

    // Configurar el mensaje
    const mailOptions = {
    from: {
    name: 'Dr. Medicina Anti-Aging',
    address: process.env.SMTP_USER as string,
    },
    to: patient.email,
    subject: emailSubject,
    html: htmlContent,
    text: textContent,
    };

    // Enviar el correo
    const info = await transporter.sendMail(mailOptions);

    console.log('Email enviado exitosamente:', info.messageId);

    return {
    success: true,
    message: 'Guía enviada por correo exitosamente',
    messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);

    let errorMessage = 'Error al enviar el correo electrónico';

    if (error instanceof Error) {
    if (error.message.includes('Invalid login')) {
    errorMessage = 'Error de autenticación del correo. Verifique las credenciales.';
    } else if (error.message.includes('Network')) {
    errorMessage = 'Error de conexión. Verifique su conexión a internet.';
    } else {
    errorMessage = `Error: ${error.message}`;
    }
    }

    return { success: false, error: errorMessage };
  }
}