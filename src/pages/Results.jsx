import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isPollCreator } from '../lib/utils';
import ResultsChart from '../components/ResultsChart';
import ShareButton from '../components/ShareButton';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [poll, setPoll] = useState(null);
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    fetchResults();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`poll_votes_${id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `poll_id=eq.${id}` }, 
        (payload) => {
          setVotes((currentVotes) => [...currentVotes, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchResults = async () => {
    try {
      const [pollRes, votesRes] = await Promise.all([
        supabase.from('polls').select('*').eq('id', id).single(),
        supabase.from('votes').select('*').eq('poll_id', id)
      ]);
      
      if (pollRes.error) throw pollRes.error;
      
      setPoll(pollRes.data);
      setVotes(votesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      // Delete votes first to bypass foreign key constraints, then delete poll
      await supabase.from('votes').delete().eq('poll_id', id);
      const { error } = await supabase.from('polls').delete().eq('id', id);
      
      if (error) throw error;
      
      toast.success('Poll deleted successfully');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete poll');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading results...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Poll not found</h2>
        <p className="text-gray-500 mb-6">The poll you're looking for doesn't exist.</p>
        <Link to="/" className="text-indigo-600 font-medium hover:underline">Return Home</Link>
      </div>
    );
  }

  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-gray-100 pb-6">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2 text-indigo-600 font-semibold uppercase tracking-wider text-xs">
            Results <span className="text-gray-300">•</span> {votes.length} Total Vote{votes.length !== 1 ? 's' : ''}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{poll.title}</h1>
          <div className="flex items-center gap-3">
             {isExpired ? (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-100">
                <Clock className="w-4 h-4" /> Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-100">
                <CheckCircle2 className="w-4 h-4" /> Active
              </span>
            )}
            <span className="text-sm text-gray-500 font-medium">
               Live updating
            </span>
          </div>
        </div>
        
        <div className="shrink-0 flex gap-3">
          {isPollCreator(id) && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </button>
          )}
          <ShareButton />
        </div>
      </div>

      <div className="mb-6">
        <ResultsChart options={poll.options} votes={votes} />
      </div>
      
      {!isExpired && (
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center">
            <Link 
              to={`/poll/${id}`}
              className="text-indigo-600 font-medium text-sm hover:underline"
            >
              Take me to the voting page &rarr;
            </Link>
        </div>
      )}
    </div>
  );
}
