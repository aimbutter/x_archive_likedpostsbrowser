This is for my personal use and Gemini generated the whole thing so don't ask me how to fix anything haha!

You can either download the ZIP of this thing to use locally or visit https://x-archive-likedpostsbrowser.vercel.app/ to use. 

How to Get Your like.js File???
1. Go to Twitter/X Settings -> Your Account -> Download an archive of your data.
2. Request your archive and wait for Twitter to generate the .zip file.
3. Download and extract the .zip archive.
4. Navigate to data/like.js.
5. Drag and drop like.js into the upload zone of this website.


## ✨ Features

- 🔒 **100% Client-Side & Private**: Your `like.js` file is stored locally in your browser's `localStorage`. No data is sent to external backend databases.
- 🕒 **Snowflake Date Decoder**: Extracts accurate local device timestamps directly from Twitter 64-bit Tweet IDs.
- 🎥 **Native Video & Image Player**: Plays `.mp4` videos and displays full-res photos using dynamic referral stripping (`<meta name="referrer" content="no-referrer">`) to bypass 403 CDN hotlink blocks on live platforms like Vercel.
- 📱 **9:16 Vertical Sizing Support**: Expands media containers (up to 720px) so TikTok-style, Reels, and portrait videos/images display full size without being awkwardly squished.
- 🎛️ **Multi-Filter System**: Toggle active filters simultaneously:
  - 🛑 **Hide Suspended** *(Default)* - Remove all those `"This Post is from a suspended account."` in `like.js`
  - 🔒 **Hide Protected** - Remove all those `"You’re unable to view this Post because this account owner limits who can view their Posts."` in `like.js`
  - 📷 **Without Text** - i don't know about this filter because i see posts with no text but when i open it, it is from protected account that i follow OR the account is no longer exist
  - 🖼️ **Has Media** - has video or images or both (have `t.co/xx` in `like.js`)
  - 📝 **Without Media** - text only, no media (have **no** `t.co/xx` in `like.js`)
  - 🔒 **Only Protected** - Opposite of **Hide Protected**, it shows posts from protected accounts instead. You must open live post to see what they are.
- ↕️ **Custom Sorting Engine**:
  - **Default (Archive Order)**: Preserves the exact sequence from your exported `like.js`.
  - **Sort: Newest First**
  - **Sort: Oldest First**
- ⚡ **Deep Search Indexer**: Pre-fetches handles and display names in the background via VxTwitter API, so you can search the Twitter name without having to check every pages.
- 🔄 **Per-Post Reload Button**: Re-fetch individual post metadata if Twitter CDN streams fail or posts update.
- 🧹 **One-Click Cache Reset**: Easily purge your saved archive and cached tweet metadata with a single click.

## 🛠️ Tech Stack

- **Frontend**: Pure Vanilla HTML5, CSS3, JavaScript (ES6+)
- **API**: [VxTwitter API](https://github.com/dper2174/vxtwitter) (for live metadata fetching)
- **Storage**: Browser `localStorage` API
- **Deployment**: Zero build steps — Vercel, GitHub Pages, or any static hosting compatible.

## 🛡️ Privacy & Security Notice

This application operates completely on your local device:

* Your `like.js` file is parsed entirely inside your browser.
* Public metadata and media links are requested through `api.vxtwitter.com`.
* No personal data, login credentials, or private information is stored or collected.
