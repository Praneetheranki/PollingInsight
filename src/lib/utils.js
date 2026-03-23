import { v4 as uuidv4 } from 'uuid'

export function getVoterToken() {
  let token = localStorage.getItem('voter_token')
  if (!token) {
    token = uuidv4()
    localStorage.setItem('voter_token', token)
  }
  return token
}

export function hasVoted(pollId) {
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]')
  return votedPolls.includes(pollId)
}

export function markVoted(pollId) {
  const votedPolls = JSON.parse(localStorage.getItem('voted_polls') || '[]')
  if (!votedPolls.includes(pollId)) {
    votedPolls.push(pollId)
    localStorage.setItem('voted_polls', JSON.stringify(votedPolls))
  }
}

export function markPollCreated(pollId) {
  const createdPolls = JSON.parse(localStorage.getItem('created_polls') || '[]')
  if (!createdPolls.includes(pollId)) {
    createdPolls.push(pollId)
    localStorage.setItem('created_polls', JSON.stringify(createdPolls))
  }
}

export function isPollCreator(pollId) {
  const createdPolls = JSON.parse(localStorage.getItem('created_polls') || '[]')
  return createdPolls.includes(pollId)
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}
