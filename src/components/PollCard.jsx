import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function PollCard({ poll, voteCount, isCreator, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-start mb-3 gap-4">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{poll.title}</h3>
        <div className="shrink-0 flex items-center gap-2">
          {isCreator && onDelete && (
            <button
              onClick={async (e) => {
                e.preventDefault();
                setDeleting(true);
                await onDelete(poll.id);
                setDeleting(false);
              }}
              disabled={deleting}
              className="p-1 text-red-600 hover:bg-red-50 rounded bg-white border border-red-100 shadow-sm transition-colors disabled:opacity-50"
              title="Delete Poll"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
              <Clock className="w-3.5 h-3.5" />
              Expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          )}
        </div>
      </div>
      
      {poll.description && (
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">{poll.description}</p>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
        <span className="text-sm font-medium text-gray-600 bg-gray-50 py-1 px-3 rounded-md">
          {voteCount} vote{voteCount !== 1 ? 's' : ''}
        </span>
        <Link
          to={`/poll/${poll.id}`}
          className="text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors flex items-center gap-1"
        >
          View / Vote &rarr;
        </Link>
      </div>
    </div>
  );
}
