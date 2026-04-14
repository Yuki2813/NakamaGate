import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MediaDetail from './pages/MediaDetail';
import Navbar from './components/Navbar'; // Tu nueva super-barra
import Profile from './pages/Profile';

// EL MARCO DE LA TELEVISIÓN
function AppLayout() {
  return (
    <>
      <Navbar /> {/* Se queda fijo arriba */}
      <div className="min-h-screen bg-[#f8f9fa]">
        <Outlet /> {/* Aquí carga el Home o los Detalles dinámicamente */}
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Sin Navbar) */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        {/* Rutas Privadas (Pasan por el marco de la televisión) */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/media/:id" element={<MediaDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;