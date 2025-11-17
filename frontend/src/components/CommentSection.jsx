import { useEffect, useState } from 'react';
import { fetchComments, createComment } from '../api';

function CommentSection({ post, currentUserName }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [recipientName, setRecipientName] = useState(post.authorName);

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadComments() {
    const data = await fetchComments(post._id, currentUserName);
    setComments(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;

    await createComment(post._id, {
      content,
      authorName: currentUserName || 'Guest',
      isGuest: !currentUserName,
      visibility,
      recipientName: visibility === 'private' ? recipientName : null,
    });

    setContent('');
    await loadComments();
  }

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 8 }}>
      <h4>Comments</h4>

      <div style={{ marginBottom: 8 }}>
        {comments.map((c) => (
          <div key={c._id} style={{ marginBottom: 6 }}>
            <strong>{c.authorName}</strong>{' '}
            {c.visibility === 'private' && (
              <span style={{ fontSize: 12, color: '#666' }}>(private)</span>
            )}
            <div>{c.content}</div>
          </div>
        ))}
        {comments.length === 0 && <div>No comments yet.</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          style={{ width: '100%', minHeight: 60, marginBottom: 8 }}
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div style={{ marginBottom: 8 }}>
          <label style={{ marginRight: 12 }}>
            <input
              type="radio"
              value="public"
              checked={visibility === 'public'}
              onChange={() => setVisibility('public')}
            />{' '}
            Public
          </label>
          <label>
            <input
              type="radio"
              value="private"
              checked={visibility === 'private'}
              onChange={() => setVisibility('private')}
            />{' '}
            Private with
          </label>
          {visibility === 'private' && (
            <input
              style={{ marginLeft: 8 }}
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient name"
            />
          )}
        </div>

        <button type="submit">Post comment</button>
      </form>
    </div>
  );
}

export default CommentSection;
