function loadComponent(fileName, targetElement) {
    if (!targetElement) {
      console.error("Error: Target element '.content' not found in the DOM.");
      return;
    }
  
    fetch(fileName)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        return response.text();
      })
      .then(html => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        targetElement.appendChild(tempDiv);
      })
      .catch(error => console.error(`Error loading ${fileName}:`, error));
  }
  
  // Load all components into the '.content' div when DOM is ready
  function loadComponents() {
    const contentDiv = document.querySelector(".content");
  
    if (!contentDiv) {
      console.error("Error: '.content' div is missing from the DOM. Components cannot be loaded.");
      return;
    }
  
    const components = [
      { html: "showtype.html", css: "showtype.css", js: "showtype.js" },
      { html: "goal.html", css: "goal.css", js: "goal.js" },
      { html: "captivatetags.html", css: "captivatetags.css", js: "captivatetags.js" },
      { html: "touch.html", css: "touch.css", js: "touch.js" },
      { html: "exclude.html", css: "exclude.css", js: "exclude.js" },
      { html: "platform.html", css: "platform.css", js: "platform.js" }
    ];
  
    components.forEach(component => {
      loadCSS(component.css);
      loadComponent(component.html, contentDiv);
      loadJS(component.js);
    });
  }
  
  document.addEventListener("DOMContentLoaded", loadComponents);
  