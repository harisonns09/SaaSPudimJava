import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ImagePlus, LoaderCircle, PackagePlus, Pencil, Power, X } from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/format';
import { ResilientImage } from '../../components/ResilientImage';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface ProductForm {
    nome: string;
    descricao: string;
    precoVenda: string;
    custoEstimado: string;
    estoqueAtual: string;
    imagemUrl: string;
}

const INITIAL_FORM: ProductForm = {
    nome: '',
    descricao: '',
    precoVenda: '',
    custoEstimado: '',
    estoqueAtual: '0',
    imagemUrl: '',
};

export function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editing, setEditing] = useState<Product | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
    const [pendingToggle, setPendingToggle] = useState<Product | null>(null);

    const startEdit = (product: Product) => {
        setEditing(product);
        setForm({
            nome: product.nome,
            descricao: product.descricao ?? '',
            precoVenda: String(product.precoVenda),
            custoEstimado: String(product.custoEstimado ?? ''),
            estoqueAtual: String(product.estoqueAtual),
            imagemUrl: product.imagemUrl ?? '',
        });
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditing(null);
        setForm(INITIAL_FORM);
        setError(null);
    };

    const toggleActive = async (product: Product) => {
        setTogglingId(product.id);
        setError(null);
        setSuccess(null);
        try {
            const updated = await api.toggleProductActive(product.id, !product.ativo);
            setProducts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
            setSuccess(`${updated.nome} ${updated.ativo ? 'ativado' : 'desativado'} com sucesso.`);
        } catch (toggleError) {
            setError(toggleError instanceof Error ? toggleError.message : 'Não foi possível alterar o status do produto.');
        } finally {
            setTogglingId(null);
        }
    };

    const loadProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setProducts(await api.getProducts());
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os produtos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProducts();
    }, [loadProducts]);

    const handleSubmit = async () => {
        setError(null);
        setSuccess(null);

        const price = Number(form.precoVenda.replace(',', '.'));
        const cost = Number(form.custoEstimado.replace(',', '.')) || 0;
        const stock = Number(form.estoqueAtual);

        if (!form.nome.trim() || !Number.isFinite(price) || price <= 0) {
            setError('Informe o nome do produto e um preço de venda maior que zero.');
            return;
        }
        if (!Number.isInteger(stock) || stock < 0) {
            setError('Informe um estoque igual ou maior que zero.');
            return;
        }
        if (!Number.isFinite(cost) || cost < 0) {
            setError('Informe um custo válido, igual ou maior que zero.');
            return;
        }

        setSaving(true);
        try {
            const saved = await api.saveProduct({
                ...(editing
                    ? { id: editing.id, ativo: editing.ativo, destaque: editing.destaque }
                    : { ativo: true }),
                nome: form.nome.trim(),
                descricao: form.descricao.trim(),
                precoVenda: price,
                custoEstimado: cost,
                estoqueAtual: stock,
                imagemUrl: form.imagemUrl.trim(),
            });
            if (editing) {
                setProducts((current) => current.map((item) => (item.id === saved.id ? saved : item)));
                setEditing(null);
                setSuccess(`${saved.nome} foi atualizado com sucesso.`);
            } else {
                setProducts((current) => [saved, ...current]);
                setSuccess(`${saved.nome} foi cadastrado com sucesso.`);
            }
            setForm(INITIAL_FORM);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Não foi possível cadastrar o produto.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-xl border border-[#EAE1D5] bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF3E8] text-[#B45309]">
                        <PackagePlus className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-display text-lg font-semibold text-[#291D16]">
                            {editing ? `Editar ${editing.nome}` : 'Cadastrar produto'}
                        </h2>
                        <p className="text-sm text-[#7A6658]">
                            {editing
                                ? 'Altere os dados do produto. A exclusão não está disponível; use desativar.'
                                : 'Adicione um produto ao estoque e ao cardápio da sua loja.'}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        setConfirmSaveOpen(true);
                    }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                >

                    <label className="space-y-1.5 sm:col-span-2">
                        <span className="text-sm font-medium text-[#5C4A3E]">Nome do produto *</span>
                        <input
                            required
                            maxLength={120}
                            value={form.nome}
                            onChange={(event) => setForm({ ...form, nome: event.target.value })}
                            placeholder="Ex.: Pudim tradicional"
                            className="w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/15"
                        />
                    </label>

                    <label className="space-y-1.5 sm:col-span-2">
                        <span className="text-sm font-medium text-[#5C4A3E]">Descrição</span>
                        <textarea
                            rows={3}
                            maxLength={1000}
                            value={form.descricao}
                            onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                            placeholder="Descreva os ingredientes, sabor ou diferenciais do produto."
                            className="w-full resize-y rounded-lg border border-[#EAE1D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/15"
                        />
                    </label>

                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#5C4A3E]">Preço de venda (R$) *</span>
                        <input
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.precoVenda}
                            onChange={(event) => setForm({ ...form, precoVenda: event.target.value })}
                            placeholder="0,00"
                            className="w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/15"
                        />
                    </label>

                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#5C4A3E]">Custo estimado (R$)</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.custoEstimado}
                            onChange={(event) => setForm({ ...form, custoEstimado: event.target.value })}
                            placeholder="0,00"
                            className="w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/15"
                        />
                    </label>

                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-[#5C4A3E]">Estoque inicial *</span>
                        <input
                            required
                            type="number"
                            min="0"
                            step="1"
                            value={form.estoqueAtual}
                            onChange={(event) => setForm({ ...form, estoqueAtual: event.target.value })}
                            className="w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/15"
                        />
                    </label>

                    <label className="space-y-1.5 sm:col-span-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-[#5C4A3E]">
                            <ImagePlus className="h-4 w-4" /> URL da imagem (opcional)
                        </span>
                        <input
                            type="url"
                            maxLength={1000}
                            value={form.imagemUrl}
                            onChange={(event) => setForm({ ...form, imagemUrl: event.target.value })}
                            placeholder="https://exemplo.com/imagem.jpg"
                            className="w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B45309] focus:ring-2 focus:ring-[#B45309]/15"
                        />
                    </label>

                    {error && (
                        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 sm:col-span-2">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
                            {success}
                        </p>
                    )}

                    <div className="flex justify-end gap-2 sm:col-span-2">
                        {editing && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#EAE1D5] px-4 py-2.5 text-sm font-semibold text-[#5C4A3E] hover:bg-[#FAF7F2]"
                            >
                                <X className="h-4 w-4" /> Cancelar
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar produto'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-xl border border-[#EAE1D5] bg-white">
                <div className="border-b border-[#F0E8DD] px-5 py-4 sm:px-6">
                    <h2 className="font-display text-base font-semibold text-[#291D16]">Produtos cadastrados</h2>
                </div>
                {loading ? (
                    <p className="px-5 py-8 text-center text-sm text-[#7A6658]">Carregando produtos...</p>
                ) : products.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-[#7A6658]">Nenhum produto cadastrado ainda.</p>
                ) : (
                    <ul className="divide-y divide-[#F0E8DD]">
                        {products.map((product) => (
                            <li key={product.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                                <ResilientImage
                                    src={product.imagemUrl}
                                    alt=""
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-[#291D16]">
                                        <span className="truncate">{product.nome}</span>
                                        <span
                                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                                product.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                                            }`}
                                        >
                                            {product.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </p>
                                    <p className="text-xs text-[#7A6658]">Estoque: {product.estoqueAtual}</p>
                                </div>
                                <p className="shrink-0 text-sm font-semibold text-[#291D16]">{formatCurrency(product.precoVenda)}</p>
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => startEdit(product)}
                                        aria-label={`Editar ${product.nome}`}
                                        className="rounded-lg p-2 text-[#5C4A3E] hover:bg-[#FAF7F2]"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPendingToggle(product)}
                                        disabled={togglingId === product.id}
                                        aria-label={`${product.ativo ? 'Desativar' : 'Ativar'} ${product.nome}`}
                                        className="rounded-lg p-2 text-[#5C4A3E] hover:bg-[#FAF7F2] disabled:opacity-50"
                                    >
                                        {togglingId === product.id ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Power className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <ConfirmDialog
                open={confirmSaveOpen}
                title={editing ? 'Salvar alterações do produto' : 'Cadastrar produto'}
                message={
                    editing
                        ? `Salvar as alterações em "${editing.nome}"?`
                        : `Cadastrar o produto "${form.nome.trim() || 'sem nome'}" no estoque e no cardápio?`
                }
                confirmLabel={editing ? 'Salvar' : 'Cadastrar'}
                loading={saving}
                onConfirm={async () => {
                    await handleSubmit();
                    setConfirmSaveOpen(false);
                }}
                onCancel={() => setConfirmSaveOpen(false)}
            />

            <ConfirmDialog
                open={pendingToggle !== null}
                title={pendingToggle?.ativo ? 'Desativar produto' : 'Ativar produto'}
                message={
                    pendingToggle?.ativo
                        ? `Desativar "${pendingToggle.nome}"? Ele deixará de aparecer no cardápio público.`
                        : `Ativar "${pendingToggle?.nome ?? ''}" no cardápio público?`
                }
                confirmLabel={pendingToggle?.ativo ? 'Desativar' : 'Ativar'}
                tone={pendingToggle?.ativo ? 'danger' : 'default'}
                onConfirm={() => {
                    const target = pendingToggle;
                    setPendingToggle(null);
                    if (target) void toggleActive(target);
                }}
                onCancel={() => setPendingToggle(null)}
            />
        </div>
    );
}
