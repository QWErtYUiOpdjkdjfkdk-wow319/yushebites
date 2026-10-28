import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Root from './components/Root'
import Login from './pages/Login'
import ProtectedRoutes from './utils/ProtectedRoutes'
import Dashboard from './pages/Dashboard';
import Categories from './components/Categories';
import Orders from './components/Orders';


function App() {
  return (
    <Router>
      <Routes>
        {/* Entry point logic */}
        <Route path="/" element={<Root />} />

        {/* Dashboards */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoutes requireRole={["admin"]}>
              <Dashboard />
            </ProtectedRoutes>}
        >
          <Route
            index
            element={<h1>Summary of dashboard</h1>}
          />
          <Route
            path="categories"
            element={<Categories />}
          />
          <Route
            path="products"
            element={<h1>Products</h1>}
          />
          <Route
            path="suppliers"
            element={<h1>Suppliers</h1>}
          />
          <Route
            path="orders"
            element={<Orders />}
          />
          <Route
            path="users"
            element={<h1>Users</h1>}
          />
          <Route
            path="profile"
            element={<h1>Profile</h1>}
          />
        </Route>
        <Route
          path="/employee/dashboard"
          element={<h1>customer dashboard</h1>}
        />


        {/* Authentication */}
        <Route path="/login" element={<Login />} />

        {/* Unauthorized */}
        <Route path="/unauthorized" element={<p className='font-bold text-3xl mt-20 ml-20'>Unauthorized</p>} />

        {/* Redirects any broken, misspelled, or missing URLs back to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App;
