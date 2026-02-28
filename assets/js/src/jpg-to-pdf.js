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

    // File size validation constants
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100 MB total
    const FILE_SIZE_WARNING = 20 * 1024 * 1024; // 20 MB warning

    // --------------------------------------------------
    // Utility: Format bytes to readable format (MB/GB)
    // --------------------------------------------------
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

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

        // Validate individual file sizes
        let totalSize = 0;
        let oversizedFiles = [];

        selectedFiles.forEach((file) => {
            totalSize += file.size;
            if (file.size > MAX_FILE_SIZE) {
                oversizedFiles.push(`${file.name} (${formatBytes(file.size)})`);
            }
        });

        // Check for oversized files
        if (oversizedFiles.length > 0) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `❌ Error: The following files exceed max size (${formatBytes(MAX_FILE_SIZE)}):<br> ${oversizedFiles.join(', ')}`;
            progressText.style.color = "#dc2626";
            uploadMessage.classList.add("hidden");
            convertBtn.classList.add("hidden");
            downloadPDF.classList.add("hidden");
            selectedFiles = [];
            return;
        }

        // Check total size
        if (totalSize > MAX_TOTAL_SIZE) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `❌ Error: Total size (${formatBytes(totalSize)}) exceeds maximum limit (${formatBytes(MAX_TOTAL_SIZE)}). Please select fewer or smaller images.`;
            progressText.style.color = "#dc2626";
            uploadMessage.classList.add("hidden");
            convertBtn.classList.add("hidden");
            downloadPDF.classList.add("hidden");
            selectedFiles = [];
            return;
        }

        // Show warning if total size is large
        if (totalSize > FILE_SIZE_WARNING) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `⚠️ Warning: Large total size (${formatBytes(totalSize)}). Conversion may take longer.`;
            progressText.style.color = "#f59e0b";
        } else {
            progressText.classList.add("hidden");
        }

        // Update UI after selection
        uploadMessage.classList.remove("hidden");
        convertBtn.classList.remove("hidden");
        downloadPDF.classList.add("hidden");
    });

    // --------------------------------------------------
    // Convert Selected Images to PDF
    // --------------------------------------------------
    convertBtn.addEventListener("click", async () => {

        // Prevent execution if no files selected
        if (!selectedFiles.length) return;

        try {
            // Show loading UI state
            btnText.innerText = "Converting...";
            spinner.classList.remove("hidden");
            setButtonState(false);
            progressText.classList.remove("hidden");
            progressText.innerText = "Preparing file...";
            progressText.style.color = "#059669";

            // Create new PDF document
            const pdf = new jsPDF();

            // Loop through selected images
            for (let i = 0; i < selectedFiles.length; i++) {

                const file = selectedFiles[i];

                try {
                    // Update progress message
                    progressText.innerText =
                        `Converting page ${i + 1} of ${selectedFiles.length}...`;

                    // Convert image to Base64
                    const imgData = await fileToDataURL(file);

                    // Wait for image to load before adding to PDF
                    await new Promise((resolve, reject) => {

                        const img = new Image();
                        img.src = imgData;

                        img.onerror = () => {
                            reject(new Error(`Failed to load image: ${file.name}`));
                        };

                        img.onload = () => {
                            try {
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
                            } catch (error) {
                                reject(new Error(`Error adding image to PDF: ${error.message}`));
                            }
                        };
                    });
                } catch (imageError) {
                    throw new Error(`Error processing image ${i + 1}: ${imageError.message}`);;
                }
            }

            // Conversion successful
            progressText.innerText = "✅ Conversion Successful!";
            progressText.style.color = "#059669";

            // Show download button
            downloadPDF.classList.remove("hidden");

            // Attach download handler
            downloadPDF.addEventListener("click", () => {
                try {
                    pdf.save("converted.pdf");
                    downloadMessage.classList.remove("hidden");
                    downloadMessage.innerText = "✅ Download Successful!";
                } catch (error) {
                    console.error("Error downloading PDF:", error);
                    downloadMessage.classList.remove("hidden");
                    downloadMessage.innerText = "❌ Error downloading PDF";
                    downloadMessage.style.color = "#dc2626";
                }
            });

            // Reset button state
            spinner.classList.add("hidden");
            btnText.innerText = "Convert Another File";
            setButtonState(true);

            // Reload page when clicking convert again
            convertBtn.onclick = () => location.reload();
        } catch (error) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `❌ Error: ${error.message || 'Conversion failed. Please try again.'}`;
            progressText.style.color = "#dc2626";
            console.error("JPG to PDF conversion error:", error);
            spinner.classList.add("hidden");
            setButtonState(true);
        }
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