# Arigato SEO Labs

<div align="center">
  <img src="public/arigato-labs-logo.png" alt="Arigato Labs" width="380" />
  <h3>Next-Generation Pinterest & Google SERP Intelligence Studio</h3>
  <p>Dual-engine SEO studio designed for high-conversion prompt creators, Pinterest algorithmic visibility, strict character-compliant SERP snippets, and real-time Cloud Firestore synchronization.</p>

  <p>
    <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase Firestore" />
    <img src="https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel Ready" />
    <img src="https://img.shields.io/badge/Model-Kimi--K3-7b3ff2?style=flat-square" alt="Kimi-K3" />
  </p>
</div>

---

> **Note**: This project falls under **Arigato Labs**, founded by **Kumar Devanshu** in 2026.

---

## 🚀 Key Features

### 1. Dual-Engine SEO Studio
- **Pinterest Pin SEO Engine**:
  - Drag-and-drop / **Ctrl+V clipboard image paste** with automatic dimensions and aspect ratio detection.
  - Interactive neural laser scanning sequence with multi-stage analysis progress.
  - High-CTR Pinterest Titles (40–80 chars) and captivating SEO descriptions.
  - Curated discovery tags and an authentic live **Pinterest Pin Mockup** preview.
- **Arigato Site SERP Engine (3 Dedicated Terminal Code Blocks)**:
  - **`about-this-prompt.md`**: Aesthetic visual breakdown and atmospheric lighting analysis, ending with the creative human callout:
    > *"Aap bhi is creative prompt ko Gemini ya ChatGPT mein try karke dekho! Apne girlfriend ya boyfriend ke liye yeh stunning artwork banao, dekhna unko kitna accha aur special feel hoga. Banao aur Arigato Labs ko apna thoda pyaar deke jao! ❤️"*
    *(Strictly enforced under **199 words**).*
  - **`seo-meta-description.txt`**: High-CTR Google SERP snippet incorporating mandatory keywords *(Strictly under **160 characters**)*.
  - **`seo-keywords.csv`**: Strictly **6 to 9 keywords** + individual 1-click copy pills.
  - Dedicated 1-click **Copy buttons**, live compliance badges, and interactive **Google SERP Snippet Preview**.

### 2. Mandatory Keyword Pinning (📌)
- Pin specific keywords in the Keywords Hub (`isPinned: true`).
- Pinned terms are **mandatorily guaranteed** to appear in every generated SEO description (both Pinterest and Site).
- Non-pinned active keywords are selected intelligently by the AI model based on visual context.

### 3. Real-Time Cloud Firestore Sync
- Seamlessly synchronizes your keyword repositories with Google Cloud Firestore (`pro6-arigatoseolabs`).
- Local modifications instantly sync to the cloud and reflect across all open sessions.
- Displays live cloud connection status (`☁️ Firestore Live`).

### 4. Arigato Assistant (Floating Live AI Tester)
- Conversational developer assistant speaking in friendly, energetic human slangs (*"Bhai"*, *"let's cook 🔥"*, *"mast scene hai"*).
- Direct bridge to your Modal Kimi-K3 server.
- Built-in Markdown renderer (bold, code pills, bullet lists).
- Exact round-trip response time benchmark in milliseconds (`ms`).
- Instant quick actions:
  - `🧪 Ada Schema Test`: Validates strict JSON Schema extraction (`Ada, 36, London`).
  - `⚡ Bhai Latency Test Kar`: Live endpoint speed test.
  - `🔥 Mast Prompt Idea De`: High-conversion creative art prompt ideas.
  - `❤️ GF/BF Prompt Idea`: Prompts designed for loved ones in Gemini/ChatGPT.
  - Raw JSON inspection drawer.

### 5. Notion Editorial Design System
- Built on Notion design principles: Brand Navy (`#0a1530`), Notion Purple CTA (`#5645d4`), and clean editorial geometry (`rounded-md`, `rounded-full`).
- Fully mobile-optimized with dedicated segmented switchers, touch-friendly 44px targets, and no horizontal clipping.

