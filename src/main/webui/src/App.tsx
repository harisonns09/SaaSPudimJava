import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './pages/admin/_layout';
import { DashboardPage } from './pages/admin/Dashboard';
import { ProductsPage } from './pages/admin/Products';
import { OrdersPage } from './pages/admin/Orders';
import { SettingsPage } from './pages/admin/Settings';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register'; // Importa a nova página
import { PublicMenuPage } from './pages/public/PublicMenu';
import { OrderTrackingPage } from './pages/public/MeusPedidos';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} /> {/* Adiciona a nova rota */}
                    <Route path="/produtos" element={<Navigate to="/admin/produtos" replace />} />

                    <Route
                        path="/admin"
                        element={<PrivateRoute><AdminLayout /></PrivateRoute>}
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="pedidos" element={<OrdersPage />} />
                        <Route path="produtos" element={<ProductsPage />} />
                        <Route path="configuracoes" element={<SettingsPage />} />
                    </Route>

                    <Route path="/:slug/pedido" element={<OrderTrackingPage />} />
                    <Route path="/:slug" element={<PublicMenuPage />} />

                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
