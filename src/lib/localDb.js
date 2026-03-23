import { v4 as uuidv4 } from 'uuid';

// Simple Event Target for cross-component realtime simulation
const dbEvents = new EventTarget();

// Helpers
const getDb = (table) => JSON.parse(localStorage.getItem(`db_${table}`) || '[]');
const saveDb = (table, data) => localStorage.setItem(`db_${table}`, JSON.stringify(data));

export const getPolls = async () => {
  const polls = getDb('polls');
  const votes = getDb('votes');
  
  // Attach votes array to each poll
  return polls.map(p => ({
    ...p,
    votes: votes.filter(v => v.poll_id === p.id),
    voteCount: votes.filter(v => v.poll_id === p.id).length
  })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const createPoll = async (pollData) => {
  const newPoll = {
    id: uuidv4(),
    ...pollData,
    created_at: new Date().toISOString()
  };
  const polls = getDb('polls');
  polls.push(newPoll);
  saveDb('polls', polls);
  return newPoll;
};

export const getPoll = async (id) => {
  const polls = getDb('polls');
  return polls.find(p => p.id === id) || null;
};

export const getVotes = async (pollId) => {
  const votes = getDb('votes');
  return votes.filter(v => v.poll_id === pollId);
};

export const createVote = async (voteData) => {
  const newVote = {
    id: uuidv4(),
    ...voteData,
    created_at: new Date().toISOString()
  };
  const votes = getDb('votes');
  votes.push(newVote);
  saveDb('votes', votes);
  
  // Dispatch event for realtime "Results" page feature
  dbEvents.dispatchEvent(new CustomEvent(`vote_inserted_${voteData.poll_id}`, {
    detail: newVote
  }));
  
  return newVote;
};

export const subscribeToVotes = (pollId, callback) => {
  const handler = (e) => callback(e.detail);
  const eventName = `vote_inserted_${pollId}`;
  dbEvents.addEventListener(eventName, handler);
  
  // Support cross-tab synchronization by listening to storage event
  const storageHandler = (e) => {
    if (e.key === 'db_votes') {
      const oldVotes = JSON.parse(e.oldValue || '[]');
      const newVotes = JSON.parse(e.newValue || '[]');
      if (newVotes.length > oldVotes.length) {
        // Find the newly added vote
        const newRecord = newVotes.find(nv => nv.poll_id === pollId && !oldVotes.some(ov => ov.id === nv.id));
        if (newRecord) callback(newRecord);
      }
    }
  };
  window.addEventListener('storage', storageHandler);

  return () => {
    dbEvents.removeEventListener(eventName, handler);
    window.removeEventListener('storage', storageHandler);
  };
};

// Seed Dummy data if empty
export const seedDummyDb = async () => {
  if (getDb('polls').length === 0) {
    const polls = [
      { id: uuidv4(), title: 'What should we order for Friday lunch?', description: 'Pizza, Sushi, or Burgers? Help us decide!', type: 'single', options: ['Pizza', 'Sushi', 'Burgers'], created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: uuidv4(), title: 'Best time for daily standup?', description: 'We are moving the standup. Which slot works best?', type: 'single', options: ['9:00 AM', '10:00 AM', '1:00 PM'], created_at: new Date(Date.now() - 10000).toISOString(), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
      { id: uuidv4(), title: 'Which tools are you using daily?', description: 'Select all that apply for the quarterly software review.', type: 'multiple', options: ['Slack', 'Notion', 'Figma', 'Linear'], created_at: new Date(Date.now() - 20000).toISOString(), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
    ];
    saveDb('polls', polls);
  }
};
