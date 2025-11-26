// src/aws-exports.js

const region = import.meta.env.VITE_COGNITO_REGION;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;
const domain = import.meta.env.VITE_COGNITO_DOMAIN;
const redirectSignIn = import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN;
const redirectSignOut = import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT;

console.log("[Amplify Cognito config]", {
  region,
  userPoolId,
  userPoolClientId,
  domain,
  redirectSignIn,
  redirectSignOut,
});

const awsConfig = {
  Auth: {
    Cognito: {
      region,
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
        phone: false,
        username: false,
        oauth: {
          domain, // e.g. my-login.auth.us-east-2.amazoncognito.com (NO https://)
          scopes: ["openid", "email", "profile"],
          redirectSignIn: [redirectSignIn],
          redirectSignOut: [redirectSignOut],
          responseType: "code",
        },
      },
    },
  },
};

export default awsConfig;
