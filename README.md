# The Shadow Guard

## Team Members
- Campbell David
- Adetunji peter
- Abdullahi Abdulmumeen
- abayomisoyinka


---

## 🚀 Live Demo

*   **Live Application:** [Link to your deployed Vercel/Netlify/Render URL]
*   **Backend API:** [Link to your live backend API endpoint URL, if separate]
*   **Recorded Demo:** https://www.loom.com/share/e977defe60ea4afdb13ce48eac287573?sid=14e52577-37f4-45f5-a107-2f39e40730a9.


---

## 🎯 The Problem

*Challange six Shadow IT "How might we enable business agility and innovation by making it easy
for teams to use the tools they love, while giving the IT and Security teams the visibility and
control they need to protect the bank?" 

## ✨ Our Solution

*Shadow Guard solves this by letting employees use the tools they need safely while giving IT full real-time visibility, risk scoring, and control over all browser and cloud activity.*

---

## 🛠️ Tech Stack



Frontend / Client Layer:

javascript

Chromium-based extension running in the browser.

Background agent: monitors all browser traffic, handles messaging with the backend, and keeps the extension alive.

Service worker: lightweight script running in the background to listen for events, manage caching, and handle asynchronous tasks like risk notifications.


Backend: Python with Flask handling API endpoints and orchestration.

Database: SQL (internal relational database for logs, risk scores, and user activity).

Deployment: Cloud-hosted backend services (AWS, GCP, or internal servers).

AI/Models: Custom-trained AI models (internal team) for real-time risk scoring, vulnerability detection, and tool recommendation.

---

## ⚙️ How to Set Up and Run Locally (Optional)

*Briefly explain the steps to get your project running on a local machine.*

**Example:**

1.  Clone the repository:
    ```bash
    git clone [your-repo-link]
    ```
2.  Navigate to the project directory:
    ```bash
    cd [project-directory]
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Create a `.env.local` file and add the necessary environment variables:
    ```
    DATABASE_URL=...
    API_KEY=...
    ```
5.  Run the development server:
    ```bash
    npm run dev
    ```
