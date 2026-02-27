// Wait until DOM is fully loaded before executing script
document.addEventListener("DOMContentLoaded", () => {

    // Get required DOM elements
    const imageInput = document.getElementById("imageFiles");
    const uploadMessage = document.getElementById("uploadMessage");
    const convertBtn = document.getElementById("convertBtn");
    const btnText = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");
    const progressText = document.getElementById("progressText");
    const downloadPDF = document.getElementById("downloadPDF");
    const downloadMessage = document.getElementById("downloadMessage");
    const faqButtons = document.querySelectorAll(".faq-toggle");

    // Destructure jsPDF from global window object
    const { jsPDF } = window.jspdf;

    // Store selected image files
    let selectedFiles = [];

    // --------------------------------------------------
    // Utility Function: Convert file to Base64 Data URL
    // --------------------------------------------------
    const fileToDataURL = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();

            // Resolve with Base64 result
            reader.onload = () => resolve(reader.result);

            // Reject if error occurs
            reader.onerror = reject;

            // Read file as Data URL
            reader.readAsDataURL(file);
        });

    // --------------------------------------------------
    // Utility Function: Enable / Disable convert button
    // --------------------------------------------------
    const setButtonState = (enabled) => {
        convertBtn.disabled = !enabled;

        // Add/remove styling based on state
        convertBtn.classList.toggle("opacity-50", !enabled);
        convertBtn.classList.toggle("cursor-not-allowed", !enabled);
    };

    // --------------------------------------------------
    // Handle Image File Selection
    // --------------------------------------------------
    imageInput.addEventListener("change", (e) => {

        // Filter only JPG and PNG files
        selectedFiles = Array.from(e.target.files)
            .filter((file) =>
                ["image/jpeg", "image/png"].includes(file.type)
            );

        // If no valid images selected, exit
        if (!selectedFiles.length) return;

        // Update UI after selection
        uploadMessage.classList.remove("hidden");
        convertBtn.classList.remove("hidden");
        downloadPDF.classList.add("hidden");
        progressText.classList.add("hidden");
    });

    // --------------------------------------------------
    // Convert Selected Images to PDF
    // --------------------------------------------------
    convertBtn.addEventListener("click", async () => {

        // Prevent execution if no files selected
        if (!selectedFiles.length) return;

        // Show loading UI state
        btnText.innerText = "Converting...";
        spinner.classList.remove("hidden");
        setButtonState(false);
        progressText.classList.remove("hidden");
        progressText.innerText = "Preparing file...";

        // Create new PDF document
        const pdf = new jsPDF();

        // Loop through selected images
        for (let i = 0; i < selectedFiles.length; i++) {

            const file = selectedFiles[i];

            // Update progress message
            progressText.innerText =
                `Converting page ${i + 1} of ${selectedFiles.length}...`;

            // Convert image to Base64
            const imgData = await fileToDataURL(file);

            // Wait for image to load before adding to PDF
            await new Promise((resolve) => {

                const img = new Image();
                img.src = imgData;

                img.onload = () => {

                    // Calculate image dimensions to fit page width
                    const imgWidth = pdf.internal.pageSize.getWidth();
                    const imgHeight =
                        (img.height * imgWidth) / img.width;

                    // Add new page except for first image
                    if (i > 0) pdf.addPage();

                    // Add image to PDF
                    pdf.addImage(
                        imgData,
                        "JPEG",
                        0,
                        0,
                        imgWidth,
                        imgHeight
                    );

                    resolve();
                };
            });
        }

        // Conversion successful
        progressText.innerText = "✅ Conversion Successful!";

        // Show download button
        downloadPDF.classList.remove("hidden");

        // Attach download handler
        downloadPDF.addEventListener("click", () => {

            pdf.save("converted.pdf");

            downloadMessage.classList.remove("hidden");
            downloadMessage.innerText = "✅ Download Successful!";
        });

        // Reset button state
        spinner.classList.add("hidden");
        btnText.innerText = "Convert Another File";
        setButtonState(true);

        // Reload page when clicking convert again
        convertBtn.onclick = () => location.reload();
    });

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