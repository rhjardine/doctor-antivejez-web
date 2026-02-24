'use server';

import { prisma } from '@/lib/db';
import { GuideFormValues, GuideCategory, Selections } from '@/types/guide';
import { revalidatePath } from 'next/cache';
import { getEmailProvider } from '@/lib/services/notificationService';
import { render } from '@react-email/render';
import GuideEmailTemplate from '@/components/emails/GuideEmailTemplate';
import { PatientWithDetails } from '@/types';

// Mapa: ID de categoría web → ProtocolCategory en la PWA
const CATEGORY_MAP: Record<string, string> = {
  'cat_remocion': 'REMOVAL_PHASE',
  'cat_revitalizacion': 'REVITALIZATION_PHASE',
  'cat_nutra_primarios': 'PRIMARY_NUTRACEUTICALS',
  'cat_activador': 'METABOLIC_ACTIVATOR',
  'cat_nutra_secundarios': 'SECONDARY_NUTRACEUTICALS',
  'cat_nutra_complementarios': 'COMPLEMENTARY_NUTRACEUTICALS',
  'cat_cosmeceuticos': 'COSMECEUTICALS',
  'cat_formulas_naturales': 'NATURAL_FORMULAS',
  'cat_sueros': 'ANTI_AGING_SERUMS',
  'cat_terapias': 'ANTI_AGING_THERAPIES',
  'cat_bioneural': 'BIO_NEURAL_THERAPY',
  'cat_control_terapia': 'THERAPY_CONTROL',
};

// Derivar timeSlot desde el campo de frecuencia
function deriveTimeSlot(freq?: string): 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANYTIME' {
  if (!freq) return 'ANYTIME';
  const f = freq.toLowerCase();
  if (f.includes('desayuno') && !f.includes('cena')) return 'MORNING';
  if (f.includes('cena') && !f.includes('desayuno')) return 'EVENING';
  if (f.includes('almuerzo')) return 'AFTERNOON';
  if (f.includes('mañana')) return 'MORNING';
  if (f.includes('noche')) return 'EVENING';
  return 'ANYTIME';
}

/**
 * Transforma las selecciones del formulario web en un array de PatientProtocol
 * compatible con la PWA. Solo incluye ítems con selected: true.
 */
