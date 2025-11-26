// src/App.jsx
import { useEffect, useState } from "react";

import {
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  signInWithRedirect,
  signOut,
} from "aws-amplify/auth";

import {
  fetchPosts,
  fetchMyPosts,
  createPost,
  fetchHotPosts,
} from "./api";

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
  const [showAllMyInAll, setShowAllMyInAll] = useState(true);
  const [showAllOthersInAll, setShowAllOthersInAll] = useState(true);

  // Auth state (Cognito SSO only)
  const [currentUser, setCurrentUser] = useState(null); // { username, email }
  const [token, setToken] = useState(null);             // ID token we send to backend
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initial load: posts + auth session
  useEffect(() => {
    loadAllPosts();
    loadHotPosts();
    initAuthFromCognito();
  }, []);

  async function loadAllPosts() {
    try {
      const data = await fetchPosts();
      setAllPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[API] Failed to load all posts:", err);
      setAllPosts([]);
    }
  }
  

  async function loadMyPosts(optionalToken) {
    const t = optionalToken ?? token;
    if (!t) {
      setMyPosts([]);
      return;
    }
  
    try {
      const data = await fetchMyPosts(t);
      setMyPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[API] Failed to load my posts:", err);
      setMyPosts([]);
    }
  }
  
  async function loadHotPosts() {
    try {
      const data = await fetchHotPosts(5); // top 5
      setHotPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("[API] Failed to load hot posts:", err);
      setHotPosts([]);
    }
  }
  // 🔐 Sync auth state from Cognito (called on mount and when needed)
  async function initAuthFromCognito() {
    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens?.idToken;
  
      // Pull email + username from the ID token payload
      const email = idToken?.payload?.email || null;
      const tokenUsername =
        idToken?.payload?.["cognito:username"] ||
        idToken?.payload?.sub ||
        null;
  
      if (idToken) {
        const idTokenString = idToken.toString();
  
        setToken(idTokenString);
        setCurrentUser({
          // 👈 displayName: prefer email, else the Cognito username/sub
          username: email || tokenUsername || "User",
          email: email || "",
        });
  
        try {
          await loadMyPosts(idTokenString);
        } catch (e) {
          console.warn("[Auth] loadMyPosts failed after login:", e);
          setMyPosts([]);
        }
      } else {
        setCurrentUser(null);
        setToken(null);
        setMyPosts([]);
      }
  
      if (window.location.pathname === "/callback") {
        window.history.replaceState({}, "", "/");
      }
    } catch (err) {
      console.warn("[Auth] Not logged in or session fetch failed:", err?.message);
      setCurrentUser(null);
      setToken(null);
      setMyPosts([]);
  
      if (window.location.pathname === "/callback") {
        window.history.replaceState({}, "", "/");
      }
    } finally {
      setAuthInitialized(true);
    }
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

    await loadAllPosts();
    if (currentUser) {
      await loadMyPosts();
    }
  }

  // 🟦 SSO Login: redirect to Cognito Hosted UI (only if not already signed in)
  async function handleLogin() {
    console.log("[SSO] Login button clicked");
    // First, check if there is already a session
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      if (idToken) {
        console.log("[SSO] User already authenticated, refreshing local state");
        await initAuthFromCognito();
        return; // Don't call signInWithRedirect again
      }
    } catch {
      // No session -> ok to start login
      console.log("[SSO] No existing session, proceeding to redirect");
    }

    try {
      await signInWithRedirect({ provider: "COGNITO" });
      console.log("[SSO] signInWithRedirect called");
    } catch (err) {
      console.error("[SSO] Error during signInWithRedirect:", err);
      alert("SSO error: " + (err?.message || "Check console"));
    }
  }

  // 🟥 SSO Logout
  async function handleLogout() {
    try {
      await signOut();
    } catch (err) {
      console.error("[SSO] Error during signOut:", err);
    } finally {
      setToken(null);
      setCurrentUser(null);
      setMyPosts([]);
    }
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
            {!authInitialized ? (
              <div style={{ fontSize: 14 }}>Checking sign-in status...</div>
            ) : currentUser ? (
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
                <div style={{ marginBottom: 4, fontSize: 14 }}>
                  You are browsing as <strong>Guest</strong>
                </div>
                <button
                  type="button"
                  onClick={handleLogin}
                  style={{
                    width: "100%",
                    padding: "4px 0",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Login / Sign up with SSO
                </button>
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
              {/* Guest → see everything */}
              {!currentUser && (
                <PostList
                  posts={allPosts}
                  currentUserName="Guest"
                  token={token}
                />
              )}

              {/* Logged in → split "All" into My posts + Others */}
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
                      <h3 style={{ margin: 0, fontSize: 16 }}>
                        My posts (in feed)
                      </h3>
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
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    cursor: "pointer",
                  }}
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
