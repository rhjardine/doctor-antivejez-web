'use client';

import { useState } from 'react';
import { DEFAULTS_O_B, DEFAULTS_A_AB, DEFAULTS_COMUNES } from '@/lib/nutrigenomica-defaults';
import { saveAlimentacion, sendAlimentacionToPWA } from '@/app/(dashboard)/historias/[id]/actions';
import { toast } from 'sonner';
import { X } from 'lucide-react';

// Para simplificar, obtenemos los tipos necesarios directamente
type GrupoSanguineo = 'O_B' | 'A_AB';
type Tab = 'plan' | 'guia' | 'claves';

interface Props {
    patient: any; // El objeto del paciente completo ya viene pasado
}

export default function NutrigenomicGuide({ patient }: Props) {
    // Inicializamos basados en la info previa del paciente si existe
    const initialData = patient.alimentacion;
    const initialBlood = (initialData?.grupoSanguineo as GrupoSanguineo) ||
        (patient.bloodType?.includes('A') ? 'A_AB' : 'O_B');

    const [activeTab, setActiveTab] = useState<Tab>('plan');
    const [grupo, setGrupo] = useState<GrupoSanguineo>(initialBlood);
    const [tipos, setTipos] = useState({
        nino: initialData?.tipoNino ?? false,
        metabolica: initialData?.tipoMetabolica ?? false,
        antidiabetica: initialData?.tipoAntidiabetica ?? false,
        citostatica: initialData?.tipoCitostatica ?? false,
        renal: initialData?.tipoRenal ?? false,
    });

    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSavingSuccess, setShowSavingSuccess] = useState(false);
    const [notasMedico, setNotasMedico] = useState<string>(initialData?.notasMedico || '');

    // dynamic lists for Plan Alimentario
    const defaultData = grupo === 'O_B' ? DEFAULTS_O_B : DEFAULTS_A_AB;
    const [desayuno, setDesayuno] = useState<string[]>(initialData?.planAlimentario?.desayuno || defaultData.desayuno);
    const [almuerzo, setAlmuerzo] = useState<string[]>(initialData?.planAlimentario?.almuerzo || defaultData.almuerzo);
    const [cenaComunes, setCenaComunes] = useState<string[]>(initialData?.planAlimentario?.cenaComunes || defaultData.cena.comunes);
    const [meriendas, setMeriendas] = useState<string[]>(initialData?.planAlimentario?.meriendas || DEFAULTS_COMUNES.meriendas);

    // Dynamic field handlers
    const addItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        const newItem = prompt('Añadir nuevo registro:');
        if (newItem) setList([...list, newItem]);
    };

    const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
        setList(list.filter((_, i) => i !== index));
    };

    const grupoData = grupo === 'O_B' ? DEFAULTS_O_B : DEFAULTS_A_AB;

    // ─── HANDLERS ───────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveAlimentacion({
                patientId: patient.id,
                grupoSanguineo: grupo,
                notasMedico: notasMedico,
                ...tipos,
                planAlimentario: {
                    desayuno,
                    almuerzo,
                    cenaComunes,
                    meriendas
                },
                // For now we keep default structured data for the rest unless edited via JSON in future steps
                combinaciones: initialData?.combinaciones || DEFAULTS_COMUNES.combinaciones,
                actividadFisica: initialData?.actividadFisica || DEFAULTS_COMUNES.actividadFisica,
                claves5a: initialData?.claves5a || DEFAULTS_COMUNES.claves5a
            });
            setShowSavingSuccess(true);
            toast.success('Plan alimentario guardado correctamente');
            setTimeout(() => setShowSavingSuccess(false), 3000);
        } catch (error) {
            toast.error('Ocurrió un error al guardar el plan');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleSend = async () => {
        setSending(true);
        try {
            await sendAlimentacionToPWA({ patientId: patient.id });
            toast.success('Plan enviado a la App Móvil del paciente');
        } catch (error) {
            toast.error('Error al notificar a la PWA');
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    // ─── RENDER ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4 pb-20 relative min-h-screen">
            {/* ── PERFIL DEL PACIENTE ─────────────────────────── */}
            <div className="bg-[#1a3a5c] rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#23bcef] mb-6 flex items-center gap-2">
                    <span>🍏</span> Perfil Nutrigenómico
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Grupo Sanguíneo */}
                    <div>
                        <label className="block text-xs uppercase tracking-wide opacity-60 mb-3">
                            Grupo Sanguíneo Base
                        </label>
                        <div className="flex gap-3">
                            {(['O_B', 'A_AB'] as const).map((g) => (
                                <button
                                    key={g}
                                    onClick={() => setGrupo(g)}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold
                    transition-all duration-300 border-2
                    ${grupo === g
                                            ? 'bg-[#23bcef] text-white border-[#23bcef] shadow-[0_0_15px_rgba(35,188,239,0.4)] scale-[1.02]'
                                            : 'bg-[#0f243d] text-white/70 border-white/5 hover:border-white/20'
                                        }`}
                                >
                                    {g === 'O_B' ? 'Grupo O y B' : 'Grupo A y AB'}
                                </button>
                            ))}
                        </div>
                        {/* Aviso por inferencia */}
                        <p className="mt-2 text-[10px] text-white/40 italic">
                            Predeterminado según ficha: {patient.bloodType || 'No registrado'}
                        </p>
                    </div>

                    {/* Tipos de Alimentación */}
                    <div>
                        <label className="block text-xs uppercase tracking-wide opacity-60 mb-3">
                            Enfoques Clínicos Específicos
                        </label>
                        <div className="flex flex-wrap gap-2.5">
                            {[
                                { key: 'nino', label: 'Niño' },
                                { key: 'metabolica', label: 'Metabólica' },
                                { key: 'antidiabetica', label: 'Antidiabética' },
                                { key: 'citostatica', label: 'Citostática' },
                                { key: 'renal', label: 'Renal' },
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setTipos(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all border
                    ${tipos[key as keyof typeof tipos]
                                            ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notas del Médico Libre */}
                <div className="mt-8 border-t border-white/10 pt-6">
                    <label className="block text-xs uppercase tracking-wide opacity-60 mb-3 flex items-center gap-2">
                        <span className="text-amber-400">📝</span> Observaciones Exclusivas del Médico
                    </label>
                    <textarea
                        value={notasMedico}
                        onChange={(e) => setNotasMedico(e.target.value)}
                        placeholder="Las indicaciones alimentarias libres, ajustes de dosis, o consideraciones escritas aquí, se mostrarán destacadas como una Nota del Dr. Antivejez directo en la App del Paciente..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-[#23bcef] focus:ring-1 focus:ring-[#23bcef] resize-y min-h-[100px] shadow-inner font-medium leading-relaxed"
                    />
                </div>
            </div>

            {/* ── TABS ───────────────────────────────────────── */}
            <div className="flex border-b border-gray-200 mt-4 overflow-x-auto custom-scrollbar-tabs">
                {[
                    { id: 'plan', label: '📅 Plan Alimentario' },
                    { id: 'guia', label: '📖 Guía General' },
                    { id: 'claves', label: '🧬 Claves 5A' },
                ].map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as Tab)}
                        className={`px-6 py-4 text-sm font-bold transition-all border-b-[3px] flex-shrink-0
              ${activeTab === id
                                ? 'text-[#23bcef] border-[#23bcef] bg-sky-50/30'
                                : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── CONTENIDO DE TABS ──────────────────────────── */}

            {/* TAB 1: PLAN ALIMENTARIO — diferenciado por grupo sanguíneo */}
            {activeTab === 'plan' && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                            Mostrando pauta oficial para:
                        </span>
                        <span className="bg-[#23bcef]/10 text-[#0c7092] text-xs font-black px-3 py-1 rounded-full border border-[#23bcef]/20">
                            {grupo === 'O_B' ? 'Grupo O y B' : 'Grupo A y AB'}
                        </span>
                    </div>

                    <SectionCard
                        icon="🌅"
                        title="Desayuno"
                        color="amber"
                        items={desayuno}
                        onAdd={() => addItem(desayuno, setDesayuno)}
                        onRemove={(i) => removeItem(desayuno, setDesayuno, i)}
                    />
                    <SectionCard
                        icon="☀️"
                        title="Almuerzo"
                        color="green"
                        items={almuerzo}
                        onAdd={() => addItem(almuerzo, setAlmuerzo)}
                        onRemove={(i) => removeItem(almuerzo, setAlmuerzo, i)}
                    />

                    <SectionCard
                        icon="🌙"
                        title="Cena"
                        color="blue"
                        items={cenaComunes}
                        onAdd={() => addItem(cenaComunes, setCenaComunes)}
                        onRemove={(i) => removeItem(cenaComunes, setCenaComunes, i)}
                        extraFooter={`Tendencia prioritaria: ${grupoData.cena.especifico}`}
                    />

                    <SectionCard
                        icon="🌿"
                        title="Meriendas y Variantes"
                        color="purple"
                        items={meriendas}
                        onAdd={() => addItem(meriendas, setMeriendas)}
                        onRemove={(i) => removeItem(meriendas, setMeriendas, i)}
                        extraContent={
                            <div className="mt-4 pt-4 border-t border-purple-100/50 space-y-3">
                                <DetailRow label="Ensaladas libres" items={DEFAULTS_COMUNES.ensaladasLibres} color="purple-700" />
                                <DetailRow label="Aderezos" items={DEFAULTS_COMUNES.aderezos} color="purple-700" />
                                <DetailRow label="Bebidas recomendadas" items={DEFAULTS_COMUNES.bebidas} color="purple-700" />
                            </div>
                        }
                    />

                    {/* Actividad Física */}
                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <span className="text-2xl drop-shadow-sm">🏃</span>
                            <h4 className="font-extrabold text-orange-800 text-lg">Rutina de Actividad Física Regular</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {Object.values(DEFAULTS_COMUNES.actividadFisica).map((turno) => (
                                <div key={turno.titulo} className="bg-white/80 rounded-xl p-4 border border-orange-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-300" />
                                    <p className="text-[11px] font-black text-orange-600 uppercase tracking-wider mb-3">
                                        {turno.titulo}
                                    </p>
                                    <ul className="space-y-2">
                                        {turno.items.map((item, i) => (
                                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2 font-medium">
                                                <span className="text-orange-400 mt-0.5">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: GUÍA GENERAL */}
            {activeTab === 'guia' && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Alimentos a Evitar */}
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl drop-shadow-sm">🚫</span>
                                <h4 className="font-extrabold text-red-800 text-lg">Alimentos a Evitar</h4>
                            </div>
                            <p className="text-sm text-red-900 leading-loose whitespace-pre-line font-medium opacity-90">
                                {DEFAULTS_COMUNES.alimentosEvitar}
                            </p>
                        </div>

                        {/* Sustitutos Recomendados */}
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-2xl drop-shadow-sm">✅</span>
                                <h4 className="font-extrabold text-emerald-800 text-lg">Sustitutos Recomendados</h4>
                            </div>
                            <p className="text-sm text-emerald-900 leading-loose whitespace-pre-line font-medium opacity-90">
                                {DEFAULTS_COMUNES.sustitutos}
                            </p>
                        </div>
                    </div>

                    {/* Combinaciones de Alimentos */}
                    <div className="bg-white border text-center border-slate-200/60 rounded-2xl p-8 shadow-sm">
                        <div className="inline-flex items-center justify-center gap-3 mb-8 bg-slate-100 px-6 py-2 rounded-full">
                            <span className="text-xl">🔗</span>
                            <h4 className="font-bold text-slate-800 tracking-wide uppercase text-sm">Reglas de Combinación de Alimentos</h4>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left">
                            {/* Desayuno */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-10" />
                                <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-4">
                                    Desayuno
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {DEFAULTS_COMUNES.combinaciones.desayuno.alimentos.map((a) => (
                                        <span key={a} className="bg-white border border-amber-100 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">
                                            {a}
                                        </span>
                                    ))}
                                </div>
                                <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-100/50">
                                    <span className="text-[10px] text-amber-800 font-extrabold uppercase block mb-2">Semillas activadoras:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DEFAULTS_COMUNES.combinaciones.desayuno.semillas.map((s) => (
                                            <span key={s} className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Almuerzo */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 col-span-1 xl:col-span-2 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full -z-10" />
                                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3 block">
                                    Almuerzo
                                </p>
                                {/* Alerta Roja */}
                                <div className="bg-rose-100 border-l-4 border-rose-500 rounded-r-xl p-3 mb-5 inline-block w-full">
                                    <p className="text-[11px] font-black text-rose-800 text-center tracking-widest uppercase flex items-center justify-center gap-2">
                                        <span>⚠️</span> Proteínas <span>→</span> <span className="underline decoration-2 underline-offset-2">Evitar mezclar con</span> <span>←</span> Carbohidratos Integrales
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white border-2 border-dashed border-sky-100 rounded-xl p-4">
                                        <p className="text-[10px] font-black uppercase text-sky-500 mb-2">Grupo Proteico</p>
                                        <div className="flex flex-wrap gap-1">
                                            {DEFAULTS_COMUNES.combinaciones.almuerzo.proteinas.map((p) => (
                                                <span key={p} className="text-xs text-sky-900 bg-sky-50 px-2 py-1 rounded font-medium">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white border-2 border-dashed border-orange-100 rounded-xl p-4">
                                        <p className="text-[10px] font-black uppercase text-orange-500 mb-2">Gpo. Carbohidratos</p>
                                        <div className="flex flex-wrap gap-1">
                                            {DEFAULTS_COMUNES.combinaciones.almuerzo.carbohidratos.map((c) => (
                                                <span key={c} className="text-xs text-orange-900 bg-orange-50 px-2 py-1 rounded font-medium">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                        <p className="text-[10px] font-black text-emerald-700 mb-2 uppercase">Lípidos (combinar con ambos):</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {DEFAULTS_COMUNES.combinaciones.almuerzo.grasasBuenas.map((g) => (
                                                <span key={g} className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                                        <p className="text-[10px] font-black text-violet-700 mb-2 uppercase">Combinar cualquier grupo con:</p>
                                        <p className="text-xs text-violet-900 font-bold mb-1">Granos y Vegetales Frescos</p>
                                        <p className="text-[10px] text-violet-600/80 font-medium">
                                            <span className="font-bold text-violet-600">Sin gluten:</span> {DEFAULTS_COMUNES.combinaciones.almuerzo.sinGluten.join(', ')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cena */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden xl:col-span-3">
                                <p className="text-xs font-black uppercase tracking-widest text-[#1a3a5c] mb-2">
                                    Cena Nocturna
                                </p>
                                <p className="text-sm font-medium text-slate-500 mb-4 opacity-80">
                                    {DEFAULTS_COMUNES.combinaciones.cena.descripcion}:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {DEFAULTS_COMUNES.combinaciones.cena.opciones.map((o) => (
                                        <span key={o} className="bg-white border border-[#1a3a5c]/20 text-[#1a3a5c] text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                            {o}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* TAB 3: CLAVES 5A */}
            {activeTab === 'claves' && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto">

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Las Claves de la Longevidad 5A</h2>
                        <p className="text-sm text-slate-500 font-medium pb-2 border-b border-slate-200 inline-block">
                            La guía definitiva para mantenerse joven, saludable y en forma
                        </p>
                    </div>

                    <div className="grid gap-5">
                        {DEFAULTS_COMUNES.claves5a.map((clave, index) => (
                            <div key={clave.clave}
                                className="bg-white border border-slate-100/80 rounded-2xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-10px_rgba(35,188,239,0.15)] transition-all duration-300 group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-[#23bcef]/10 flex items-center justify-center
                                    text-[#23bcef] font-black text-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                        {index + 1}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl drop-shadow-sm group-hover:-rotate-6 transition-transform">{clave.icono}</span>
                                        <h4 className="font-extrabold text-slate-800 text-lg uppercase tracking-wide">{clave.clave}</h4>
                                    </div>
                                </div>
                                <ul className="space-y-3 pl-[4.5rem]">
                                    {clave.items.map((item, i) => (
                                        <li key={i} className="text-sm text-slate-600 font-medium leading-relaxed flex items-start gap-3">
                                            <span className="text-slate-300 font-black mt-0.5 flex-shrink-0 select-none">
                                                {String.fromCharCode(97 + i)}.
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Frase final */}
                    <div className="mt-12 bg-gradient-to-r from-[#23bcef]/10 to-[#1a3a5c]/5 rounded-2xl p-8
                          border border-[#23bcef]/20 text-center shadow-inner relative overflow-hidden">
                        {/* Elemento decorativo */}
                        <div className="absolute -top-4 -left-4 font-serif text-[#23bcef]/20 text-8xl">"</div>
                        <p className="text-lg text-[#1a3a5c] italic font-semibold relative z-10 font-serif">
                            {DEFAULTS_COMUNES.frase}
                        </p>
                    </div>
                </div>
            )}

            {/* ── BARRA DE ACCIONES FLOTANTE ── */}
            <div className="fixed bottom-0 left-[250px] right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/60
                      px-8 py-5 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.04)] z-40
                      transition-all duration-300">
                {/* Sidebar width compensator en la clase left-[250px] asumiendo layout de dashboard */}

                <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
                        {saving || sending ? (
                            <div className="w-4 h-4 rounded-full border-2 border-[#23bcef] border-t-transparent animate-spin" />
                        ) : showSavingSuccess ? (
                            <span className="text-emerald-500 font-black animate-in zoom-in">✓</span>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Estado de la Guía
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                            {saving ? 'Procesando cambios...' : sending ? 'Notificando paciente...' : showSavingSuccess ? 'Cambios sincronizados' : initialData?.enviada ? 'Enviada al paciente' : 'Borrador editable'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">

                    {/* Guardar */}
                    <button
                        onClick={handleSave}
                        disabled={saving || sending}
                        className="px-6 py-3 text-sm font-bold text-[#1a3a5c] bg-slate-100 border border-slate-200 outline-none
                       hover:bg-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-sm
                       flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                    </button>

                    {/* Enviar a PWA */}
                    <button
                        onClick={handleSend}
                        disabled={saving || sending}
                        className="px-6 py-3 text-sm font-bold text-white shadow-xl shadow-[#23bcef]/20
                       bg-gradient-to-r from-[#23bcef] to-[#1a3a5c] hover:from-[#1da7d6] hover:to-[#15305a] 
                       rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 border border-[#23bcef]/50"
                    >
                        {sending ? 'Enviando...' : '📱 Sincronizar con App'}
                    </button>
                </div>
            </div>

        </div>
    );
}

// ── COMPONENTES INTERNOS ───

function SectionCard({ icon, title, color, items, extraContent, extraFooter, onAdd, onRemove }: {
    icon: string;
    title: string;
    color: 'amber' | 'green' | 'blue' | 'purple';
    items: string[];
    extraContent?: React.ReactNode;
    extraFooter?: string;
    onAdd?: () => void;
    onRemove?: (index: number) => void;
}) {
    const colors = {
        amber: 'bg-amber-50/50 border-amber-100/60 text-amber-900 border-l-4 border-l-amber-400',
        green: 'bg-emerald-50/50 border-emerald-100/60 text-emerald-900 border-l-4 border-l-emerald-400',
        blue: 'bg-sky-50/50 border-sky-100/60 text-sky-900 border-l-4 border-l-sky-400',
        purple: 'bg-purple-50/50 border-purple-100/60 text-purple-900 border-l-4 border-l-purple-400',
    };

    const titleColors = {
        amber: 'text-amber-700',
        green: 'text-emerald-700',
        blue: 'text-sky-700',
        purple: 'text-purple-700',
    };

    return (
        <div className={`${colors[color]} border-y border-r rounded-r-2xl rounded-l-md p-6 shadow-sm group/card`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl drop-shadow-sm">{icon}</span>
                    <h4 className={`font-extrabold text-lg uppercase tracking-wide ${titleColors[color]}`}>{title}</h4>
                </div>
                {onAdd && (
                    <button
                        onClick={onAdd}
                        className="bg-white/80 hover:bg-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-current transition-all active:scale-95 flex items-center gap-1 group-hover/card:scale-110"
                    >
                        <span>+</span> Añadir
                    </button>
                )}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5 mb-4">
                {items.map((item, i) => (
                    <li key={i} className={`text-sm font-medium flex items-start gap-2.5 opacity-90 leading-snug group/item`}>
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-40"></span>
                        <span className="flex-1">{item}</span>
                        {onRemove && (
                            <button
                                onClick={() => onRemove(i)}
                                className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-700 transition-all p-1"
                                title="Eliminar"
                            >
                                <X size={14} strokeWidth={3} />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            {extraFooter && (
                <div className="mt-2 text-xs font-black italic opacity-60 flex items-center gap-2">
                    <span className="w-1 h-1 bg-current rounded-full"></span>
                    {extraFooter}
                </div>
            )}
            {extraContent}
        </div>
    );
}

function DetailRow({ label, items, color }: { label: string; items: string[], color: string }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm">
            <span className={`font-extrabold uppercase text-[10px] tracking-widest text-${color} flex-shrink-0 sm:w-36 pt-0.5`}>{label}</span>
            <span className="font-medium text-slate-600 leading-relaxed">{items.join(', ')}</span>
        </div>
    );
}