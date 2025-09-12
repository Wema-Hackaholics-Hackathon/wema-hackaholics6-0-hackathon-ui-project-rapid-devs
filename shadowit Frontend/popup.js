document.addEventListener('DOMContentLoaded', function() {
  const urlDisplay = document.getElementById('url-display');
  const logBtn = document.getElementById('log-btn');
  const closeBtn = document.getElementById('close-btn');

  // Get current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const url = tabs[0].url;
      urlDisplay.textContent = url;
    } else {
      urlDisplay.textContent = 'No active tab found';
    }
  });

  // Log URL to console
  logBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const url = tabs[0].url;
        console.log('Current URL:', url);
        
        // Show popper with URL
        showPopper(url);
      }
    });
  });

  // Close popup
  closeBtn.addEventListener('click', function() {
    window.close();
  });
});

function showPopper(url) {
  // Remove existing popper if any
  removePopper();

  // Create popper element
  const popper = document.createElement('div');
  popper.className = 'popper';
  popper.id = 'url-popper';
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'popper-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = removePopper;
  
  // Create URL text
  const urlText = document.createElement('div');
  urlText.textContent = url;
  urlText.style.marginRight = '15px';
  
  popper.appendChild(urlText);
  popper.appendChild(closeBtn);
  
  // Add to document
  document.body.appendChild(popper);
  
  // Auto-remove after 5 seconds
  setTimeout(removePopper, 5000);
}

function removePopper() {
  const popper = document.getElementById('url-popper');
  if (popper) {
    popper.remove();
  }
}