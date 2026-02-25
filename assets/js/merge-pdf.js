// Wait until the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {

    // Get all required DOM elements
    const pdfInput = document.getElementById("pdfFiles");
    const uploadMessage = document.getElementById("uploadMessage");
    const mergeBtn = document.getElementById("mergeBtn");
    const downloadPDF = document.getElementById("downloadPDF");
    const btnText = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");
    const progressText = document.getElementById("progressText");
    const faqButtons = document.querySelectorAll(".faq-toggle");

    // Store selected PDF files
    let selectedFiles = [];

    /**
     * Handle file selection
     * Filters only PDF files and updates UI accordingly
     */
    pdfInput.addEventListener("change", (e) => {
        // Convert FileList to array and filter only PDF files
        selectedFiles = Array.from(e.target.files)
            .filter((file) => file.type === "application/pdf");

        // If valid PDFs are selected, update UI
        if (selectedFiles.length > 0) {
            uploadMessage.classList.remove("hidden");
            mergeBtn.classList.remove("hidden");
            downloadPDF.classList.add("hidden");
            progressText.classList.add("hidden");
        }
    });

    /**
     * Handle Merge Button Click
     * Merges selected PDF files using PDFLib
     */
    mergeBtn.addEventListener("click", async () => {

        // Prevent execution if no files selected
        if (selectedFiles.length === 0) return;

        // Update UI to show loading state
        btnText.innerText = "Merging...";
        spinner.classList.remove("hidden");
        mergeBtn.disabled = true;
        mergeBtn.classList.add("opacity-50", "cursor-not-allowed");
        progressText.classList.remove("hidden");
        progressText.innerText = "Preparing files...";

        try {
            // Create a new empty PDF document
            const mergedPdf = await PDFLib.PDFDocument.create();

            // Loop through all selected files
            for (let i = 0; i < selectedFiles.length; i++) {

                // Update progress text
                progressText.innerText = 
                    `Merging file ${i + 1} of ${selectedFiles.length}...`;

                const file = selectedFiles[i];

                // Convert file to ArrayBuffer
                const arrayBuffer = await file.arrayBuffer();

                // Load the PDF document
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);

                // Copy all pages from current PDF
                const copiedPages = await mergedPdf.copyPages(
                    pdf,
                    pdf.getPageIndices()
                );

                // Add copied pages into merged document
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            // Save merged PDF as byte array
            const mergedBytes = await mergedPdf.save();

            // Create Blob from merged PDF
            const blob = new Blob([mergedBytes], { type: "application/pdf" });

            // Show download button
            downloadPDF.classList.remove("hidden");

            // Attach download handler
            downloadPDF.onclick = () => {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "merged.pdf";
                link.click();
            };

            // Show success message
            progressText.innerText = "✅ Merge Successful!";

        } catch (error) {

            // Log error and show failure message
            console.error(error);
            progressText.innerText = "❌ Error merging PDFs. Try again.";

        } finally {

            // Reset button state after completion
            spinner.classList.add("hidden");
            mergeBtn.disabled = false;
            mergeBtn.classList.remove("opacity-50", "cursor-not-allowed");
            btnText.innerText = "Merge PDFs";
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