import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    LifeBuoy,
    LoaderCircle,
    LogOut,
    PauseCircle,
    Plus,
    Power,
    Save,
    Search,
    Store,
    X,
} from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StoreConfig } from '../../types';

interface EditFormState {
    nomeLoja: string;
    subtitulo: string;
    taxaEntregaPadrao: string;
    abertaParaEncomendas: boolean;
    infinitepayHandle: string;
}

interface CreateFormState {
    nomeLoja: string;
    adminEmail: string;
    adminPassword: string;
}

interface Feedback {
    type: 'success' | 'error';
    message: string;
}

type ModalState = { type: 'create' } | { type: 'edit'; store: StoreConfig } | null;

const inputClass =
    'w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2 text-sm text-[#291D16] placeholder:text-[#A0907F] focus:border-[#B45309] focus:outline-none focus:ring-2 focus:ring-[#B45309]/20';

const primaryButton =
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#B45309] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#9A3412] disabled:opacity-50';

const secondaryButton =
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#EAE1D5] bg-white px-3 py-1.5 text-xs font-medium text-[#5C4A3E] transition-colors hover:bg-[#FAF7F2]';

const emptyCreateForm: CreateFormState = { nomeLoja: '', adminEmail: '', adminPassword: '' };

function toForm(store: StoreConfig): EditFormState {
    return {
        nomeLoja: store.nomeLoja ?? '',
        subtitulo: store.subtitulo ?? '',
        taxaEntregaPadrao: store.taxaEntregaPadrao != null ? String(store.taxaEntregaPadrao) : '',
        abertaParaEncomendas: store.abertaParaEncomendas,
        infinitepayHandle: store.infinitepayHandle ?? '',
    };
}

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function StatCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Store; tone: string }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-[#EAE1D5] bg-white p-4 shadow-sm">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-medium text-[#7A6658]">{label}</p>
                <p className="font-display text-2xl font-semibold text-[#291D16]">{value}</p>
            </div>
        </div>
    );
}

