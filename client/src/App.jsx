import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SnippetView from './pages/SnippetView';
import CreateSnippet from './pages/CreateSnippet';
import EditSnippet from './pages/EditSnippet';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Pricing from './pages/Pricing';
import Notifications from './pages/Notifications';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Premium film grain overlay */}
        <div className="noise-overlay" />
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/snippets/:id" element={<SnippetView />} />
            <Route path="/snippets/:id/edit" element={<EditSnippet />} />
            <Route path="/create" element={<CreateSnippet />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#241f1f',
              color: '#ffffff',
              border: '1px solid rgba(255,109,41,0.2)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#FF6D29', secondary: '#241f1f' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#241f1f' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
