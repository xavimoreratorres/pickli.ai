document.addEventListener("DOMContentLoaded", function () {
    const tagElements = document.querySelectorAll(".tag-1");

    tagElements.forEach((tagElement) => {
        const tag = tagElement.querySelector(".tag");
        const tagText = tag.textContent;

        tagElement.setAttribute("data-category", "relax.tags");  // Set data-category by default
        
        tagElement.addEventListener("click", function () {
            tagElement.classList.toggle("active");
            tag.classList.toggle("active");  // Toggle active class on tag

            // Toggle data-id attribute based on the "active" class
            if (tagElement.classList.contains("active")) {
                tagElement.setAttribute("data-id", tagText);
            } else {
                tagElement.removeAttribute("data-id");
            }
        });
    });
});
