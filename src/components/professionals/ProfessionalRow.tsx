import { MoreHorizontal, CreditCard, UserCheck, UserX, Edit2, Trash2, History } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export const ProfessionalRow = ({ prof, onEdit, onDelete, onRecharge }: any) => {
    const isLowQuota = (prof.quotaMax - prof.quotaUsed) < 10;
    const quotaBalance = prof.quotaMax - prof.quotaUsed;

    return (
        <tr className="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
            <td className="p-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#293b64] text-white flex items-center justify-center font-bold">
                        {prof.name ? prof.name[0] : '?'}
                    </div>
                    <span className="font-bold text-slate-800">{prof.name}</span>
                </div>
            </td>
            <td className="p-4 text-sm font-mono text-slate-500">{prof.cedula || 'N/A'}</td>
            <td className="p-4 text-sm text-slate-600">{prof.role}</td>
            <td className="p-4 text-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${prof.status === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                    {prof.status || 'INACTIVO'}
                </span>
            </td>
            <td className="p-4 text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-sm ${isLowQuota ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-cyan-50 text-[#23bcef]'
                    }`}>
                    <CreditCard size={14} />
                    {quotaBalance}
                </div>
            </td>
            <td className="p-4 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-slate-100 bg-white">
                        <DropdownMenuItem onClick={() => onRecharge(prof)} className="flex gap-2 p-3 font-bold text-xs uppercase text-[#23bcef] cursor-pointer hover:bg-slate-50">
                            <CreditCard size={16} /> Recargar Cuota
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(prof)} className="flex gap-2 p-3 font-bold text-xs uppercase text-slate-600 cursor-pointer hover:bg-slate-50">
                            <Edit2 size={16} /> Editar Datos
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex gap-2 p-3 font-bold text-xs uppercase text-slate-600 cursor-pointer hover:bg-slate-50">
                            <History size={16} /> Ver Consumo
                        </DropdownMenuItem>
                        <div className="h-[1px] bg-slate-100 my-1" />
                        <DropdownMenuItem onClick={() => onDelete(prof)} className="flex gap-2 p-3 font-bold text-xs uppercase text-rose-600 cursor-pointer hover:bg-rose-50">
                            <Trash2 size={16} /> Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    );
};
