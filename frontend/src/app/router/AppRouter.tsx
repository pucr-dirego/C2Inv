import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";

import { AuthPage } from "../../modules/auth/pages/AuthPage";
import { RoleHomePage } from "../../modules/home/pages/RoleHomePage";
import { InventoryOperationsPage } from "../../modules/inventory/pages/InventoryOperationsPage";
import { InventoryListPage } from "../../modules/inventory/pages/InventoryListPage";
import { EquipmentDetailPage } from "../../modules/inventory/pages/EquipmentDetailPage";
import { EquipmentCreatePage } from "../../modules/forms/equipment/pages/EquipmentCreatePage";
import { EquipmentEditPage } from "../../modules/forms/equipment/pages/EquipmentEditPage";
import { AdminUsersPage } from "../../modules/admin/pages/AdminUsersPage";
import { AdminBranchesPage } from "../../modules/admin/pages/AdminBranchesPage";
import { AnalyticsPage } from "../../modules/analytics/pages/AnalyticsPage";
import { ReportsPage } from "../../modules/reports/pages/ReportsPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<AuthPage />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleHomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/forms"
          element={
            <Navigate
              to="/forms/equipos/nuevo"
              replace
            />
          }
        />

        <Route
          path="/forms/equipos/nuevo"
          element={
            <ProtectedRoute>
              <EquipmentCreatePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/operations"
          element={
            <ProtectedRoute>
              <RoleRoute
                roles={[
                  "SUPERADMIN",
                  "GERENTE",
                ]}
              >
                <InventoryOperationsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <RoleRoute
                roles={[
                  "SUPERADMIN",
                  "GERENTE",
                ]}
              >
                <InventoryListPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/equipment/:id"
          element={
            <ProtectedRoute>
              <EquipmentDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory/equipment/:id/edit"
          element={
            <ProtectedRoute>
              <RoleRoute
                roles={[
                  "SUPERADMIN",
                  "GERENTE",
                ]}
              >
                <EquipmentEditPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <RoleRoute
                roles={[
                  "SUPERADMIN",
                  "GERENTE",
                ]}
              >
                <AnalyticsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <RoleRoute
                roles={[
                  "SUPERADMIN",
                  "GERENTE",
                ]}
              >
                <ReportsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/branches"
          element={
            <ProtectedRoute>
              <RoleRoute
                roles={[
                  "SUPERADMIN",
                ]}
              >
                <AdminBranchesPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute
                roles={[
                  "SUPERADMIN",
                ]}
              >
                <AdminUsersPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
