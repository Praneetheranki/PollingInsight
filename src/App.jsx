import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CreatePoll from './pages/CreatePoll';
import Vote from './pages/Vote';
import Results from './pages/Results';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="create" element={<CreatePoll />} />
        <Route path="poll/:id" element={<Vote />} />
        <Route path="results/:id" element={<Results />} />
        {/* Fallback 404 Route */}
        <Route path="*" element={
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-500 mb-8">Page not found</p>
            <a href="/" className="text-indigo-600 font-medium hover:underline">Go Home</a>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default App;
