import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MediaDetail from './pages/MediaDetail';
import Navbar from './components/Navbar';
import Profile from './pages/Profile';
import ProfileFriend from './pages/ProfileFriend';

// Layout con Navbar
function LayoutWithNavbar() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a]">
        <Outlet />
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
        <Route path="/friend/:id" element={<ProfileFriend />} />
        
        {/* Rutas con Navbar */}
        <Route element={<LayoutWithNavbar />}>
          <Route path="/home" element={<Home />} />
          <Route path="/media/:id" element={<MediaDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;