# Rooyesh DeepSeek proxy

This small Cloudflare Worker keeps the **owner's** DeepSeek API key on the server. Students sign in with Google in the Android app; the Worker verifies the Google ID token before proxying a request. The APK must never contain the DeepSeek key.

## One-time setup

1. Create a Cloudflare account and install Node.js on a computer that can run Wrangler, or use Cloudflare's dashboard editor.
2. In Google Cloud Console, create an OAuth **Web application** client. Add the same client ID to Android resource `rooyesh_google_web_client_id` and Worker variable `GOOGLE_WEB_CLIENT_ID`.
3. In the DeepSeek platform, create an API key for the app owner. Do not share it with students.
4. In Cloudflare Workers, create a Worker from `src/index.js`, add the `jose` dependency (or deploy this folder with Wrangler), and set the secret `DEEPSEEK_API_KEY`.
5. Set Worker variable `GOOGLE_WEB_CLIENT_ID` to the exact OAuth Web client ID. Keep `APP_ORIGIN=null` for the app's bundled `file://` WebView.
6. Deploy the Worker, then put its URL ending in `/v1/chat/completions` in Android resource `rooyesh_deepseek_proxy_url`.
7. Build the APK. Test login, expired login, the model response, tool calls, sign-out, and rate limiting before sharing it.

With Wrangler, from this directory:
```sh
npm install
npx wrangler secret put DEEPSEEK_API_KEY
# Set GOOGLE_WEB_CLIENT_ID in wrangler.toml before deploy.
npx wrangler deploy
```

## Important

- Google sign-in proves identity; it does not provide free DeepSeek usage. The app owner pays for API usage according to DeepSeek's current pricing and account availability.
- Configure spend limits in the DeepSeek account and monitor usage. The Worker has a per-account short-burst rate limiter, not a daily spend guarantee.
- The Worker intentionally accepts only the configured app origin and Google ID tokens with the expected audience. Do not publish a proxy URL until OAuth and rate limits have been configured and tested.
- Google OAuth client IDs and the Worker URL are configuration values, not secrets. The DeepSeek API key is a secret and belongs only in the Worker secret store.
- Cloud availability, Google sign-in, and DeepSeek API access from a student's network are not guaranteed. Test on the actual networks/devices intended for use.
