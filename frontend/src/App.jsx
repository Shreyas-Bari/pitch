import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<div className="p-8 text-center"><h1 className="text-3xl font-bold">PITCH</h1><p className="mt-2 text-gray-600">Where Brands Meet Campus Communities</p></div>} />

      {/* TODO: Add public, company, committee, admin, and shared routes */}
      <Route path="*" element={<div className="p-8 text-center"><h1 className="text-2xl font-semibold">404</h1><p>Page not found</p></div>} />
    </Routes>
  );
}

export default App;
