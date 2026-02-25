// Wait until DOM is fully loaded before executing script
document.addEventListener("DOMContentLoaded", function () {

    // Select all FAQ toggle buttons
    const faqButtons = document.querySelectorAll(".faq-toggle");

    // --------------------------------------------------
    // FAQ Toggle Logic
    // --------------------------------------------------
    faqButtons.forEach((button) => {

        button.addEventListener("click", function () {
            
            const content = this.nextElementSibling;
            const icon = this.querySelector(".faq-icon");

            // Toggle visibility
            content.classList.toggle("hidden");

            // Update icon symbol
            icon.textContent = content.classList.contains("hidden") ? "+" : "-";
        });
    });

});