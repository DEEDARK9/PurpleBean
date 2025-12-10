import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import ScrollToTop from './components/ScrollToTop'
import Admin from './pages/Admin';
import './index.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleClearSearch = () => setSearchTerm('');

  return (
    <Router>
      <ScrollToTop/>
      <div className="min-h-screen bg-white">
        <Navbar searchTerm={searchTerm} onSearch={setSearchTerm} onClearSearch={handleClearSearch} />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products searchTerm={searchTerm} />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </AnimatePresence>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
