import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { isPollCreator } from '../lib/utils';
import PollCard from '../components/PollCard';
import { Loader2, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const DUMMY_POLLS = [
  { title: 'What should we order for Friday lunch?', description: 'Pizza, Sushi, or Burgers? Help us decide!', type: 'single', options: ['Pizza', 'Sushi', 'Burgers'] },
  { title: 'Best time for daily standup?', description: 'We are moving the standup. Which slot works best?', type: 'single', options: ['9:00 AM', '10:00 AM', '1:00 PM'] },
  { title: 'Which tools are you using daily?', description: 'Select all that apply for the quarterly software review.', type: 'multiple', options: ['Slack', 'Notion', 'Figma', 'Linear'] }
];

export default function Home() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select(`
          *,
          votes ( id )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length === 0) {
        // Seed dummy polls
        await seedDummyData();
        return;
      }

      // Format data to include voteCount
      const formattedData = data.map(poll => ({
        ...poll,
        voteCount: poll.votes ? poll.votes.length : 0
      }));

      setPolls(formattedData);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    try {
      await supabase.from('votes').delete().eq('poll_id', id);
      const { error } = await supabase.from('polls').delete().eq('id', id);
      if (error) throw error;
      toast.success('Poll deleted!');
      setPolls(polls.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete poll');
    }
  };

  const seedDummyData = async () => {
    try {
      const pollsToInsert = DUMMY_POLLS.map(p => ({
        title: p.title,
        description: p.description,
        type: p.type,
        options: p.options,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }));
      
      const { data, error } = await supabase.from('polls').insert(pollsToInsert).select();
      if (error) throw error;
      
      // Fetch again to get the proper structure with votes array
      fetchPolls();
    } catch (error) {
      console.error('Error seeding data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading polls...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recent Polls</h1>
          <p className="text-gray-500">Vote on active polls or view results.</p>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="bg-white border text-center py-16 px-4 rounded-2xl border-dashed border-gray-300">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No polls found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            There are no active polls right now. Be the first to start a new poll and gather insights from your team!
          </p>
          <Link
            to="/create"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <PollCard 
              key={poll.id} 
              poll={poll} 
              voteCount={poll.voteCount} 
              isCreator={isPollCreator(poll.id)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
