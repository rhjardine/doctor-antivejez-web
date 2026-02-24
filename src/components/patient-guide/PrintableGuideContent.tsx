// src/components/patient-guide/PrintableGuideContent.tsx
'use client';

import React, { forwardRef } from 'react';
import Image from 'next/image';
import { PatientWithDetails } from '@/types';
import {
    GuideCategory,
    GuideFormValues,
    StandardGuideItem,
    RevitalizationGuideItem,
    RemocionItem,
    StandardFormItem,
    RevitalizationFormItem,
    MetabolicFormItem,
    RemocionFormItem,
} from '@/types/guide';
import { FaSyringe, FaCapsules, FaSpa, FaLeaf, FaVial, FaDna, FaStethoscope, FaUserMd } from 'react-icons/fa';
import { homeopathicStructure, bachFlowersList } from './PatientGuide';

// --- Subcomponentes internos ---
const GuideListItem = ({ name, details }: { name: string; details?: string | null }) => (
    <li className="text-gray-800 break-inside-avoid flex items-start">
        <span className="text-primary mr-3 mt-1">&#8226;</span>
        <div>
            <span className="font-semibold">{name}</span>
            {details && <span className="text-gray-600 block text-sm">{details}</span>}
        </div>
    </li>
);

const CategoryTitle = ({ title, icon, showIcon = true }: { title: string; icon: React.ReactNode; showIcon?: boolean }) => (
    <div className="flex items-center gap-3 border-b-2 border-gray-200 pb-2 mb-4">
        {/* ===== CORRECCIÓN: Renderizado condicional del icono ===== */}
        {showIcon && <div className="text-primary text-2xl">{icon}</div>}
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    </div>
);

// --- Props del Componente ---
interface PrintableGuideContentProps {
    patient: PatientWithDetails;
    guideData: GuideCategory[];
    formValues: GuideFormValues;
    showIcons?: boolean; // <-- Nueva prop opcional
}

