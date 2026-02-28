// Wait until DOM is fully loaded before executing script
document.addEventListener("DOMContentLoaded", function () {

    try {
        // Select all FAQ toggle buttons
        const faqButtons = document.querySelectorAll(".faq-toggle");

        // Validate FAQ elements exist
        if (!faqButtons || faqButtons.length === 0) {
            console.warn("No FAQ toggle buttons found in the DOM");
            return;
        }

        // --------------------------------------------------
        // FAQ Toggle Logic
        // --------------------------------------------------
        faqButtons.forEach((button) => {

            button.addEventListener("click", function () {
                
                try {
                    const content = this.nextElementSibling;
                    const icon = this.querySelector(".faq-icon");
                    const isExpanded = this.getAttribute("aria-expanded") === "true";

                    // Validate elements exist
                    if (!content || !icon) {
                        console.error("FAQ content or icon not found");
                        return;
                    }

                    // Toggle visibility
                    content.classList.toggle("hidden");

                    // Update aria-expanded attribute for screen readers
                    this.setAttribute("aria-expanded", !isExpanded);

                    // Update icon symbol
                    icon.textContent = content.classList.contains("hidden") ? "+" : "-";
                } catch (error) {
                    console.error("Error toggling FAQ:", error);
                }
            });
        });
    } catch (error) {
        console.error("Error initializing FAQ functionality:", error);
    }

});