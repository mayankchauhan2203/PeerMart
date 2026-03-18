import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import PostItem from "./pages/PostItem.jsx";
import Profile from "./pages/Profile.jsx";
import MyListings from "./pages/MyListings.jsx";
import Notifications from "./pages/Notifications.jsx";
import Login from "./pages/Login.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <div className="app">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1c1a17',
              color: '#f5f0e8',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#4ade80',
                secondary: '#1c1a17',
              },
            },
            error: {
              iconTheme: {
                primary: '#f87171',
                secondary: '#1c1a17',
              },
            },
          }}
        />
        <Navbar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
            <Route path="/post-item" element={
              <ProtectedRoute>
                <PostItem />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/my-listings" element={
              <ProtectedRoute>
                <MyListings />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;