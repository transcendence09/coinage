// === GitHub Pages Base Path ===
const basePath = `${window.location.origin}/coin-project`;

// === Determine the coin slug from the file path ===
const pathParts = window.location.pathname.split('/');
const filename = pathParts[pathParts.length - 1]; // e.g., "1-penny.html"
const coinKey = filename.replace('.html', '');

if (!coinKey) {
  alert("Missing coin identifier. Return to home page.");
  window.location.href = `${basePath}/index.html`;
  throw new Error("Missing coin identifier");
}

// === Fetch corresponding JSON ===
const jsonPath = `${basePath}/data/${coinKey}.json`;

fetch(jsonPath)
  .then(response => {
    if (!response.ok) throw new Error("Coin data not found.");
    return response.json();
  })
  .then(data => {
    document.title = data.title;
    document.getElementById('coin-title').textContent = data.title;
    document.getElementById('coin-description').textContent = data.description;

    const chatBox = document.getElementById('chat-box');
    data.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `message ${msg.type}`;
      div.innerHTML = msg.text;
      chatBox.appendChild(div);
    });

    // === Observer for fade-in on scroll ===
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate only once
        }
      });
    }, {
      threshold: 0.9
    });

    document.querySelectorAll('.message').forEach(msg => {
      observer.observe(msg);
    });
  })
  .catch(err => {
    console.error(err);
    alert("Failed to load coin content.");
  });
