// middleware/auth.js
/*
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Not logged in – we allow this; some routes might still work for guests
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    console.error('JWT verify error:', err.message);
    req.user = null;
    next(); // continue but as guest
  }
}

module.exports = auth;


*/
// middleware/auth.js (Cognito version)

/*
// middleware/auth.js (Cognito + Mongo find-or-create)
const { createRemoteJWKSet, jwtVerify } = require("jose");
const User = require("../models/User"); // adjust path if needed

const region = process.env.COGNITO_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;

// Example issuer:
// https://cognito-idp.us-east-2.amazonaws.com/us-east-2_xckj0mblr
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

// JWKS endpoint (public keys used to verify access tokens)
const jwks = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
);

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  // No token → treat as guest but continue
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      // If you want to enforce client:
      // audience: process.env.COGNITO_APP_CLIENT_ID,
    });

    const cognitoSub = payload.sub;                 // unique Cognito user id
    const email = payload.email;                    // email from Cognito
    const username =
      payload["cognito:username"] || email || "User";

    // 🔑 Option A: find or create Mongo user for this Cognito user
    let user = await User.findOne({ cognitoSub });

    if (!user) {
      // If there is no cognitoSub row yet, you can optionally try to match by email first:
      if (email) {
        user = await User.findOne({ email });
      }

      if (!user) {
        // First-time SSO login → create Mongo user
        user = await User.create({
          username,
          email,
          cognitoSub,
        });
      } else {
        // Legacy Mongo user found by email → attach Cognito sub
        user.cognitoSub = cognitoSub;
        await user.save();
      }
    }

    // Make it look similar to your old req.user shape
    req.user = {
      id: user._id.toString(),   // used by /api/me/posts
      username: user.username,
      email: user.email,
      cognitoSub,
    };

    next();
  } catch (err) {
    console.error("Cognito JWT verify error:", err.message);
    req.user = null;
    next(); // treat as guest
  }
}

module.exports = auth;
*/


// middleware/auth.js (Cognito-only, no Mongo lookup)
const { createRemoteJWKSet, jwtVerify } = require("jose");

const region = process.env.COGNITO_REGION;
const userPoolId = process.env.COGNITO_USER_POOL_ID;

// Example issuer:
// https://cognito-idp.us-east-2.amazonaws.com/us-east-2_xckj0mblr
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

// JWKS endpoint (public keys used to verify access tokens)
const jwks = createRemoteJWKSet(
  new URL(`${issuer}/.well-known/jwks.json`)
);

async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  // No token → treat as guest but continue
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      // Optionally enforce client id:
      // audience: process.env.COGNITO_APP_CLIENT_ID,
    });

    // Cognito fields:
    // - sub: unique user id in pool
    // - email: user's email
    // - "cognito:username": Cognito username
    const cognitoSub = payload.sub;
    const email = payload.email;
    const username = payload["cognito:username"] || email || "User";

    // Make req.user look similar to old shape
    req.user = {
      id: cognitoSub,       // use Cognito sub as id
      username,
      email,
      cognitoSub,
      rawTokenPayload: payload, // handy for debugging
    };

    next();
  } catch (err) {
    console.error("Cognito JWT verify error:", err.message);
    req.user = null;
    next(); // continue as guest
  }
}

module.exports = auth;
