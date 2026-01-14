# Google Gemini AI Setup Instructions

This guide will help you set up Google Gemini AI integration for the Chrome Window Recorder extension.

## Prerequisites

- Google Cloud Platform account
- Chrome Window Recorder extension installed
- Access to extension source code

## Step-by-Step Setup

### 1. Get Your Extension ID

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Find "Chrome Window Recorder" in the list
4. Copy the Extension ID (it looks like: `abcdefghijklmnopqrstuvwxyz123456`)

**Important:** Save this ID - you'll need it multiple times.

You can also find your Extension ID in the Settings page of the extension under the Gemini AI Integration section.

---

### 2. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: "Chrome Window Recorder"
4. Click "Create"
5. Wait for project creation to complete

---

### 3. Enable Generative Language API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Generative Language API"
3. Click on it and press "Enable"
4. Wait for API to be enabled (this may take a minute)

---

### 4. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type (unless you have Google Workspace)
3. Click "Create"
4. Fill in required fields:
   - **App name:** Chrome Window Recorder
   - **User support email:** Your email
   - **Developer contact:** Your email
5. Click "Save and Continue"
6. On "Scopes" page, click "Add or Remove Scopes"
7. Manually add this scope by typing it in the "Manually add scopes" field:
   ```
   https://www.googleapis.com/auth/generative-language.retriever
   ```
8. Click "Add to Table" → "Update" → "Save and Continue"
9. On "Test users" page, add your email as a test user
10. Click "Save and Continue"
11. Review and click "Back to Dashboard"

---

### 5. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. **Application type:** Select "Chrome extension" (if available)
   - If "Chrome extension" is not available, select "Web application"
4. **Name:** Chrome Window Recorder Extension
5. **For Chrome extension:**
   - Enter your Extension ID from Step 1
6. **For Web application (alternative):**
   - **Authorized redirect URIs:** `https://<EXTENSION_ID>.chromiumapp.org/`
   - Replace `<EXTENSION_ID>` with your actual extension ID
7. Click "Create"
8. **Important:** Copy the **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
   - You'll need this for the next step

---

### 6. Configure Extension

#### 6.1 Update Environment Variables

1. Open the extension source code
2. Create or edit the `.env` file in the root directory
3. Add the following line:
   ```
   VITE_GEMINI_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```
4. Replace `your_client_id_here.apps.googleusercontent.com` with your actual Client ID from Step 5

#### 6.2 Update Manifest

1. Open `manifest.json` in the root directory
2. Find the `oauth2` section (around line 30)
3. Update the `client_id` value:
   ```json
   "oauth2": {
     "client_id": "your_client_id_here.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/generative-language.retriever"
     ]
   }
   ```
4. Replace `your_client_id_here.apps.googleusercontent.com` with your actual Client ID from Step 5

**Important:** The Client ID must match in both `.env` and `manifest.json`

#### 6.3 Rebuild and Reload Extension

1. Open a terminal in the extension directory
2. Run the build command:
   ```bash
   npm run build
   ```
3. Wait for the build to complete
4. Go to `chrome://extensions/` in Chrome
5. Click the reload icon on the "Chrome Window Recorder" extension

---

### 7. Test Connection

1. Open the extension
2. Go to **Settings** (click the gear icon)
3. Scroll to the "Gemini AI Integration" section
4. Click "**Connect with Gemini**"
5. You should see a Google OAuth popup
6. **Grant the requested permissions**
7. You should see "Connected as [your-email]" status

If successful, you're ready to use AI-powered features!

---

## Using Gemini AI Features

### Generate Jira Issue Descriptions

Once connected, you can use Gemini to automatically generate professional issue descriptions:

1. Go to **Recordings** page
2. Find a recording with a transcript
3. Click "Create Jira Issue"
4. You'll see a "**✨ Generate with AI**" button under the Description field
5. Click it to generate a description based on:
   - Recording title
   - Video transcript
   - Summary text

The AI will analyze the content and create a professional issue description suitable for your development team.

---

## Troubleshooting

### Error: "Not authenticated"

**Possible causes:**
- Client ID is incorrect in `.env` or `manifest.json`
- API not enabled in Google Cloud Console
- OAuth consent screen not configured

