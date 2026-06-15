import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ChecklistPage from './pages/ChecklistPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminLayout from './pages/AdminLayout'
import EmployeesPage from './pages/admin/EmployeesPage'
import ListsPage from './pages/admin/ListsPage'
import TasksPage from './pages/admin/TasksPage'
import ReportsPage from './pages/admin/ReportsPage'
import SettingsPage from './pages/admin/SettingsPage'
import PrintPage from './pages/PrintPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChecklistPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/reports" replace />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="lists" element={<ListsPage />} />
          <Route path="lists/:listId" element={<TasksPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/lists/:listId/print" element={<PrintPage />} />
      </Routes>
    </BrowserRouter>
  )
}
