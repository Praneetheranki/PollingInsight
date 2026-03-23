import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ResultsChart({ options, votes }) {
  const data = useMemo(() => {
    // Count votes for each option
    const counts = options.reduce((acc, opt) => {
      acc[opt] = 0;
      return acc;
    }, {});

    votes.forEach(vote => {
      if (Array.isArray(vote.selected_options)) {
        vote.selected_options.forEach(opt => {
          if (counts[opt] !== undefined) counts[opt]++;
        });
      } else if (counts[vote.selected_options] !== undefined) {
        counts[vote.selected_options]++;
      }
    });

    // Format for Recharts
    const chartData = Object.entries(counts).map(([name, count]) => ({
      name,
      count
    }));

    // Sort by count descending for better viz (optional, can remove if fixed order preferred)
    chartData.sort((a, b) => b.count - a.count);

    return chartData;
  }, [options, votes]);

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalVotes = votes.length;

  if (totalVotes === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 font-medium">No votes yet. Be the first!</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalVotes > 0 ? ((data.count / totalVotes) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white border border-gray-100 shadow-xl p-3 rounded-lg">
          <p className="font-semibold text-gray-800 mb-1">{data.name}</p>
          <p className="text-indigo-600 font-bold">{data.count} vote{data.count !== 1 ? 's' : ''}</p>
          <p className="text-gray-500 text-sm">{percentage}% of all voters</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            width={120}
            tick={{ fill: '#4b5563', fontSize: 14 }}
          />
          <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            barSize={40}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.count === data[0].count && entry.count > 0 ? '#4f46e5' : '#c7d2fe'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
