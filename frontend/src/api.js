// src/api.js

// Read backend URL from Vite env (set in .env.local as VITE_BASE_URL)
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api';

function makeHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// --- POSTS ---

export async function fetchPosts() {
  const res = await fetch(`${BASE_URL}/posts`);
  return res.json();
}

export async function fetchMyPosts(token) {
  const res = await fetch(`${BASE_URL}/me/posts`, {
    headers: makeHeaders(token),
  });
  return res.json();
}

// 🔥 NEW: fetch hot posts
export async function fetchHotPosts(limit = 5) {
  const res = await fetch(`${BASE_URL}/posts/hot?limit=${limit}`);
  return res.json();
}

export async function createPost(payload, token) {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: makeHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}

// --- COMMENTS ---

export async function fetchComments(postId, currentUserName, token) {
  const url = new URL(`${BASE_URL}/posts/${postId}/comments`);
  if (currentUserName) {
    url.searchParams.set('currentUserName', currentUserName);
  }

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

export async function createComment(postId, payload, token) {
  const res = await fetch(`${BASE_URL}/posts/${postId}/comments`, {
    method: 'POST',
    headers: makeHeaders(token),
    body: JSON.stringify(payload),
  });
  return res.json();
}
