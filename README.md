**Download and use on your own computer. Using on my [deployment](https://github.com/aimbutter/x_archive_likedpostsbrowser/deployments/Production) is alright but it might not work properly.**

# Liked Post Browser 🐦

A lightweight, local web application to browse, filter, search, and download high-resolution media from your Twitter/X archive (`like.js`).

---

## ✨ Features

* **📁 Archive Parser**: Drag and drop your Twitter `like.js` file to load your liked posts locally.
* **⚡ Smart Media Fetching**: Uses **FixTweet** and **VxTwitter** APIs with auto-fallback and per-card `Fx` / `Vx` re-fetch buttons.
* **🎯 Filters & Sorting**:
* Filter by **Suspended**, **Protected**, **With/Without Media**, and **Without Text**.
* Search by post text, tweet IDs (display names, or `@usernames` might not work properly if all the posts have not indexed yet)
* Sort posts by **Archive Order**, **Newest First**, or **Oldest First**.
* **⚙️ Custom Media Downloader**:
* Saves original photo resolutions (`name=orig`) and source MP4 video streams.
* Customizable filename (e.g. **Sample File:** `twitter_1967176651479117983_1.jpg`)

---

## 🔒 Safety & Privacy

* **100% Client-Side**: No backend servers, databases, or tracking scripts. Your archive file is processed purely inside your browser.
* **Private Local Caching**: API responses are cached in your browser's `localStorage` so previously fetched posts load instantly without hitting the API again.
* **Full Data Control**: Use **🔄 Clear Archive** at any time to immediately wipe all saved archive data and cached media from your browser.

---

## 🚀 How to Use

### Step 1: Get Your `like.js` File

1. Go to **Twitter / X Settings** > **Your Account** > **Download an archive of your data**.
2. Download and extract your archive `.zip` file once ready.
3. Open the `data/` folder and locate **`like.js`**.

### Step 2: Launch the Browser

1. Open `index.html` in any web browser (Chrome, Edge, Firefox, Safari).
2. Drag & drop your **`like.js`** file into the upload box.

### Step 3: Configure Filename Pattern (Optional)

Open **⚙️ Settings** to customize how downloaded files are named. You can click or drag & drop any tag chip into the input field:

| Tag | Example Output |
| --- | --- |
| `{username}` | `@handle` |
| `{twittername}` | Display Name |
| `{userid}` | Account ID |
| `{postid}` | Tweet Status ID |
| `{date}` | Post Date (`YYYY-MM-DD`) |
| `{index}` | Media position index (`1`, `2`, ...) |

**Default Pattern:** `{username}_{postid}_{index}`

**Sample File:** `twitter_1967176651479117983_1.jpg`
