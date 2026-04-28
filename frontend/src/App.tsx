import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <-- 1. NUEVO IMPORT

import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MediaDetail from './pages/MediaDetail';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Profile from './pages/Profile';
import ProfileFriend from './pages/ProfileFriend';
import Directory from './pages/Directory';
import Community from './pages/Community';
import TermsOfService from './pages/TermsOfService';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function LayoutWithNavbar() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}

function App() {
  return (
    // 2. ENVOLVEMOS TODA LA APP CON EL PROVEEDOR DE GOOGLE
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas (Sin Navbar) */}
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/friend/:id" element={<ProfileFriend />} />
          <Route path="/terms" element={<TermsOfService />} />
          
          {/* Rutas con Navbar */}
          <Route element={<LayoutWithNavbar />}>
            <Route path="/community" element={<Community />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/home" element={<Home />} />
            <Route path="/media/:id" element={<MediaDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;