function serializeGuideToProtocol(selections: Selections, guideData: GuideCategory[]): any[] {
  const protocols: any[] = [];
  const now = new Date().toISOString();

  // Construir mapa de nombre por itemId
  const itemNameMap: Record<string, string> = {};
  const itemCategoryMap: Record<string, string> = {};
  for (const cat of guideData) {
    for (const item of cat.items as any[]) {
      if (item.id && item.name) {
        itemNameMap[item.id] = item.name;
        itemCategoryMap[item.id] = cat.id;
      }
    }
  }

  for (const [itemId, selRaw] of Object.entries(selections)) {
    const sel = selRaw as any;
    if (!sel?.selected) continue;

    const catId = itemCategoryMap[itemId] || 'cat_nutra_primarios';
    const category = CATEGORY_MAP[catId] || 'PRIMARY_NUTRACEUTICALS';
    const itemName = itemNameMap[itemId] || itemId;

    let dose = '';
    let schedule = '';
    let timeSlot: string = 'ANYTIME';
    let observations = '';

    // === Remoción ===
    if (catId === 'cat_remocion') {
      if (sel.cucharadas) dose = `${sel.cucharadas} cucharada(s)`;
      if (sel.horario) schedule = sel.horario;
      if (sel.semanas) dose = `${sel.semanas} semana(s)`;
      if (sel.alimentacionTipo?.length) observations = `Dieta: ${sel.alimentacionTipo.join(', ')}`;
      if (sel.tacita_qty) dose = `${sel.tacita_qty} tacita(s)`;
      if (sel.tacita) schedule = sel.tacita;
      if (sel.frascos) observations += ` | ${sel.frascos} frasco(s)`;
      timeSlot = deriveTimeSlot(schedule);
    }

    // === Revitalización ===
    else if (catId === 'cat_revitalizacion') {
      const compB = sel.complejoB_cc ? `Complejo B ${sel.complejoB_cc} cc` : '';
      const otroNombre = sel.otroMedicamento === 'Otro' ? (sel.otroMedicamento_custom || 'Otro') : (sel.otroMedicamento || '');
      const otroCC = sel.otro_cc ? `${otroNombre} ${sel.otro_cc} cc` : '';
      dose = [compB, otroCC].filter(Boolean).join(' + ') + ' intramuscular';
      if (sel.vecesXSemana && sel.totalDosis) {
        schedule = `${sel.vecesXSemana} veces/semana por ${sel.totalDosis} dosis`;
      }
      timeSlot = 'ANYTIME';
    }

    // === Activador Metabólico (frasco combinado) ===
    else if (itemId === 'am_bioterapico') {
      dose = `${sel.gotas || 5} gotas`;
      if (sel.vecesAlDia) dose += `, ${sel.vecesAlDia} veces/día`;
      if (sel.horario?.length) schedule = (sel.horario as string[]).join(' / ');
      timeSlot = deriveTimeSlot(schedule);
      observations = 'Debajo de la lengua';
    }

    // === Homeopatía y Bach (items individuales del activador) ===
    else if (itemId.startsWith('am_hom_') || itemId.startsWith('am_bach_')) {
      // No se serializa individualmente — están en el bloque del frasco combinado
      continue;
    }

    // === Nutracéuticos Primarios / Secundarios / Complementarios ===
    else if (['cat_nutra_primarios', 'cat_nutra_secundarios', 'cat_nutra_complementarios'].includes(catId)) {
      const qty = sel.qty || '';
      const tipo = sel.doseType || '';
      dose = [qty, tipo].filter(Boolean).join(' ');
      schedule = sel.freq || '';
      timeSlot = deriveTimeSlot(schedule);
      if (sel.personalizacion) observations = sel.personalizacion;
    }

    // === Sueros / Terapias ===
    else if (catId === 'cat_sueros' || catId === 'cat_terapias') {
      dose = sel.dosis || '';
      schedule = sel.frecuencia || '';
      timeSlot = 'ANYTIME';
    }

    // === Terapia BioNeural ===
    else if (catId === 'cat_bioneural') {
      dose = sel.dosis || '';
      timeSlot = 'ANYTIME';
    }

    // === STANDARD fallback (cosmecéuticos, fórmulas, etc.) ===
    else {
      dose = sel.qty || '';
      schedule = sel.freq || sel.custom || '';
      timeSlot = deriveTimeSlot(schedule);
    }

    protocols.push({
      id: itemId,
      category,
      itemName,
      dose,
      schedule,
      timeSlot,
      observations,
      status: 'pending',
      prescribedAt: now,
      updatedAt: now,
    });
  }

  // Agregar resumen del Activador Metabólico con ítems seleccionados
  const bioSel = (selections['am_bioterapico'] as any);
  if (bioSel?.selected) {
    const homSel = Object.entries(selections)
      .filter(([k, v]) => k.startsWith('am_hom_') && (v as any)?.selected)
      .map(([k]) => k.replace(/^am_hom_[^_]+_[^_]+_/, '').replace(/_/g, ' '));
    const bachSel = Object.entries(selections)
      .filter(([k, v]) => k.startsWith('am_bach_') && (v as any)?.selected)
      .map(([_, v]) => (v as any)?.name || '')
      .filter(Boolean);

    const combined = protocols.find(p => p.id === 'am_bioterapico');
    if (combined) {
      if (homSel.length) combined.observations += ` | Homeopatía: ${homSel.join(', ')}`;
      if (bachSel.length) combined.observations += ` | Bach: ${bachSel.join(', ')}`;
    }
  }

  return protocols;
}

