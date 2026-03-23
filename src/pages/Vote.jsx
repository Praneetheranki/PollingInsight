import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getVoterToken, hasVoted, markVoted, classNames } from '../lib/utils';
import toast from 'react-hot-toast';

export default function Vote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [poll, setPoll] = useState(null);
  
  // single: string, multiple: array
  const [selectedOptions, setSelectedOptions] = useState([]);

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const fetchPoll = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPoll(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load poll. It may not exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (option) => {
    if (poll.type === 'single') {
      setSelectedOptions([option]);
    } else {
      setSelectedOptions(prev => 
        prev.includes(option) 
          ? prev.filter(o => o !== option) 
          : [...prev, option]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedOptions.length === 0) {
      return toast.error('Please select an option to vote');
    }

    setSubmitting(true);
    const voterToken = getVoterToken();

    try {
      const { error } = await supabase.from('votes').insert([{
        poll_id: id,
        selected_options: poll.type === 'single' ? selectedOptions[0] : selectedOptions,
        voter_token: voterToken
      }]);

      if (error) throw error;

      markVoted(id);
      toast.success('Vote submitted successfully!');
      navigate(`/results/${id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit vote');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading poll...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Poll not found</h2>
        <p className="text-gray-500 mb-6">The poll you're looking for doesn't exist or has been deleted.</p>
        <Link to="/" className="text-indigo-600 font-medium hover:underline">Return Home</Link>
      </div>
    );
  }

  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const alreadyVoted = hasVoted(id);

  if (isExpired || alreadyVoted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
        {isExpired ? (
          <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        ) : (
          <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isExpired ? 'This poll has expired' : 'You have already voted'}
        </h2>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {isExpired 
            ? 'Voting is no longer allowed. Check out the final results.' 
            : 'We only allow one vote per person to keep things fair. See what others thought!'}
        </p>
        <Link 
          to={`/results/${id}`} 
          className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          View Results
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-8 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-2xl font-bold text-gray-900">{poll.title}</h1>
        </div>
        {poll.description && (
          <p className="text-gray-600 text-lg">{poll.description}</p>
        )}
        <div className="mt-4 flex gap-2">
           <span className="inline-flex items-center py-1 px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
             {poll.type === 'single' ? 'Pick one option' : 'Pick multiple options'}
           </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          {poll.options.map((option, index) => {
            const isSelected = selectedOptions.includes(option);
            return (
              <label 
                key={index} 
                className={classNames(
                  "flex items-center p-4 border rounded-xl cursor-pointer transition-all",
                  isSelected 
                    ? "border-indigo-600 bg-indigo-50 shadow-sm" 
                    : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                )}
              >
                <div className="flex-grow font-medium text-gray-900" style={{ wordBreak: 'break-word' }}>
                  {option}
                </div>
                {poll.type === 'single' ? (
                  <div className={classNames(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-4",
                    isSelected ? "border-indigo-600" : "border-gray-300"
                  )}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                  </div>
                ) : (
                  <div className={classNames(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ml-4",
                    isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white"
                  )}>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                )}
                
                {/* Hidden real input for semantics */}
                <input 
                  type={poll.type === 'single' ? 'radio' : 'checkbox'}
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => handleOptionToggle(option)}
                  name="pollOption"
                />
              </label>
            )
          })}
        </div>

        <button
          type="submit"
          disabled={submitting || selectedOptions.length === 0}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-sm border border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
        >
          {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
          {submitting ? 'Submitting...' : 'Submit Vote'}
        </button>
      </form>
    </div>
  );
}
