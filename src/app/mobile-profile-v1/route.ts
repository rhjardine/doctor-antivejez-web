import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { getCorsHeaders, handleCorsPreflightOrReject } from "@/lib/cors";

export const dynamic = 'force-dynamic';

export async function OPTIONS(req: Request) {
    return handleCorsPreflightOrReject(req, "GET, PATCH, OPTIONS");
}

export async function GET(req: Request) {
    const corsHeaders = getCorsHeaders(req, "GET, PATCH, OPTIONS");

    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Token no proporcionado" }, { status: 401, headers: corsHeaders });
        }

        const token = authHeader.split(" ")[1];
        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401, headers: corsHeaders });
        }

        const patient = await db.patient.findUnique({
            where: { id: payload.id },
            include: {
                biophysicsTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                biochemistryTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                guides: { orderBy: { createdAt: 'desc' }, take: 1 },
                foodPlans: { orderBy: { createdAt: 'desc' }, take: 1, include: { items: true } },
                nlrTests: { orderBy: { createdAt: 'desc' }, take: 1 },
                geneticTests: { orderBy: { testDate: 'desc' }, take: 1 }
            }
        });

        if (!patient) {
            return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404, headers: corsHeaders });
        }

        // ----------------------------------------------------------------
        // Serialize raw Selections → PatientProtocol[] for the PWA
        // ----------------------------------------------------------------
        const CATEGORY_MAP: Record<string, string> = {
            'cat_remocion': 'REMOVAL_PHASE', 'cat_revitalizacion': 'REVITALIZATION_PHASE',
            'cat_nutra_primarios': 'PRIMARY_NUTRACEUTICALS', 'cat_activador': 'METABOLIC_ACTIVATOR',
            'cat_nutra_secundarios': 'SECONDARY_NUTRACEUTICALS', 'cat_nutra_complementarios': 'COMPLEMENTARY_NUTRACEUTICALS',
            'cat_cosmeceuticos': 'COSMECEUTICALS', 'cat_formulas_naturales': 'NATURAL_FORMULAS',
            'cat_sueros': 'ANTI_AGING_SERUMS', 'cat_terapias': 'ANTI_AGING_THERAPIES',
            'cat_bioneural': 'BIO_NEURAL_THERAPY', 'cat_control_terapia': 'THERAPY_CONTROL',
        };

        // ID → {name, categoryId} lookup (must mirror PatientGuide.tsx initialGuideData)
        const ITEM_MAP: Record<string, { name: string; catId: string }> = {};
        const staticItems: { catId: string; items: { id: string; name: string }[] }[] = [
            { catId: 'cat_remocion', items: [{ id: 'rem_1', name: 'Aceite de ricino' }, { id: 'rem_2', name: 'Leche de magnesia' }, { id: 'rem_3', name: 'Detoxificación Alcalina' }, { id: 'rem_4', name: 'Noni / Aloe Vera' }] },
            { catId: 'cat_revitalizacion', items: [{ id: 'rev_1', name: 'Complejo B + Otro' }] },
            { catId: 'cat_nutra_primarios', items: [{ id: 'np_1', name: 'MegaGH4' }, { id: 'np_2', name: 'StemCell Enhancer' }, { id: 'np_3', name: 'Transfer Tri Factor' }, { id: 'np_4', name: 'Telomeros' }] },
            { catId: 'cat_nutra_secundarios', items: [{ id: 'ns_10', name: 'Anti stress' }, { id: 'ns_11', name: 'Cardiovascular' }, { id: 'ns_1', name: 'Digestivo' }, { id: 'ns_2', name: 'Femenino' }, { id: 'ns_3', name: 'Osteo Articular' }, { id: 'ns_4', name: 'Inmune Booster' }, { id: 'ns_5', name: 'Inmune Modulador' }, { id: 'ns_6', name: 'Masculino' }, { id: 'ns_7', name: 'Neuro Central' }, { id: 'ns_8', name: 'Neuro Emocional' }, { id: 'ns_9', name: 'Próstata' }] },
            { catId: 'cat_nutra_complementarios', items: [{ id: 'nc_1', name: 'Aloe Vera' }, { id: 'nc_2', name: 'Antioxidante' }, { id: 'nc_3', name: 'Colágeno' }, { id: 'nc_4', name: 'Energy' }, { id: 'nc_5', name: 'Immune Spray' }, { id: 'nc_6', name: 'Magnesio Quelatado' }, { id: 'nc_7', name: 'Omega 3' }, { id: 'nc_8', name: 'Vit C c/Zinc' }, { id: 'nc_9', name: 'Vit E c/Selenio' }, { id: 'nc_10', name: 'Zinc Quelatado' }] },
            { catId: 'cat_sueros', items: [{ id: 'suero_1', name: 'Antianémico' }, { id: 'suero_2', name: 'Antienvejecimiento / Pro Vital' }, { id: 'suero_3', name: 'Antiviral c/Ozono' }, { id: 'suero_4', name: 'Bioxigenación' }, { id: 'suero_5', name: 'Cardio Vascular' }, { id: 'suero_6', name: 'Energizante' }, { id: 'suero_7', name: 'Inmuno Estimulante' }, { id: 'suero_8', name: 'Inmuno Modulador' }, { id: 'suero_9', name: 'Mega Vitamina C' }, { id: 'suero_10', name: 'Metabólico' }, { id: 'suero_11', name: 'Osteo Articular' }, { id: 'suero_12', name: 'Ozono' }, { id: 'suero_13', name: 'Pre Natal' }, { id: 'suero_14', name: 'Quelación' }] },
            { catId: 'cat_terapias', items: [{ id: 'terapia_1', name: 'Autovacuna' }, { id: 'terapia_2', name: 'Biorresonancia' }, { id: 'terapia_3', name: 'Cámara Hiperbárica' }, { id: 'terapia_4', name: 'Células Madre Adiposa' }, { id: 'terapia_5', name: 'Células Madres Sistémica' }, { id: 'terapia_6', name: 'Células Madres Segment.' }, { id: 'terapia_7', name: 'CERAGEN / Masajes' }, { id: 'terapia_8', name: 'Cosmetología / Estética' }, { id: 'terapia_9', name: 'Factores Autólogos PRP' }, { id: 'terapia_10', name: 'Hidroterapia de Colon' }, { id: 'terapia_11', name: 'Hidroterapia Ionizante' }, { id: 'terapia_12', name: 'Láser Rojo / Infrarrojo' }, { id: 'terapia_13', name: 'LEM' }, { id: 'terapia_14', name: 'Nebulización' }, { id: 'terapia_15', name: 'Neural' }, { id: 'terapia_16', name: 'Ozono' }, { id: 'terapia_17', name: 'Exosomas' }, { id: 'terapia_18', name: 'Terapia BioCelular' }, { id: 'terapia_19', name: 'Shot Umbilical' }] },
        ];
        for (const { catId, items } of staticItems) {
            for (const item of items) ITEM_MAP[item.id] = { name: item.name, catId };
        }

        const serializeForPWA = (rawSelections: any): any[] => {
            if (!rawSelections || typeof rawSelections !== 'object') return [];
            const protocols: any[] = [];
            const now = new Date().toISOString();
            for (const [itemId, selRaw] of Object.entries(rawSelections)) {
                const sel = selRaw as any;
                if (!sel?.selected) continue;
                const mapped = ITEM_MAP[itemId];
                if (!mapped && !itemId.startsWith('am_')) continue;
                if (itemId.startsWith('am_hom_') || itemId.startsWith('am_bach_')) continue; // grouped under bioterapico
                const catId = mapped?.catId || 'cat_nutra_primarios';
                const category = CATEGORY_MAP[catId] || 'PRIMARY_NUTRACEUTICALS';
                let dose = '', schedule = '', timeSlot = 'ANYTIME', observations = '';
                // Activador Metabólico
                if (itemId === 'am_bioterapico') {
                    dose = `${sel.gotas || 5} gotas`;
                    if (sel.vecesAlDia) dose += `, ${sel.vecesAlDia} veces/día`;
                    if (sel.horario?.length) schedule = (sel.horario as string[]).join(' / ');
                    observations = 'Debajo de la lengua';
                }
                // Revitalización
                else if (catId === 'cat_revitalizacion') {
                    const otro = sel.otroMedicamento === 'Otro' ? (sel.otroMedicamento_custom || 'Otro') : (sel.otroMedicamento || 'Bioquel');
                    dose = `Complejo B ${sel.complejoB_cc || '3 cc'} + ${otro} ${sel.otro_cc || '3 cc'} intramuscular`;
                    if (sel.vecesXSemana && sel.totalDosis) schedule = `${sel.vecesXSemana} veces/sem por ${sel.totalDosis} dosis`;
                }
                // Nutraceuticos
                else if (['cat_nutra_primarios', 'cat_nutra_secundarios', 'cat_nutra_complementarios'].includes(catId)) {
                    dose = [sel.qty, sel.doseType].filter(Boolean).join(' ');
                    schedule = sel.freq || '';
                    if (sel.personalizacion) observations = sel.personalizacion;
                }
                // Sueros y Terapias
                else if (catId === 'cat_sueros' || catId === 'cat_terapias') {
                    dose = sel.dosis || '';
                    schedule = sel.frecuencia || '';
                }
                // Remoción
                else if (catId === 'cat_remocion') {
                    dose = sel.cucharadas ? `${sel.cucharadas} cucharada(s)` : (sel.tacita_qty ? `${sel.tacita_qty} tacita(s)` : '');
                    schedule = sel.horario || sel.tacita || '';
                }
                else { dose = sel.qty || sel.dosis || ''; schedule = sel.freq || sel.frecuencia || ''; }
                protocols.push({ id: itemId, category, itemName: mapped?.name || itemId, dose, schedule, timeSlot, observations, status: 'pending', prescribedAt: now, updatedAt: now });
            }
            return protocols;
        }

        const latestGuide = patient.guides[0];
        const serializedGuide = latestGuide
            ? { ...latestGuide, selections: serializeForPWA(latestGuide.selections as any) }
            : null;

        return NextResponse.json({
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            bloodType: patient.bloodType,
            identification: patient.identification,
            biologicalAge: patient.biophysicsTests[0]?.biologicalAge || null,
            chronologicalAge: patient.chronologicalAge,
            biophysics: patient.biophysicsTests[0] || null,
            biochemistry: patient.biochemistryTests[0] || null,
            latestNlr: patient.nlrTests[0] || null,
            geneticSummary: patient.geneticTests[0] ? {
                telomereLength: patient.geneticTests[0].averageTelomereLength,
                biologicalAge: patient.geneticTests[0].biologicalAge,
                chronologicalAge: patient.geneticTests[0].chronologicalAge,
                agingDelta: patient.geneticTests[0].differentialAge,
                rejuvenationScore: Math.max(0, Math.min(100, 50 + (patient.geneticTests[0].chronologicalAge - patient.geneticTests[0].biologicalAge) * 5)),
                lastTestDate: patient.geneticTests[0].testDate?.toISOString() || null,
            } : null,
            guides: serializedGuide ? [serializedGuide] : [],
            foodPlans: patient.foodPlans
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Profile fetch error:", (error as Error).message);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: corsHeaders });
    }
}

export async function PATCH(req: Request) {
    const corsHeaders = getCorsHeaders(req, "GET, PATCH, OPTIONS");

    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: corsHeaders });
        }

        const token = authHeader.split(" ")[1];
        const payload = await verifyToken(token);

        if (!payload) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401, headers: corsHeaders });
        }

        const { shareDataConsent } = await req.json();

        const patient = await db.patient.findFirst({
            where: { userId: payload.id }
        });

        if (!patient) {
            return NextResponse.json({ error: "Perfil de paciente no encontrado" }, { status: 404, headers: corsHeaders });
        }

        const updatedPatient = await db.patient.update({
            where: { id: patient.id },
            data: { shareDataConsent: !!shareDataConsent }
        });

        return NextResponse.json({
            success: true,
            consent: updatedPatient.shareDataConsent
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Consent update error:", (error as Error).message);
        return NextResponse.json({ error: "Error al actualizar consentimiento" }, { status: 500, headers: corsHeaders });
    }
}