/**
 * Obtiene la estructura completa de la guía desde DB (si existe) o retorna null.
 */
export async function getGuideTemplate() {
  try {
    const categories = await prisma.guideCategory.findMany({
      include: { items: { where: { isDefault: true }, orderBy: { name: 'asc' } } },
      orderBy: { order: 'asc' },
    });
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: 'No se pudo cargar la plantilla de la guía.' };
  }
}

/**
 * Guarda la guía del paciente con las selecciones RAW del formulario
 * (formato Selections), para que el historial pueda recargarse correctamente.
 * La conversión a PatientProtocol[] se hace en el endpoint móvil.
 */
export async function savePatientGuide(patientId: string, formData: GuideFormValues, guideData?: GuideCategory[]) {
  try {
    const { selections, observaciones, guideDate } = formData;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw new Error('Paciente no encontrado');

    // Guardamos las selecciones RAW del formulario para poder recargar el historial
    const newGuide = await prisma.patientGuide.create({
      data: {
        patientId,
        observations: observaciones,
        selections: selections as any,
        createdAt: new Date(guideDate),
      },
    });

    revalidatePath(`/historias/${patientId}`);

    return {
      success: true,
      message: 'Guía guardada. Actualizada en la app del paciente.',
      guideId: newGuide.id,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al guardar.';
    return { success: false, error: msg };
  }
}

/**
 * Envía la guía por correo electrónico.
 */
export async function sendGuideByEmail(patientId: string, guideId: string) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        biophysicsTests: true, biochemistryTests: true, orthomolecularTests: true,
        appointments: true, guides: true, foodPlans: { include: { items: true } },
        aiAnalyses: true, geneticTests: true, labReports: true,
      },
    });
    const guide = await prisma.patientGuide.findUnique({ where: { id: guideId } });

    if (!patient || !guide) return { success: false, error: 'Paciente o guía no encontrados.' };
    if (!patient.email) return { success: false, error: 'El paciente no tiene correo registrado.' };

    const guideTemplateResult = await getGuideTemplate();
    const guideData: GuideCategory[] = guideTemplateResult.success ? (guideTemplateResult.data as any) : [];

    const formValues: GuideFormValues = {
      guideDate: guide.createdAt.toISOString(),
      selections: guide.selections as any,
      observaciones: guide.observations || '',
    };

    const emailHtml = await render(
      <GuideEmailTemplate patient={patient as PatientWithDetails} guideData={guideData} formValues={formValues} />
    );

    const subject = `Tu Guía de Tratamiento Personalizada — Dr. AntiVejez`;
    const textBody = `Hola ${patient.firstName}, tu guía de tratamiento ha sido actualizada. Por favor ábrela en la App Rejuvenate o revisa tu correo.`;

    const emailProvider = getEmailProvider();
    const result = await emailProvider.send(patient.email, subject, textBody, null, emailHtml);

    return result.success
      ? { success: true, message: 'Guía enviada por correo.' }
      : { success: false, error: result.error || 'No se pudo enviar.' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error al enviar correo.';
    return { success: false, error: msg };
  }
}

export async function getPatientGuideHistory(patientId: string) {
  try {
    if (!patientId) return { success: false, error: 'Se requiere el ID del paciente.' };
    const guides = await prisma.patientGuide.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, observations: true },
    });
    return { success: true, data: guides };
  } catch (error) {
    return { success: false, error: 'No se pudo cargar el historial.' };
  }
}

export async function getPatientGuideDetails(guideId: string) {
  try {
    if (!guideId) return { success: false, error: 'Se requiere el ID de la guía.' };
    const guide = await prisma.patientGuide.findUnique({ where: { id: guideId } });
    if (!guide) return { success: false, error: 'No se encontró la guía.' };
    return {
      success: true,
      data: { ...guide, selections: JSON.parse(JSON.stringify(guide.selections)) },
    };
  } catch (error) {
    return { success: false, error: 'Error al cargar los detalles.' };
  }
}