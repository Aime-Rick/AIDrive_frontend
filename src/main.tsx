import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'

// Import all the components needed for routing
import Root from './Root';
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import AuthLayout from "./components/layout/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DrivePage from "./pages/dashboard/DrivePage";
import AssistantPage from "./pages/dashboard/AssistantPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/sign-in", element: <SignInPage /> },
          { path: "/sign-up", element: <SignUpPage /> },
        ]
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/",
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DrivePage /> },
              { path: "assistant", element: <AssistantPage /> },
              { path: "settings", element: <SettingsPage /> },
            ]
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
