document.addEventListener("DOMContentLoaded", () => {
    const options = document.querySelectorAll(".experience-option");

    options.forEach(option => {
          option.addEventListener("click", () => {
                // Deselect all options and remove data-id
                options.forEach(opt => {
                      opt.classList.remove("active");
                      opt.removeAttribute("data-id"); // Remove data-id when inactive
                      const icon = opt.querySelector(".radio-button-unchecked-icon");
                      if (icon) icon.src = "./svg/radio_button_unchecked.svg";
                });

                // Select the clicked option
                option.classList.add("active");
                const icon = option.querySelector(".radio-button-unchecked-icon");
                if (icon) icon.src = "./svg/radio_button_checked.svg";

                // Set data-id and data-category only for the active element
                const optionTitle = option.querySelector(".option-title");
                if (optionTitle) {
                      option.setAttribute("data-id", optionTitle.textContent.trim());
                      option.setAttribute("data-category", "goal");
                }
          });
    });
});
