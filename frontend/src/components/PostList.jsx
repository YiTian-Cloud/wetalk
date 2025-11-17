import { useState } from 'react';
import CommentSection from './CommentSection';

function PostList({ posts, currentUserName }) {
  const [openPostId, setOpenPostId] = useState(null);

  return (
    <div>
      <h2>Recent posts</h2>
      {posts.map((post) => (
        <div
          key={post._id}
          style={{
            border: '1px solid #ccc',
            padding: 12,
            marginBottom: 12,
            borderRadius: 4,
          }}
        >
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <small>
            By {post.authorName} · {post.commentCount ?? 0} comments
          </small>


          <div style={{ marginTop: 8 }}>
            <button
              onClick={() =>
                setOpenPostId(openPostId === post._id ? null : post._id)
              }
            >
              {openPostId === post._id ? 'Hide comments' : 'Show comments'}
            </button>
          </div>

          {openPostId === post._id && (
            <CommentSection
              post={post}
              currentUserName={currentUserName}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default PostList;
