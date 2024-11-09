// Load selection from cache or initialize empty cache
const cacheKey = 'platformSelections';
let platformSelections = JSON.parse(localStorage.getItem(cacheKey)) || {};

// Function to render platform options dynamically with fade effect
function renderPlatformOptions(services) {
    const platformRow = document.querySelector('.platformoptionsrow1');

    // Fade out effect
    platformRow.style.opacity = '0';

    setTimeout(() => {
        platformRow.innerHTML = ''; // Clear previous platform options

        services.forEach(service => {
            const platformDiv = document.createElement('div');
            platformDiv.classList.add('platformoptiontag');
            platformDiv.setAttribute('data-group', 'platform'); // Always add data-group attribute

            // Conditionally add data-id attribute if platform is active
            if (platformSelections[service.id]) {
                platformDiv.setAttribute('data-id', service.id);
                platformDiv.classList.add('active');
            }

            const platformImg = document.createElement('img');
            platformImg.classList.add('platformlogo');
            platformImg.src = service.imageSet.lightThemeImage;
            platformImg.alt = service.name;

            platformDiv.appendChild(platformImg);
            platformRow.appendChild(platformDiv);

            // Toggle active state and data-id attribute on click
            platformDiv.addEventListener('click', () => {
                platformDiv.classList.toggle('active');
                const isActive = platformDiv.classList.contains('active');

                if (isActive) {
                    platformDiv.setAttribute('data-id', service.id);
                } else {
                    platformDiv.removeAttribute('data-id');
                }

                platformSelections[service.id] = isActive;
                localStorage.setItem(cacheKey, JSON.stringify(platformSelections));
            });
        });

        // Fade in effect
        platformRow.style.opacity = '1';
    }, 300); // Delay for fade-out before rendering new content
}

// Fetch platform data based on the country name
function fetchPlatformData(countryName) {
    const functionUrl = 'https://us-central1-double-voice-439307-j8.cloudfunctions.net/getcountryplatform';

    fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ countryName })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const services = data.services || [];
        renderPlatformOptions(services);
    })
    .catch(error => {
        console.error('Error fetching platform data:', error);
    });
}

// Fetch IP location and update datacountry div
const datacountryDiv = document.querySelector('.datacountry');
const locationFunctionUrl = 'https://us-central1-double-voice-439307-j8.cloudfunctions.net/getlocation';

fetch(locationFunctionUrl)
    .then(response => response.json())
    .then(data => {
        const country = data.country || 'United States';
        datacountryDiv.textContent = country;
        datacountryDiv.setAttribute('data-id', country);
        
        // Fetch and render platform data based on the initial country name
        fetchPlatformData(country);
    })
    .catch(error => {
        console.error('Error fetching country data:', error);
        datacountryDiv.textContent = 'No internet - Unable to get your location';
        datacountryDiv.setAttribute('data-id', 'United States');
    });

// Allow user to edit the content of the datacountry div when clicked
datacountryDiv.addEventListener('click', function() {
    this.setAttribute('contentEditable', true); // Make the div editable
    this.focus(); // Focus the div so the user can start editing
});

// Enforce a character limit of 20 characters on the datacountry div
datacountryDiv.addEventListener('input', function() {
    if (this.textContent.length > 20) {
        this.textContent = this.textContent.substring(0, 20); // Trim to 20 characters
    }
});

// Update platform options when the user clicks away (blur)
datacountryDiv.addEventListener('blur', function() {
    this.removeAttribute('contentEditable'); // Disable editing when focus is lost

    const countryName = this.textContent.trim();
    fetchPlatformData(countryName); // Fetch and update platform options based on new country
});
