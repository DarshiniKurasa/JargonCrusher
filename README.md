# JargonCrusher

JargonCrusher is a tool designed to help you easily identify, understand, and rewrite corporate jargon into simple and clear English. It consists of two main components:
1. **The Web App**: A responsive, Next.js application that provides an API for crushing jargon.
2. **The Chrome Extension**: A browser extension that detects jargon on web pages (specifically LinkedIn) and provides a pop-up interface to interact with the LLM backend.

---

## 🏗️ Structure

- **`web/`**: Contains the Next.js web application and the main API (`/api/crush`) for processing text.
- **`extension/`**: Contains the Chrome Extension source code (manifest, content scripts, background worker, and popup UI).

---

## 🚀 Step 1: Web App Setup

The web application is built with **Next.js 16** and uses **Tailwind CSS** for styling.

### Prerequisites (Web App)
- Node.js installed

### Running Locally
1. Navigate to the `web/` directory:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Create a `.env` file in `web/` and provide the required API keys for Groq and Upstash Redis:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. The application should now be running on [http://localhost:3000](http://localhost:3000).

---

## 🧩 Step 2: Chrome Extension Setup

The Chrome extension monitors your active tab and allows you to "crush" jargon directly from the page.

### Loading the Extension Locally
1. Open Google Chrome and go to `chrome://extensions/`.
2. Enable **"Developer mode"** in the top right corner.
3. Click **"Load unpacked"** in the top left.
4. Select the `extension/` folder from this project directory.
5. The JargonCrusher extension should now appear in your browser toolbar!

### Features
- **Auto-Detection**: Scans the page for corporate buzzwords.
- **Crush Jargon**: Sends highlighted text to the backend API to translate it into plain English.
- **Popup UI**: An intuitive interface that displays the extracted meaning, key points, and the tone of the jargonized text.

---

## 🌟 Deploying

### Web App
The `web/` directory is optimized for deployment on **Vercel**. 
1. Push this repository to GitHub.
2. Import the project in Vercel.
3. Set the **Root Directory** to `web/` during the import setup.
4. Add your `GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` to Vercel's Environment Variables.
5. Deploy!

### Chrome Extension
To release the extension to the Chrome Web Store:
1. Zip the contents of the `extension/` folder.
2. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Create a new item and upload the `.zip` file.
4. Fill out the required store listing details and publish.

---

## 🤝 Contributing

Contributions are welcome! Please follow the commit history to understand the step-by-step evolution of this tool. Feel free to open issues or submit pull requests.
