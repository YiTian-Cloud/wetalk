// server.js
const User = require('./models/User');
const auth = require('./middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Post = require('./models/Post');
const Comment = require('./models/Comment');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(auth);

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wetalk';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * AUTH
 */

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }
  
      const existing = await User.findOne({ username });
      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
  
      const user = await User.create({ username, passwordHash });
  
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '7d' }
      );
  
      res.status(201).json({
        token,
        user: { id: user._id, username: user.username },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Failed to register' });
    }
  });
  
  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
  
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }
  
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }
  
      const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '7d' }
      );
  
      res.json({
        token,
        user: { id: user._id, username: user.username },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Failed to login' });
    }
  });
  

/**
 * POSTS
 */

// Get all posts (latest first)
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, body, authorName, isGuest } = req.body;

    // If logged in, override with user
    let finalAuthorName = authorName;
    let finalIsGuest = isGuest;
    let authorId = null;

    if (req.user) {
      finalAuthorName = req.user.username;
      finalIsGuest = false;
      authorId = req.user.id;
    }

    if (!title || !body || !finalAuthorName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const post = await Post.create({
      title,
      body,
      authorName: finalAuthorName,
      isGuest: finalIsGuest,
      authorId,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create post' });
  }
});

// Get hottest posts by commentCount
app.get('/api/posts/hot', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 1

    const posts = await Post.find()
      .sort({ commentCount: -1, createdAt: -1 })
      .limit(1);

    res.json(posts);
  } catch (err) {
    console.error('Hot posts error:', err);
    res.status(500).json({ error: 'Failed to fetch hot posts' });
  }
});

// Get single post by id
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid post id' });
  }
});


/**
 * COMMENTS
 */

// Get comments for a post
// Optional query: ?visibility=public or ?visibility=all
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { visibility, currentUserName } = req.query;

    let filter = { postId };

    if (visibility === 'public') {
      filter.visibility = 'public';
    } else if (currentUserName) {
      // For "all" but enforce private visibility logic
      filter.$or = [
        { visibility: 'public' },
        {
          visibility: 'private',
          $or: [
            { authorName: currentUserName },
            { recipientName: currentUserName },
          ],
        },
      ];
    }

    const comments = await Comment.find(filter).sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to a post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { authorName, isGuest, content, visibility, recipientName } = req.body;

    let finalAuthorName = authorName;
    let finalIsGuest = isGuest;
    let authorId = null;

    if (req.user) {
      finalAuthorName = req.user.username;
      finalIsGuest = false;
      authorId = req.user.id;
    }

    if (!content || !finalAuthorName) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const comment = await Comment.create({
      postId,
      authorName: finalAuthorName,
      isGuest: finalIsGuest,
      content,
      visibility: visibility || 'public',
      recipientName: visibility === 'private' ? recipientName : null,
      authorId,
      // (You could also resolve recipientId by looking up User by recipientName)
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create comment' });
  }
});

// Get posts for the currently logged-in user
app.get('/api/me/posts', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }

  try {
    const posts = await Post.find({ authorId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(posts);
  } catch (err) {
    console.error('Me posts error:', err);
    res.status(500).json({ error: 'Failed to fetch your posts' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`WeTalk backend running on port ${PORT}`));