**Solutions:**
1. Verify Client ID matches in both files
2. Ensure Generative Language API is enabled
3. Check OAuth consent screen configuration

---

### Error: "Access denied"

**Possible causes:**
- Email not added as test user
- Scope not correctly configured

**Solutions:**
1. Add your email as a test user in OAuth consent screen
2. Verify the scope `https://www.googleapis.com/auth/generative-language.retriever` is added correctly
3. Try disconnecting and reconnecting in Settings

---

### Error: "Rate limit exceeded"

**Explanation:**
- Gemini API has rate limits for free/test usage

**Solutions:**
1. Wait a few minutes before trying again
2. Consider upgrading your Google Cloud plan if you need higher limits
3. Check your API usage in Google Cloud Console

---

### Extension ID Changed

**Problem:**
- If you reinstall the extension, the Extension ID changes
- OAuth credentials must be updated with new ID

**Solutions:**
1. Get new Extension ID from `chrome://extensions/`
2. Update OAuth credentials in Google Cloud Console
3. Update `manifest.json` redirect URI if using Web application type
4. Rebuild and reload extension

---

### "Generate with AI" Button Not Visible

**Possible causes:**
- Gemini not connected
- Recording has no transcript

**Solutions:**
1. Ensure you're connected to Gemini in Settings
2. Transcribe the recording first (click Transcribe button)
3. Refresh the page after transcription completes

---

### Token Expired

**Problem:**
- Access token expires after approximately 1 hour

**Solutions:**
- Simply try the operation again
- Chrome will automatically refresh the token
- If refresh fails, disconnect and reconnect in Settings

---

## Security Notes

### Best Practices

1. **Never commit credentials:** Keep `.env` file in `.gitignore`
2. **Use environment variables:** Don't hard-code Client IDs in source code
3. **Limit test users:** Only add necessary emails to OAuth consent screen
4. **Monitor API usage:** Check Google Cloud Console regularly
5. **Secure tokens:** OAuth tokens are stored locally in Chrome storage

### Data Privacy

- **Video content:** Never sent to Gemini - only transcripts are analyzed
- **Transcripts:** Sent to Gemini API for analysis (subject to Google's privacy policy)
- **Storage:** Tokens stored locally in Chrome storage (extension-only access)
- **Network:** All API calls use HTTPS encryption

---

## API Costs

### Pricing Information

- Gemini API usage may incur costs depending on your plan
- Free tier includes limited requests per month
- Monitor usage in Google Cloud Console → "Billing"
- Set up billing alerts to avoid unexpected charges

### Recommendations

1. Set up billing alerts in Google Cloud Console
2. Monitor your API usage regularly
3. Use the "Test Connection" feature sparingly
4. Consider rate limiting for production use

---

## Additional Resources

### Documentation

- [Google Cloud Console](https://console.cloud.google.com)
- [Generative AI Documentation](https://ai.google.dev/docs)
- [OAuth 2.0 for Chrome Extensions](https://developer.chrome.com/docs/extensions/mv3/tut_oauth/)

### Support

For issues with:
- **Extension functionality:** See main README.md or create an issue
- **Google Cloud setup:** [Google Cloud Support](https://cloud.google.com/support)
- **Gemini API:** [Generative AI Support](https://ai.google.dev/support)

---

## Summary

After completing this setup:

- ✅ Google Cloud project created
- ✅ Generative Language API enabled
- ✅ OAuth consent screen configured
- ✅ OAuth credentials created
- ✅ Extension configured with Client ID
- ✅ Extension rebuilt and reloaded
- ✅ Connection tested successfully

You can now use AI-powered features to automatically generate professional Jira issue descriptions from your screen recordings!

---

## Quick Reference

### Key URLs

- Google Cloud Console: https://console.cloud.google.com
- Extension Settings: Open extension → Settings
- Extension ID: `chrome://extensions/` → Find "Chrome Window Recorder"

### Key Files

- `.env` - Environment variables (Client ID)
- `manifest.json` - Extension manifest (oauth2 configuration)

### Key Commands

```bash
# Rebuild extension
npm run build

# View extension ID
# Go to chrome://extensions/ and copy ID from extension card
```

### Client ID Locations

Both must match:
1. `.env` → `VITE_GEMINI_CLIENT_ID`
2. `manifest.json` → `oauth2.client_id`
