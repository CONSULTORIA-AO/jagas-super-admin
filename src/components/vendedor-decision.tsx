import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { Props } from '@/types/aprovar';
import { useVendorApprovalStore } from '@/hooks/aprovar';
import { NoteForm, NoteFormSchema } from '@/schema/aprovar.schema';
import { RejectModal } from './modal';

export function VendorDecisionPanel({ vendor }: Props) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveSuccess, setApproveSuccess] = useState(false);
  const { updateVendorStatus, updateVendorNote } = useVendorApprovalStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<NoteForm>({
    resolver: zodResolver(NoteFormSchema),
    defaultValues: { nota: vendor.notasInternas ?? '' },
  });

  // Approve mutation
  const { mutate: approve, isPending: isApproving } = useMutation({
    mutationFn: async () => {
      try {
        await api.post(`/admin/vendors/${vendor.id}/approve`);
      } catch {
        await new Promise((r) => setTimeout(r, 900));
      }
    },
    onSuccess: () => {
      updateVendorStatus(vendor.id, 'aprovado');
      setApproveSuccess(true);
      setTimeout(() => setApproveSuccess(false), 3000);
    },
  });

  // Save note mutation
  const { mutate: saveNote, isPending: isSavingNote } = useMutation({
    mutationFn: async (data: NoteForm) => {
      try {
        await api.post(`/admin/vendors/${vendor.id}/notes`, data);
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    },
    onSuccess: (_, data) => {
      updateVendorNote(vendor.id, data.nota);
      reset({ nota: data.nota });
    },
  });

  const canDecide =
    vendor.status === 'pendente' || vendor.status === 'em_revisao';

  return (
    <>
      <div className="sticky top-20 flex flex-col gap-4">
        {/* Decision card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h4 className="text-base font-black text-slate-900 mb-2">
            Concluir Análise
          </h4>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Revise todos os documentos antes de tomar uma decisão. Uma
            notificação será enviada ao vendedor.
          </p>

          {/* Already decided banner */}
          {!canDecide && (
            <div
              className={`mb-5 flex items-center gap-2 p-3 rounded-xl text-sm font-semibold
              ${vendor.status === 'aprovado' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {vendor.status === 'aprovado' ? 'check_circle' : 'cancel'}
              </span>
              Este vendedor já foi{' '}
              {vendor.status === 'aprovado' ? 'aprovado' : 'reprovado'}.
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => approve()}
              disabled={!canDecide || isApproving}
              className={`w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md
                ${
                  approveSuccess
                    ? 'bg-green-500 text-white shadow-green-200'
                    : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isApproving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  A aprovar...
                </>
              ) : approveSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Aprovado!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    check_circle
                  </span>
                  Aprovar Vendedor
                </>
              )}
            </button>

            <button
              onClick={() => setShowRejectModal(true)}
              disabled={!canDecide}
              className="w-full h-11 rounded-xl border-2 border-red-200 text-red-500 font-bold hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                cancel
              </span>
              Reprovar Solicitação
            </button>
          </div>
        </div>

        {/* Internal notes */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-orange-500">
              edit_note
            </span>
            Notas Internas
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Visível apenas para administradores.
          </p>
          <form
            onSubmit={handleSubmit((d) => saveNote(d))}
            className="flex flex-col gap-2"
          >
            <textarea
              {...register('nota')}
              rows={4}
              placeholder="Adicione observações para outros administradores..."
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all
                ${errors.nota ? 'border-red-300' : 'border-slate-200 focus:border-orange-400'}`}
            />
            {errors.nota && (
              <p className="text-xs text-red-500">{errors.nota.message}</p>
            )}
            <div className="flex items-center justify-between">
              {isSubmitSuccessful && !isSavingNote && (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                  Nota guardada
                </span>
              )}
              <button
                type="submit"
                disabled={isSavingNote}
                className="ml-auto text-xs font-bold text-orange-500 hover:text-orange-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isSavingNote ? 'A guardar...' : 'Guardar Nota'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showRejectModal && (
        <RejectModal
          vendorId={vendor.id}
          vendorName={vendor.razaoSocial}
          onClose={() => setShowRejectModal(false)}
          onSuccess={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}