// --- Componente Principal ---
const PrintableGuideContent = forwardRef<HTMLDivElement, PrintableGuideContentProps>(
    ({ patient, guideData, formValues, showIcons = true }, ref) => { // <-- Se añade la nueva prop con valor por defecto
        const { selections, observaciones } = formValues;

        const getCategoryIcon = (categoryId: string) => {
            if (categoryId.startsWith('cat_remocion')) return <FaSpa />;
            if (categoryId.startsWith('cat_revitalizacion')) return <FaSyringe />;
            if (categoryId.startsWith('cat_nutra')) return <FaCapsules />;
            if (categoryId.startsWith('cat_cosmeceuticos')) return <FaSpa />;
            if (categoryId.startsWith('cat_activador')) return <FaDna />;
            if (categoryId.startsWith('cat_formulas')) return <FaLeaf />;
            if (categoryId.startsWith('cat_sueros')) return <FaVial />;
            if (categoryId.startsWith('cat_terapias')) return <FaStethoscope />;
            return <FaCapsules />;
        };

        return (
            <div ref={ref} id="printable-content" className="p-8 lg:p-12 bg-white">
                {/* Header */}
                <header className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6 break-inside-avoid">
                    <div className="w-40">
                        <Image
                            src="/images/logo.png"
                            alt="Logo Doctor Antivejez"
                            width={160}
                            height={40}
                            priority
                        />
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-bold text-primary-dark">
                            Guía de Tratamiento
                        </h1>
                        <p className="text-gray-500 text-lg">Personalizada</p>
                    </div>
                </header>

                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-8 mb-10 border-b border-gray-200 pb-6 break-inside-avoid">
                    <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider">Paciente</p>
                        <p className="font-bold text-xl text-gray-800">
                            {patient.firstName} {patient.lastName}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
                        <p className="font-bold text-xl text-gray-800">
                            {new Date(formValues.guideDate).toLocaleDateString('es-VE')}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <main className="space-y-10">
                    {guideData.map(category => {
                        const selectedItems = category.items.filter(item => selections?.[item.id]?.selected);

                        if (category.type === 'METABOLIC') {
                            const bioTerapicoSelection = selections['am_bioterapico'] as MetabolicFormItem;
                            const allHomeopathyItems = Object.entries(homeopathicStructure).flatMap(([cat, subItems]) => {
                                if (Array.isArray(subItems)) {
                                    return subItems.map(name => ({ name, category: cat, subCategory: undefined as string | undefined }));
                                }
                                return Object.entries(subItems).flatMap(([subCat, items]) =>
                                    items.map(name => ({ name, category: cat, subCategory: subCat }))
                                );
                            }).flat();
                            const selectedHomeopathy = allHomeopathyItems
                                .filter(item => {
                                    const uniquePrefix = item.subCategory ? `${item.category}_${item.subCategory}` : item.category;
                                    const itemId = `am_hom_${uniquePrefix}_${item.name}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
                                    return selections[itemId]?.selected;
                                })
                                .map(item => item.name);
                            const selectedBach = bachFlowersList.filter(subItem => selections?.[subItem.id]?.selected);

                            if (!bioTerapicoSelection?.selected && selectedHomeopathy.length === 0 && selectedBach.length === 0) {
                                return null;
                            }

                            return (
                                <div key={category.id} className="break-inside-avoid">
                                    <CategoryTitle title={category.title} icon={getCategoryIcon(category.id)} />
                                    {bioTerapicoSelection?.selected && (
                                        <div className="text-gray-800 mb-4 pl-10">
                                            <span className="font-semibold">Bioterápico + Bach:</span>
                                            <span className="text-gray-600 ml-2 text-sm">
                                                {bioTerapicoSelection.gotas} gotas, {bioTerapicoSelection.vecesAlDia} veces al día.{' '}
                                                {(Array.isArray(bioTerapicoSelection.horario) ? bioTerapicoSelection.horario : (bioTerapicoSelection.horario ? [bioTerapicoSelection.horario] : [])).join(' / ')}
                                            </span>
                                        </div>
                                    )}
                                    {selectedHomeopathy.length > 0 && (
                                        <>
                                            <h4 className="font-semibold text-primary-dark mt-4 mb-2 pl-10">Homeopatía</h4>
                                            <ul className="list-none space-y-1 pl-14 columns-2 md:columns-3 text-sm">
                                                {selectedHomeopathy.map(name => (
                                                    <li key={name} className="before:content-['\2713'] before:text-green-500 before:mr-2 break-inside-avoid">{name}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    {selectedBach.length > 0 && (
                                        <>
                                            <h4 className="font-semibold text-primary-dark mt-4 mb-2 pl-10">Flores de Bach</h4>
                                            <ul className="list-none space-y-1 pl-14 columns-2 md:columns-3 text-sm">
                                                {selectedBach.map(item => (
                                                    <li key={item.id} className="before:content-['\2713'] before:text-green-500 before:mr-2 break-inside-avoid">{item.name}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            );
                        }

                        if (selectedItems.length === 0) return null;

                        return (
                            <div key={category.id} className="break-inside-avoid">
                                {/* ===== CORRECCIÓN: Se pasa la prop showIcons ===== */}
                                <CategoryTitle title={category.title} icon={getCategoryIcon(category.id)} showIcon={showIcons} />
                                <ul className="list-none space-y-4 pl-10">
                                    {selectedItems
                                        .filter((it): it is StandardGuideItem | RevitalizationGuideItem | RemocionItem => 'name' in it)
                                        .map(item => {
                                            const details = selections[item.id];
                                            let treatmentDetails: string | null = null;
                                            const isNutraceutico = ['cat_nutra_primarios', 'cat_nutra_secundarios', 'cat_nutra_complementarios', 'cat_cosmeceuticos', 'cat_formulas_naturales'].includes(category.id);

                                            if ('dose' in item && item.dose) {
                                                treatmentDetails = item.dose;
                                            } else if (category.type === 'REVITALIZATION') {
                                                const rev = details as RevitalizationFormItem;
                                                const otroNombre = rev.otroMedicamento === 'Otro' ? (rev.otroMedicamento_custom || 'Otro') : (rev.otroMedicamento || 'Bioquel');
                                                const freq = rev.vecesXSemana && rev.totalDosis ? `${rev.vecesXSemana} veces/sem por ${rev.totalDosis} dosis` : '';
                                                treatmentDetails = `Complejo B: ${rev.complejoB_cc || '3 cc'} + ${otroNombre}: ${rev.otro_cc || '3 cc'} intramuscular. ${freq}`;
                                            } else if (category.type === 'REMOCION') {
                                                const rem = details as RemocionFormItem;
                                                const remItem = item as RemocionItem;
                                                if (remItem.subType === 'aceite_ricino' || remItem.subType === 'leche_magnesia') {
                                                    treatmentDetails = `${rem.cucharadas || '_'} cucharada(s) ${rem.horario || ''}`;
                                                } else if (remItem.subType === 'detox_alcalina') {
                                                    treatmentDetails = `Por ${rem.semanas || '_'} semana(s). Tipo: ${rem.alimentacionTipo?.join(', ') || 'No especificado'}`;
                                                } else if (remItem.subType === 'noni_aloe') {
                                                    treatmentDetails = `${rem.tacita_qty || '_'} tacita(s), ${rem.tacita || ''} (${rem.frascos || '_'} frasco(s))`;
                                                }
                                            } else if (isNutraceutico) {
                                                const std = details as StandardFormItem;
                                                const parts = [std.qty ? `${std.qty} ${std.doseType || ''}`.trim() : null, std.freq, std.custom].filter(Boolean);
                                                treatmentDetails = parts.join(' - ');
                                            } else {
                                                const std = details as StandardFormItem;
                                                treatmentDetails = [std.qty, std.freq, std.custom].filter(Boolean).join(' - ');
                                            }

                                            return (<GuideListItem key={item.id} name={item.name} details={treatmentDetails} />);
                                        })}
                                </ul>
                            </div>
                        );
                    })}

                    {observaciones && (
                        <div className="break-inside-avoid pt-4">
                            {/* ===== CORRECCIÓN: Se pasa la prop showIcons ===== */}
                            <CategoryTitle title="Observaciones" icon={<FaUserMd />} showIcon={showIcons} />
                            <p className="text-gray-800 whitespace-pre-wrap bg-gray-100 p-4 rounded-md border ml-10">
                                {observaciones}
                            </p>
                        </div>
                    )}
                </main>
            </div>
        );
    }
);

PrintableGuideContent.displayName = 'PrintableGuideContent';
export default PrintableGuideContent;