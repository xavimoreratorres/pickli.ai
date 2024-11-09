// Function to create and populate each result card
function generateResultCards(cardData) {
    const resultsScreen = document.querySelector(".results-screen");

    // Clear preexisting result cards
    resultsScreen.querySelectorAll(".resultcard").forEach(card => card.remove());

    // Reference to the 'edit-or-new-search' div to insert cards before it
    const insertBeforeElement = document.querySelector(".edit-or-new-search");

    cardData.forEach(item => {
        // Create the main result card structure
        const resultCard = document.createElement("div");
        resultCard.classList.add("resultcard");

        // Insert the image URL directly into the `.image-change-image-here` container
        const resultCardContent = `
            <div class="resultcard1">
                <div class="card-image">
                    <div class="container-image">
                        <div class="image-change-image-here">
                            <img class="aspect-ratio-keeper-addition" alt="${item.title}" src="${item.imageUrl}">
                        </div>
                    </div>
                </div>
                <div class="result-card-content">
                    <div class="result-title">${item.title}</div>
                    <div class="container-description">
                        <div class="title">
                            <b class="why-this-fits">WHY THIS FITS YOUR MOOD?</b>
                        </div>
                        <div class="title">
                            <div class="because-you-had">${item.reason}</div>
                        </div>
                    </div>
                    <div class="cta-container">
                        <div class="secondary-cta" onclick="window.open('${item.trailerLink}', '_blank')">
                            <div class="cta-label-icon">
                                <div class="generatebuttontext">Search trailer</div>
                            </div>
                        </div>
                        <div class="primary-cta" onclick="window.open('${item.links[0]}', '_blank')">
                            <div class="cta-label-icon">
                                <div class="generatebuttontext">Open on ${item.serviceIds[0]}</div>
                            </div>
                        </div>
                    </div>
                    ${item.serviceIds.length > 1 ? `
                    <div class="accordion-to-expand-platforms" style="cursor: pointer;">
                        <img class="navigation-chevron-down" alt="Expand" src="./svg/downarrow.svg">
                        <div class="available-on-2">Available on ${item.serviceIds.length - 1} more of your platforms</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="deletearea">
                <img class="navigation-close" alt="Close" src="./svg/closearrow.svg">
            </div>
        `;

        resultCard.innerHTML = resultCardContent;

        // Attach event listener to the "close" button
        resultCard.querySelector(".navigation-close").addEventListener("click", () => {
            resultCard.remove(); // Remove the card on click
        });

        // Handle additional platforms expansion and collapse if there are multiple services
        if (item.serviceIds.length > 1) {
            const accordion = resultCard.querySelector(".accordion-to-expand-platforms");
            accordion.addEventListener("click", () => {
                // Check if the extra CTAs container already exists
                const existingCTAsContainer = accordion.parentNode.querySelector(".container-extra-ctas");
                if (existingCTAsContainer) {
                    existingCTAsContainer.remove(); // Collapse if it exists
                } else {
                    // Create and add extra platform buttons
                    const extraCTAsContainer = document.createElement("div");
                    extraCTAsContainer.classList.add("container-extra-ctas");
                    for (let i = 1; i < item.serviceIds.length; i++) {
                        const buttonDiv = document.createElement("div");
                        buttonDiv.classList.add("buttonalt");
                        buttonDiv.innerHTML = `
                            <div class="cta-label-icon">
                                <div class="generatebuttontext">Open on ${item.serviceIds[i]}</div>
                            </div>
                        `;
                        buttonDiv.addEventListener("click", () => {
                            window.open(item.links[i], "_blank");
                        });
                        extraCTAsContainer.appendChild(buttonDiv);
                    }
                    accordion.parentNode.appendChild(extraCTAsContainer);
                }
            });
        }

        resultsScreen.insertBefore(resultCard, insertBeforeElement); // Insert before 'edit-or-new-search'
    });
}

// Load recommendation data from localStorage
const recommendationResult = JSON.parse(localStorage.getItem('recommendationResult'));

if (recommendationResult && Array.isArray(recommendationResult)) {
    // Call function to populate result cards with the actual data
    generateResultCards(recommendationResult);
} else {
    console.error("No valid recommendation data found in localStorage.");
}

// Utility function to clear cookies
function clearCookies() {
    document.cookie.split(";").forEach((cookie) => {
        const cookieName = cookie.split("=")[0];
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
}

// Button to clear cookies and go to index
document.querySelector(".button").addEventListener("click", () => {
    clearCookies();
    window.location.href = "index.html";
});

// Button to go to index without clearing cookies
document.querySelector(".button1").addEventListener("click", () => {
    window.location.href = "index.html";
});
