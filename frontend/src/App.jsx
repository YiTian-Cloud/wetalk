import { useEffect, useState } from "react";
import {
  fetchPosts,
  fetchMyPosts,
  createPost,
  fetchHotPosts,
} from "./api";
import { login, register } from "./authApi";
import PostList from "./components/PostList";
import NewPostForm from "./components/NewPostForm";

function App() {
  // Posts state
  const [allPosts, setAllPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  // 🔥 Hot posts
  const [hotPosts, setHotPosts] = useState([]);
  const [showHot, setShowHot] = useState(true);

  // Collapsible flags
  const [showAllPosts, setShowAllPosts] = useState(true);
  const [showMyPosts, setShowMyPosts] = useState(true);

  // NEW: collapses inside "All posts"
  const [showAllMyInAll, setShowAllMyInAll] = useState(true);
  const [showAllOthersInAll, setShowAllOthersInAll] = useState(true);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null); // { id, username }
  const [token, setToken] = useState(null);

  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Load all posts on first render
  useEffect(() => {
    loadAllPosts();
    loadHotPosts();
  }, []);

  async function loadAllPosts() {
    const data = await fetchPosts();
    setAllPosts(data);
  }

  async function loadMyPosts() {
    if (!token) return;
    const data = await fetchMyPosts(token);
    setMyPosts(data);
  }

  async function loadHotPosts() {
    const data = await fetchHotPosts(5); // top 5
    setHotPosts(data);
  }

  

  async function handleCreatePost(postData) {
    const authorName = currentUser ? currentUser.username : "Guest";

    await createPost(
      {
        ...postData,
        authorName,
        isGuest: !currentUser,
      },
      token
    );

    // Refresh both lists so everything stays in sync
    await loadAllPosts();
    if (currentUser) {
      await loadMyPosts();
    }
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");

    if (!authUsername || !authPassword) {
      setAuthError("Username and password required");
      return;
    }

    try {
      const fn = authMode === "login" ? login : register;
      const result = await fn(authUsername, authPassword);

      if (result.error) {
        setAuthError(result.error);
        return;
      }

      setToken(result.token);
      setCurrentUser(result.user);
      setAuthUsername("");
      setAuthPassword("");

      // Load user’s posts now that we’re logged in
      await loadMyPosts();
    } catch (err) {
      console.error(err);
      setAuthError("Auth failed");
    }
  }

  function handleLogout() {
    setToken(null);
    setCurrentUser(null);
    setMyPosts([]);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background: "#ffffff",
          borderRadius: 12,
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
          padding: 24,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>WeTalk</h1>
            <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
              Share posts, reply publicly or privately.
            </p>
          </div>

          {/* Auth box (compact) */}
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 8,
              minWidth: 220,
            }}
          >
            {currentUser ? (
              <div>
                <div style={{ marginBottom: 4, fontSize: 14 }}>
                  Logged in as <strong>{currentUser.username}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "4px 10px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 4 }}>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    disabled={authMode === "login"}
                    style={{ fontSize: 12, marginRight: 4 }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    disabled={authMode === "register"}
                    style={{ fontSize: 12 }}
                  >
                    Register
                  </button>
                </div>
                <form onSubmit={handleAuthSubmit}>
                  <input
                    placeholder="Username"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    style={{
                      marginBottom: 4,
                      width: "100%",
                      fontSize: 12,
                      padding: 4,
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    style={{
                      marginBottom: 4,
                      width: "100%",
                      fontSize: 12,
                      padding: 4,
                    }}
                  />
                  {authError && (
                    <div
                      style={{
                        color: "red",
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      {authError}
                    </div>
                  )}
                  <button
                    type="submit"
                    style={{
                      width: "100%",
                      padding: "4px 0",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {authMode === "login" ? "Login" : "Register"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </header>

        {/* 🔥 Hot Topics section (most commented posts) */}
<section style={{ marginBottom: 24 }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
    }}
    onClick={() => setShowHot((prev) => !prev)}
  >
    <h2 style={{ margin: 0, fontSize: 18 }}>Hot Topics</h2>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          loadHotPosts();
        }}
        style={{ fontSize: 12, padding: "2px 8px", cursor: "pointer" }}
      >
        Refresh
      </button>
      <span style={{ fontSize: 14, color: "#6b7280" }}>
        {showHot ? "▼ Hide" : "▶ Show"}
      </span>
    </div>
  </div>

  {showHot && (
    <div style={{ marginTop: 8 }}>
      {hotPosts.length === 0 ? (
        <div style={{ fontSize: 14, color: "#6b7280" }}>
          No hot topics yet. Start a conversation!
        </div>
      ) : (
        <PostList
          posts={hotPosts}
          currentUserName={currentUser ? currentUser.username : "Guest"}
          token={token}
        />
      )}
    </div>
  )}
</section>


        {/* New post form */}
        <section style={{ marginBottom: 24 }}>
          <NewPostForm onCreatePost={handleCreatePost} />
        </section>

        {/* All posts section (collapsible) */}
       {/* All posts section (collapsible) */}
<section
  style={{
    marginBottom: 16,
    borderTop: "1px solid #e5e7eb",
    paddingTop: 12,
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: "pointer",
    }}
    onClick={() => setShowAllPosts((prev) => !prev)}
  >
    <h2 style={{ margin: 0, fontSize: 18 }}>All posts</h2>
    <span style={{ fontSize: 14, color: "#6b7280" }}>
      {showAllPosts ? "▼ Hide" : "▶ Show"}
    </span>
  </div>

  {showAllPosts && (
    <div style={{ marginTop: 8 }}>
      {/* If not logged in, just show everything as before */}
      {!currentUser && (
        <PostList
          posts={allPosts}
          currentUserName="Guest"
          token={token}
        />
      )}

      {/* If logged in, split All posts into "My posts" and "Other posts" */}
      {currentUser && (
        <>
          {/* My posts inside All */}
          <div
            style={{
              marginBottom: 8,
              padding: 8,
              borderRadius: 6,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setShowAllMyInAll((prev) => !prev)}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>My posts (in feed)</h3>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                {showAllMyInAll ? "▼ Hide" : "▶ Show"}
              </span>
            </div>

            {showAllMyInAll && (
              <div style={{ marginTop: 6 }}>
                <PostList
                  posts={allPosts.filter(
                    (p) => p.authorName === currentUser.username
                  )}
                  currentUserName={currentUser.username}
                  token={token}
                />
              </div>
            )}
          </div>

          {/* Other users' posts inside All */}
          <div
            style={{
              padding: 8,
              borderRadius: 6,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setShowAllOthersInAll((prev) => !prev)}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>
                Other people&apos;s posts
              </h3>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                {showAllOthersInAll ? "▼ Hide" : "▶ Show"}
              </span>
            </div>

            {showAllOthersInAll && (
              <div style={{ marginTop: 6 }}>
                <PostList
                  posts={allPosts.filter(
                    (p) => p.authorName !== currentUser.username
                  )}
                  currentUserName={currentUser.username}
                  token={token}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )}
</section>


        {/* My posts section (only when logged in) */}
        {currentUser && (
          <section
            style={{
              marginTop: 8,
              borderTop: "1px solid #e5e7eb",
              paddingTop: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => setShowMyPosts((prev) => !prev)}
            >
              <h2 style={{ margin: 0, fontSize: 18 }}>My posts</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMyPosts();
                  }}
                  style={{ fontSize: 12, padding: "2px 8px", cursor: "pointer" }}
                >
                  Refresh
                </button>
                <span style={{ fontSize: 14, color: "#6b7280" }}>
                  {showMyPosts ? "▼ Hide" : "▶ Show"}
                </span>
              </div>
            </div>

            {showMyPosts && (
              <div style={{ marginTop: 8 }}>
                {myPosts.length === 0 ? (
                  <div style={{ fontSize: 14, color: "#6b7280" }}>
                    You don’t have any posts yet.
                  </div>
                ) : (
                  <PostList
                    posts={myPosts}
                    currentUserName={currentUser.username}
                    token={token}
                  />
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default App;