### 6. Arigato Labs Brand & Legal Center
- Built-in modal navigation for **Explore Arigato Labs**, **About**, **Privacy Policy**, **Terms & Conditions**, **Disclaimer**, and **Contact**.
- Working contact form delivering messages directly to `kumardevanshu3001@gmail.com` via Web3Forms with automatic fallback.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Firebase Cloud Firestore](https://firebase.google.com/)
- **LLM / AI Endpoint**: [Moonshot AI Kimi-K3](https://modal.com/) via Modal reverse proxy
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/) (Edge Rewrites configured)

---

## 📦 Run on your own computer (Bit-by-Bit Guide)

Follow these exact steps to run **Arigato SEO Labs** locally:

### Step 1: Prerequisites
Ensure you have installed:
1. [Node.js](https://nodejs.org/) (v18+ or latest LTS recommended)
2. [Git](https://git-scm.com/)

### Step 2: Clone the Code
```bash
git clone https://github.com/kumardevanshu7/SEO-Labs.git
cd SEO-Labs
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Configure Environment Variables
Create a file named `.env` in the root folder (or copy from `.env.example`):

```env
# Optional: Pre-configure your Modal Proxy credentials for moonshotai/Kimi-K3
VITE_MODAL_PROXY_TOKEN_ID=your_modal_proxy_token_id
VITE_MODAL_PROXY_TOKEN_SECRET=your_modal_proxy_token_secret

# Firebase Cloud Firestore (Pre-configured for pro6-arigatoseolabs)
VITE_FIREBASE_API_KEY=AIzaSyBG0HNIRMsveBLm7fl2FFvyKxP_XJEyNfI
VITE_FIREBASE_AUTH_DOMAIN=pro6-arigatoseolabs.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pro6-arigatoseolabs
VITE_FIREBASE_STORAGE_BUCKET=pro6-arigatoseolabs.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=345690547077
VITE_FIREBASE_APP_ID=1:345690547077:web:d79281156819e17aafdaec
VITE_FIREBASE_MEASUREMENT_ID=G-1EMPJE3XCJ

# Optional: Web3Forms key for Contact form
VITE_WEB3FORMS_KEY=your_key_here
```

### Step 5: Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:5173](http://localhost:5173)**. You will see Arigato SEO Labs running locally!

---

## 🔥 Cloud Firestore Setup & Security Rules (`firestore.rules`)

The application synchronizes keywords with Google Cloud Firestore. Ensure security rules are applied:

1. Open [Firebase Console](https://console.firebase.google.com/) and choose `pro6-arigatoseolabs`.
2. Go to **Build > Firestore Database > Rules**.
3. Paste the contents of `firestore.rules`:
   ```javascript
   rules_version = '2';

   service cloud.firestore {
     match /databases/{database}/documents {
       // Keywords repository read/write access
       match /keywords/{document=**} {
         allow read, write: if true;
       }

       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Click **Publish**.

---

## 🚀 Deploying to Vercel

Arigato SEO Labs is pre-configured for one-click deployment on **Vercel**:

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Arigato SEO Labs with brand & firestore"
   git push origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
3. Import your GitHub repository.
4. **Environment Variables**: Add your `VITE_MODAL_PROXY_TOKEN_ID` and `VITE_MODAL_PROXY_TOKEN_SECRET`.
5. Click **Deploy**.

### How `vercel.json` Handles the API:
The included `vercel.json` file automatically proxies `/modal-api` calls to your Modal Kimi-K3 endpoint at the edge and configures client-side SPA routing:

```json
{
  "framework": "vite",
  "rewrites": [
    {
      "source": "/modal-api/(.*)",
      "destination": "https://devansh-grow--ep-kimi-k3-server.us-west.modal.direct/v1/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🤖 Modal Kimi-K3 Dashboard Recommended Settings

When deploying your server endpoint on Modal:
- **[✔] Structured Outputs**: Turn **ON** (Ensures strict JSON Schema adherence for titles, descriptions, and keywords).
- **Thinking / Reasoning Controls**: Omit `reasoning_effort: "none"` (Kimi-K3 handles internal chain-of-thought natively without explicit effort flags).
- **[ ] Streaming**: Keep **OFF** for atomic JSON parsing.
- **[ ] Tool Calling**: Keep **OFF**.

---

## 📜 Brand Notice & License

**Copyright © 2026 Arigato Labs. All Rights Reserved.**  
**Founder**: Kumar Devanshu  
**Contact**: [kumardevanshu3001@gmail.com](mailto:kumardevanshu3001@gmail.com)  

All brand names, trademarks, and logos (`arigato-labs-logo.png`, `arigato-single-logo.png`) are proprietary property of **Arigato Labs**. For complete terms and licensing guidelines, see [`brand-right/ARIGATO_LABS_LICENSE.md`](./brand-right/ARIGATO_LABS_LICENSE.md).

---

<div align="center">
  <p>Crafted with care by <strong>Arigato Labs</strong> · 2026</p>
</div>
