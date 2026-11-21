# 🧠 broCode – AI-Powered Cloud Web IDE

**broCode** is a high-performance, AI-integrated cloud web IDE built to run entirely inside your browser using **Next.js 15 App Router**, **WebContainers**, **Monaco Editor**, and **hybrid AI (Local Ollama + Cloud Gemini/Groq Fallbacks)**. It offers real-time in-browser code execution, an interactive POSIX-like terminal, and a built-in AI coding assistant.

---

## 🚀 Features

- 🔐 **OAuth Authentication** – Secure Google & GitHub OAuth via NextAuth v5 (Auth.js) and Prisma.
- 🎨 **Modern Developer UI** – Built with TailwindCSS v4 and Radix UI / ShadCN primitives.
- 🧱 **Instant Project Templates** – Ready-to-code starters for **React (TypeScript)**, **Express.js**, **Vue 3**, **Hono**, **Next.js**, and **Angular**.
- 🗂️ **Virtual File Explorer** – Full file & folder CRUD, tab management, and unsaved changes tracking.
- 🖊️ **Monaco Code Editor** – Syntax highlighting, custom dark theme, keybindings, and inline ghost-text AI completion.
- 🤖 **Hybrid AI Assistance**:
  - **Inline Code Autocomplete**: Context-aware suggestions triggered on `Ctrl + Space` or double `Enter`. Accept with `Tab`.
  - **Interactive AI Chat Panel**: Dedicated slide-over coding assistant for code explanations, error fixes, code review, and optimization.
  - **Cloud Fallback**: Seamlessly runs with local Ollama (`codellama`) or cloud providers (**Google Gemini**, **Groq**, **OpenAI**).
- ⚙️ **WebContainers In-Browser Runtime** – Executes real Node.js and npm commands directly inside browser WebAssembly threads.
- 💻 **Interactive Terminal (`xterm.js`)** – Integrated shell piping WebContainer process stdout/stdin with command history and log export.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4, Radix UI, ShadCN |
| **Browser Runtime** | StackBlitz WebContainer API (WebAssembly) |
| **Editor** | Monaco Editor |
| **Terminal** | xterm.js (Fit, Search, WebLinks addons) |
| **AI Providers** | Local Ollama (`codellama`) + Cloud Gemini API / Groq / OpenAI |
| **Database & ORM** | MongoDB + Prisma ORM |
| **Authentication** | NextAuth.js v5 (Google + GitHub) |
| **State Management** | Zustand |

---

## 🛠️ Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/brocode.git
cd brocode
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
```env
DATABASE_URL="mongodb+srv://<user>:<password>@cluster0.mongodb.net/brocode?retryWrites=true&w=majority"
AUTH_SECRET="your_auth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

AUTH_GITHUB_ID="your_github_client_id"
AUTH_GITHUB_SECRET="your_github_client_secret"
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"

# Optional Cloud AI Fallback (e.g. Gemini API)
GEMINI_API_KEY="your_gemini_api_key_here"
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in Chrome, Edge, or Brave.

---

## 🎯 Keyboard Shortcuts

* `Ctrl + Space` or `Double Enter`: Trigger AI suggestions
* `Tab`: Accept AI suggestion
* `Ctrl + S`: Save active file
* `Ctrl + Shift + S`: Save all open files

---

## 📄 License
Licensed under the [MIT License](LICENSE).
