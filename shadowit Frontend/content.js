console.log('URL Logger extension loaded on:', window.location.href);

const rulesKey = "siteRules";
const requestsKey = "requestedAccess";

// Default rules for demonstration.
// To test, add a rule like: { url: "google.com", blocked: true }
// and navigate to google.com.
const defaultRules = [
  { url: "canva.com", blocked: true },
  { url: "figma.com", blocked: false }
];

// Initialize default rules if they don't exist in localStorage
if (!localStorage.getItem(rulesKey)) {
  localStorage.setItem(rulesKey, JSON.stringify(defaultRules));
}

/**
 * Checks the current URL against the blocklist and shows the modal if a match is found.
 */
function checkBlockedSite() {
  const rules = JSON.parse(localStorage.getItem(rulesKey)) || [];
  const currentURL = window.location.href;

  for (let rule of rules) {
    // Check if the current URL contains the rule's URL string
    if (currentURL.includes(rule.url)) {
      if (rule.blocked) {
        showBlockedModal(rule.url);
      }
      break; // Stop checking after the first match
    }
  }
}

/**
 * Creates and displays a styled modal overlay to block the site.
 * @param {string} site - The URL of the blocked site.
 */
function showBlockedModal(site) {
  // Prevent multiple modals from being created
  if (document.getElementById("blocked-modal-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "blocked-modal-overlay";

  // The modal's HTML and CSS are defined here for self-containment.
  overlay.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      
      #blocked-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #blocked-modal {
        background-color: #121212;
        color: #e5e5e5;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        width: 100%;
        max-width: 420px;
        overflow: hidden;
        animation: fadeIn 0.3s ease-out;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      #modal-header {
        background-color: #1e1e1e;
        padding: 12px 15px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #333;
        position: relative;
      }
      .modal-dots {
        display: flex;
        gap: 8px;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: block;
      }
      #blocked-close-btn {
        background-color: #ff5f56;
        padding: 0;
        border: 1px solid #e0443e;
        cursor: pointer;
        transition: filter 0.2s;
      }
      #blocked-close-btn:hover {
        filter: brightness(1.1);
      }
      .yellow { background-color: #ffbd2e; border: 1px solid #dea123;}
      .green { background-color: #27c93f; border: 1px solid #1aae29;}
      .modal-title {
        color: #a0a0a0;
        font-weight: 500;
        font-size: 14px;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
      }
      #modal-content {
        padding: 20px;
        text-align: center;
      }
      #blocked-msg {
        font-size: 18px;
        line-height: 1.5;
        margin-bottom: 25px;
        color: #fff;
      }
      #blocked-msg span {
        font-weight: 600;
        color: #a0a0a0;
        background-color: #2a2a2a;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid #444;
      }
      #blocked-request-btn {
        width: 100%;
        padding: 12px 20px;
        background-color: #fff;
        border: none;
        border-radius: 8px;
        color: #121212;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      #blocked-request-btn:hover {
        background-color: #f0f0f0;
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      }
       #blocked-spinner {
          color: #a0a0a0;
          font-size: 16px;
          padding: 20px 0;
       }
       #blocked-countdown {
          color: #777;
          font-size: 14px;
          margin-top: 10px;
       }
    </style>
    <div id="blocked-modal">
      <div id="modal-header">
        <div class="modal-dots">
          <button id="blocked-close-btn" class="dot"></button>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="modal-title">Access Restricted</div>
      </div>
      <div id="modal-content">
        <div id="blocked-msg">This site <span>${site}</span> is currently blocked.</div>
        <button id="blocked-request-btn">Request Temporary Access</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Wire up events
  document.getElementById("blocked-close-btn").onclick = () => overlay.remove();
  document.getElementById("blocked-request-btn").onclick = () => handleRequest(site);
}

/**
 * Handles the logic for requesting access and updating the modal UI.
 * @param {string} site - The URL for which access is requested.
 */
function handleRequest(site) {
  let requests = JSON.parse(localStorage.getItem(requestsKey)) || [];
  if (!requests.includes(site)) {
    requests.push(site);
    localStorage.setItem(requestsKey, JSON.stringify(requests));
  }
  console.log("Requested URLs:", requests);

  const modalContent = document.getElementById("modal-content");
  if (!modalContent) return;
  
  // Update the modal to show a success message and countdown
  modalContent.innerHTML = `
    <div id="blocked-spinner">
        <span style="font-size: 24px; display: block; margin-bottom: 15px;">✅</span>
        Access Granted
    </div>
    <div id="blocked-countdown">Closing in 3s</div>
  `;

  let counter = 3;
  const countdown = document.getElementById("blocked-countdown");
  const interval = setInterval(() => {
    counter--;
    if (countdown) {
      countdown.innerText = `Closing in ${counter}s`;
    }
    if (counter <= 0) {
      clearInterval(interval);
      // Safely remove the overlay
      document.getElementById("blocked-modal-overlay")?.remove();
    }
  }, 1000);
}

// Run the site check when the script loads
checkBlockedSite();
