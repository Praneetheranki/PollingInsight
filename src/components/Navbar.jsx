import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <BarChart3 className="w-6 h-6" />
            <span>PollInsights</span>
          </Link>
          <Link
            to="/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Create Poll
          </Link>
        </div>
      </div>
    </nav>
  );
}
