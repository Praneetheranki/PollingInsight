import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { markPollCreated } from '../lib/utils';
import OptionInput from '../components/OptionInput';
import toast from 'react-hot-toast';

export default function CreatePoll() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('single');
  const [options, setOptions] = useState(['', '']);
  const [expiry, setExpiry] = useState('7d');

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim()) {
      return toast.error('Poll title is required');
    }
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      return toast.error('At least 2 valid options are required');
    }
    // Check for duplicate options
    if (new Set(validOptions).size !== validOptions.length) {
      return toast.error('All options must be unique');
    }

    setLoading(true);

    try {
      // Calculate expiry date
      let expiresAt = null;
      if (expiry !== 'none') {
        const date = new Date();
        if (expiry === '24h') date.setHours(date.getHours() + 24);
        if (expiry === '48h') date.setHours(date.getHours() + 48);
        if (expiry === '7d') date.setDate(date.getDate() + 7);
        expiresAt = date.toISOString();
      }

      const { data, error } = await supabase
        .from('polls')
        .insert([{
          title: title.trim(),
          description: description.trim() || null,
          type,
          options: validOptions,
          expires_at: expiresAt
        }])
        .select()
        .single();

      if (error) throw error;
      
      markPollCreated(data.id);

      // Copy automatically
      const pollUrl = `${window.location.origin}/poll/${data.id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pollUrl).catch(() => {});
        toast.success('Poll created & link copied!');
      } else {
        toast.success('Poll created successfully!');
      }
      
      navigate(`/results/${data.id}`);

    } catch (err) {
      console.error(err);
      toast.error('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create a new poll</h1>
        <p className="text-gray-500">Fill out the details below to generate a shareable voting link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Poll Title <span className="text-red-500">*</span></label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., What should we order for lunch?"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            required
            maxLength={150}
          />
        </div>

        <div>
           <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context or details to help people decide..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow resize-none"
            maxLength={300}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-3">Poll Type</label>
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={type === 'single'}
                onChange={() => setType('single')}
              />
              <div className="p-3 text-center rounded-lg border border-gray-200 bg-white peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:bg-gray-50 transition-colors font-medium text-sm">
                Single Choice
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={type === 'multiple'}
                onChange={() => setType('multiple')}
              />
              <div className="p-3 text-center rounded-lg border border-gray-200 bg-white peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 hover:bg-gray-50 transition-colors font-medium text-sm">
                Multiple Choice
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
          <div className="space-y-3">
            {options.map((opt, index) => (
              <OptionInput
                key={index}
                value={opt}
                onChange={(val) => updateOption(index, val)}
                onRemove={() => removeOption(index)}
                canRemove={options.length > 2}
                placeholder={`Option ${index + 1}`}
              />
            ))}
          </div>
          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-3 flex items-center gap-2 text-indigo-600 text-sm font-medium hover:text-indigo-800 transition-colors py-1 px-2 rounded-md hover:bg-indigo-50"
            >
              <Plus className="w-4 h-4" /> Add Option
            </button>
          )}
          {options.length >= 6 && (
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
              <Info className="w-4 h-4" /> Maximum 6 options allowed.
            </p>
          )}
        </div>

        <div>
           <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">Time until expiry</label>
           <select
             id="expiry"
             value={expiry}
             onChange={(e) => setExpiry(e.target.value)}
             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
           >
             <option value="24h">24 Hours</option>
             <option value="48h">48 Hours</option>
             <option value="7d">7 Days</option>
             <option value="none">No Expiry</option>
           </select>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Creating Poll...' : 'Create & Get Link'}
          </button>
        </div>
      </form>
    </div>
  );
}
