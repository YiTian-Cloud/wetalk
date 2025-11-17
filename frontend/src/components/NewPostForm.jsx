import { useState } from 'react';

function NewPostForm({ onCreatePost }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await onCreatePost({ title, body });
    setTitle('');
    setBody('');
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
      <h2>Create a new post</h2>
      <div>
        <input
          style={{ width: '100%', marginBottom: 8 }}
          placeholder="Post title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <textarea
          style={{ width: '100%', marginBottom: 8, minHeight: 80 }}
          placeholder="What's on your mind?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <button type="submit">Post</button>
    </form>
  );
}

export default NewPostForm;