function StatusPill({ ativa }: { ativa: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                ativa ? 'bg-[#ECFDF3] text-[#166534]' : 'bg-[#F3F4F6] text-[#4B5563]'
            }`}
        >
            {ativa ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
            {ativa ? 'Ativa' : 'Desativada'}
        </span>
    );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-[#291D16]/40 backdrop-blur-[1px]" />
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between gap-4 border-b border-[#F2EAE0] px-6 py-4">
                    <div>
                        <h2 id="modal-title" className="font-display text-lg font-semibold text-[#291D16]">{title}</h2>
                        {subtitle && <p className="mt-0.5 text-xs text-[#7A6658]">{subtitle}</p>}
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1.5 text-[#7A6658] hover:bg-[#FAF7F2]">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5">{children}</div>
            </div>
        </div>
    );
}

export function SuperAdminStoresPage() {
    const navigate = useNavigate();
    const { login, logout } = useAuth();

    const [stores, setStores] = useState<StoreConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [search, setSearch] = useState('');

    const [modal, setModal] = useState<ModalState>(null);
    const [editForm, setEditForm] = useState<EditFormState | null>(null);
    const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
    const [saving, setSaving] = useState(false);

    const loadStores = () =>
        api
            .listarLojas()
            .then(setStores)
            .catch((error: unknown) =>
                setFeedback({ type: 'error', message: errorMessage(error, 'Não foi possível carregar as lojas.') }),
            )
            .finally(() => setLoading(false));

    useEffect(() => {
        loadStores();
    }, []);

    useEffect(() => {
        if (!feedback) return;
        const timer = window.setTimeout(() => setFeedback(null), 5000);
        return () => window.clearTimeout(timer);
    }, [feedback]);

    const closeModal = () => setModal(null);

    const filteredStores = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return stores;
        return stores.filter((s) => s.nomeLoja.toLowerCase().includes(term) || s.slug.toLowerCase().includes(term));
    }, [stores, search]);

    const totalAtivas = stores.filter((s) => s.ativa !== false).length;

    const openEdit = async (tenantId: string) => {
        try {
            const store = await api.buscarLoja(tenantId);
            setEditForm(toForm(store));
            setModal({ type: 'edit', store });
        } catch (error) {
            setFeedback({ type: 'error', message: errorMessage(error, 'Não foi possível abrir a loja.') });
        }
    };

    const openCreate = () => {
        setCreateForm(emptyCreateForm);
        setModal({ type: 'create' });
    };

    const updateEdit = <K extends keyof EditFormState>(field: K, value: EditFormState[K]) =>
        setEditForm((current) => (current ? { ...current, [field]: value } : current));

    const handleSave = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (modal?.type !== 'edit' || !editForm) return;

        const taxaTexto = editForm.taxaEntregaPadrao.trim().replace(',', '.');
        const taxa = taxaTexto === '' ? null : Number(taxaTexto);
        if (taxa !== null && (Number.isNaN(taxa) || taxa < 0)) {
            setFeedback({ type: 'error', message: 'Informe uma taxa de entrega válida (zero ou maior).' });
            return;
        }

        setSaving(true);
        try {
            const saved = await api.atualizarLoja(modal.store.tenantId, {
                nomeLoja: editForm.nomeLoja.trim(),
                subtitulo: editForm.subtitulo.trim() || null,
                taxaEntregaPadrao: taxa,
                abertaParaEncomendas: editForm.abertaParaEncomendas,
                infinitepayHandle: editForm.infinitepayHandle.trim() || null,
            });
            setStores((current) => current.map((s) => (s.tenantId === saved.tenantId ? saved : s)));
            setModal(null);
            setFeedback({ type: 'success', message: 'Loja atualizada.' });
        } catch (error) {
            setFeedback({ type: 'error', message: errorMessage(error, 'Não foi possível salvar a loja.') });
        } finally {
            setSaving(false);
        }
    };

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            const created = await api.criarLoja({
                nomeLoja: createForm.nomeLoja.trim(),
                adminEmail: createForm.adminEmail.trim(),
                adminPassword: createForm.adminPassword,
            });
            setStores((current) => [...current, created].sort((a, b) => a.nomeLoja.localeCompare(b.nomeLoja)));
            setModal(null);
            setFeedback({ type: 'success', message: `Loja "${created.nomeLoja}" criada.` });
        } catch (error) {
            setFeedback({ type: 'error', message: errorMessage(error, 'Não foi possível criar a loja.') });
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (store: StoreConfig) => {
        const ativar = store.ativa === false;
        const pergunta = ativar
            ? `Reativar a loja "${store.nomeLoja}"?`
            : `Desativar a loja "${store.nomeLoja}"? O cardápio ficará indisponível e novos pedidos serão bloqueados.`;
        if (!window.confirm(pergunta)) return;

        try {
            const updated = await api.alterarStatusLoja(store.tenantId, ativar);
            setStores((current) => current.map((s) => (s.tenantId === updated.tenantId ? updated : s)));
            setFeedback({ type: 'success', message: ativar ? 'Loja reativada.' : 'Loja desativada.' });
        } catch (error) {
            setFeedback({ type: 'error', message: errorMessage(error, 'Não foi possível alterar o status.') });
        }
    };

    const accessAsSupport = async (store: StoreConfig) => {
        try {
            const session = await api.iniciarSuporte(store.tenantId);
            login(session);
            navigate('/admin');
        } catch (error) {
            setFeedback({ type: 'error', message: errorMessage(error, 'Não foi possível acessar a loja.') });
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/superadmin/login');
    };

    return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#291D16]">
            <header className="sticky top-0 z-30 border-b border-[#EAE1D5] bg-white/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <BrandMark />
                        <span className="rounded-full bg-[#FAF3E8] px-2.5 py-0.5 text-xs font-semibold text-[#9A3412]">
                            Superadmin
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#5C4A3E] hover:bg-[#FAF7F2]"
                    >
                        <LogOut className="h-4 w-4" /> Sair
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-semibold text-[#291D16]">Lojas cadastradas</h1>
                        <p className="mt-1 text-sm text-[#7A6658]">Gerencie as lojas da plataforma e dê suporte a cada uma.</p>
                    </div>
                    <button type="button" onClick={openCreate} className={primaryButton}>
                        <Plus className="h-4 w-4" /> Nova loja
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Total de lojas" value={stores.length} icon={Store} tone="bg-[#FAF3E8] text-[#B45309]" />
                    <StatCard label="Ativas" value={totalAtivas} icon={CheckCircle2} tone="bg-[#ECFDF3] text-[#166534]" />
                    <StatCard label="Desativadas" value={stores.length - totalAtivas} icon={PauseCircle} tone="bg-[#F3F4F6] text-[#4B5563]" />
                </div>

                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0907F]" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou endereço da loja"
                        aria-label="Buscar loja"
                        className={`${inputClass} pl-9`}
                    />
                </div>

                {loading && (
                    <div className="flex items-center gap-2 text-sm text-[#7A6658]">
                        <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando lojas...
                    </div>
                )}

                {!loading && filteredStores.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#D9CBB8] bg-white px-6 py-10 text-center">
                        <Store className="mx-auto h-8 w-8 text-[#A0907F]" />
                        <p className="mt-3 text-sm font-medium text-[#5C4A3E]">
                            {stores.length === 0 ? 'Nenhuma loja cadastrada ainda.' : 'Nenhuma loja encontrada para a busca.'}
                        </p>
                    </div>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredStores.map((store) => {
                        const ativa = store.ativa !== false;
                        return (
                            <article
                                key={store.tenantId}
                                className={`flex flex-col justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                                    ativa ? 'border-[#EAE1D5]' : 'border-[#E5E7EB] opacity-80'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <h2 className="font-display text-base font-semibold leading-tight text-[#291D16]">{store.nomeLoja}</h2>
                                        <StatusPill ativa={ativa} />
                                    </div>
                                    <p className="truncate text-xs text-[#7A6658]">/{store.slug}</p>
                                    <p className="text-xs text-[#856F60]">
                                        {store.abertaParaEncomendas ? 'Aceita encomendas' : 'Sem encomendas'}
                                        {store.taxaEntregaPadrao != null && ` · Entrega R$ ${Number(store.taxaEntregaPadrao).toFixed(2).replace('.', ',')}`}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 border-t border-[#F2EAE0] pt-4">
                                    <button type="button" onClick={() => openEdit(store.tenantId)} className={secondaryButton}>
                                        Configurar
                                    </button>
                                    <button type="button" onClick={() => accessAsSupport(store)} className={secondaryButton}>
                                        <LifeBuoy className="h-3.5 w-3.5" /> Acessar como suporte
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleStatus(store)}
                                        className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                            ativa ? 'text-[#991B1B] hover:bg-[#FEF2F2]' : 'text-[#166534] hover:bg-[#ECFDF3]'
                                        }`}
                                    >
                                        <Power className="h-3.5 w-3.5" /> {ativa ? 'Desativar' : 'Reativar'}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </main>

            {feedback && (
                <div
                    role="status"
                    className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
                        feedback.type === 'success' ? 'bg-[#166534] text-white' : 'bg-[#991B1B] text-white'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            {modal?.type === 'create' && (
                <Modal title="Cadastrar nova loja" subtitle="Cria a loja e o primeiro administrador dela." onClose={closeModal}>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-[#5C4A3E]">Nome da loja *</span>
                            <input
                                required
                                value={createForm.nomeLoja}
                                onChange={(e) => setCreateForm({ ...createForm, nomeLoja: e.target.value })}
                                className={inputClass}
                            />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-[#5C4A3E]">E-mail do administrador da loja *</span>
                            <input
                                required
                                type="email"
                                value={createForm.adminEmail}
                                onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                                className={inputClass}
                            />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-[#5C4A3E]">Senha inicial *</span>
                            <input
                                required
                                type="password"
                                minLength={6}
                                value={createForm.adminPassword}
                                onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                                className={inputClass}
                            />
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={closeModal} className={secondaryButton}>
                                Cancelar
                            </button>
                            <button type="submit" disabled={saving} className={primaryButton}>
                                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Criar loja
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal?.type === 'edit' && editForm && (
                <Modal title={`Configurações de ${modal.store.nomeLoja}`} subtitle={`Endereço público: /${modal.store.slug}`} onClose={closeModal}>
                    <form onSubmit={handleSave} className="space-y-4">
                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-[#5C4A3E]">Nome da loja *</span>
                            <input required value={editForm.nomeLoja} onChange={(e) => updateEdit('nomeLoja', e.target.value)} className={inputClass} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-[#5C4A3E]">Subtítulo</span>
                            <input value={editForm.subtitulo} onChange={(e) => updateEdit('subtitulo', e.target.value)} className={inputClass} />
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-[#5C4A3E]">Taxa de entrega padrão (R$)</span>
                            <input
                                inputMode="decimal"
                                value={editForm.taxaEntregaPadrao}
                                onChange={(e) => updateEdit('taxaEntregaPadrao', e.target.value)}
                                placeholder="0,00"
                                className={inputClass}
                            />
                        </label>
                        <label className="flex items-center gap-3 rounded-lg bg-[#FAF7F2] px-3 py-2.5">
                            <input
                                type="checkbox"
                                checked={editForm.abertaParaEncomendas}
                                onChange={(e) => updateEdit('abertaParaEncomendas', e.target.checked)}
                                className="h-4 w-4 accent-[#B45309]"
                            />
                            <span className="text-sm text-[#291D16]">Aceitando encomendas no cardápio público</span>
                        </label>
                        <label className="block space-y-1">
                            <span className="text-xs font-medium text-[#5C4A3E]">InfiniteTag</span>
                            <input
                                value={editForm.infinitepayHandle}
                                onChange={(e) => updateEdit('infinitepayHandle', e.target.value)}
                                placeholder="sua-tag (sem o $)"
                                className={inputClass}
                            />
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={closeModal} className={secondaryButton}>
                                Fechar
                            </button>
                            <button type="submit" disabled={saving} className={primaryButton}>
                                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar alterações
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
