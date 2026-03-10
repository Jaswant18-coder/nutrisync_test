import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "./store"
import AppLayout from "./components/AppLayout"
import HomePage from "./pages/HomePage"
import LoginPage from "./pages/LoginPage"
import DoctorDashboard from "./pages/DoctorDashboard"
import PatientDashboard from "./pages/PatientDashboard"
import KitchenDashboard from "./pages/KitchenDashboard"
import Analytics from "./pages/Analytics"
import InventoryPage from "./pages/InventoryPage"
import MyDashboard from "./pages/MyDashboard"
import OrdersPage from "./pages/OrdersPage"

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function RoleBasedIndex() {
  const role = useAuthStore((s) => s.user?.role)
  if (role === "patient") return <Navigate to="/my-dashboard" replace />
  if (role === "kitchen_staff") return <Navigate to="/kitchen" replace />
  return <Navigate to="/doctor" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<RoleBasedIndex />} />
            <Route path="doctor" element={<DoctorDashboard />} />
            <Route path="patient" element={<PatientDashboard />} />
            <Route path="kitchen" element={<KitchenDashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="my-dashboard" element={<MyDashboard />} />
            <Route path="orders" element={<OrdersPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
