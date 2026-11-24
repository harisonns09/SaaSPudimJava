import { Outlet } from 'react-router-dom';

// Componente de Layout básico para o painel de administração
export function AdminLayout() {
    return (
        <div>
            <header style={{ padding: '1rem', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
                <h1>Painel de Administração</h1>
                {/* TODO: Adicionar links de navegação */}
            </header>
            <main style={{ padding: '1rem' }}>
                <Outlet /> {/* As rotas aninhadas (Dashboard, Produtos, etc.) serão renderizadas aqui */}
            </main>
        </div>
    );
}
