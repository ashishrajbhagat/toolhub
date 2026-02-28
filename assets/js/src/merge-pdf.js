// Wait until the DOM is fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {

    // Get all required DOM elements
    const pdfInput = document.getElementById("pdfFiles");
    const uploadMessage = document.getElementById("uploadMessage");
    const mergeBtn = document.getElementById("mergeBtn");
    const btnText = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");
    const progressText = document.getElementById("progressText");
    const downloadPDF = document.getElementById("downloadPDF");
    const downloadMessage = document.getElementById("downloadMessage");
    const faqButtons = document.querySelectorAll(".faq-toggle");

    // Store selected PDF files
    let selectedFiles = [];

    // File size validation constants
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file
    const MAX_TOTAL_SIZE = 150 * 1024 * 1024; // 150 MB total
    const FILE_SIZE_WARNING = 30 * 1024 * 1024; // 30 MB warning

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

    /**
     * Handle file selection
     * Filters only PDF files and validates file sizes
     */
    pdfInput.addEventListener("change", (e) => {
        // Convert FileList to array and filter only PDF files
        selectedFiles = Array.from(e.target.files)
            .filter((file) => file.type === "application/pdf");

        // If no valid PDFs selected, exit
        if (selectedFiles.length === 0) return;

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
            mergeBtn.classList.add("hidden");
            downloadPDF.classList.add("hidden");
            selectedFiles = [];
            return;
        }

        // Check total size
        if (totalSize > MAX_TOTAL_SIZE) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `❌ Error: Total size (${formatBytes(totalSize)}) exceeds maximum limit (${formatBytes(MAX_TOTAL_SIZE)}). Please select fewer files.`;
            progressText.style.color = "#dc2626";
            uploadMessage.classList.add("hidden");
            mergeBtn.classList.add("hidden");
            downloadPDF.classList.add("hidden");
            selectedFiles = [];
            return;
        }

        // Show warning if total size is large
        if (totalSize > FILE_SIZE_WARNING) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `⚠️ Warning: Large total size (${formatBytes(totalSize)}). Merging may take longer.`;
            progressText.style.color = "#f59e0b";
        } else {
            progressText.classList.add("hidden");
        }

        // Update UI after valid selection
        uploadMessage.classList.remove("hidden");
        mergeBtn.classList.remove("hidden");
        downloadPDF.classList.add("hidden");
    });

    /**
     * Handle Merge Button Click
     * Merges selected PDF files using PDFLib
     */
    mergeBtn.addEventListener("click", async () => {
        try {
            // Prevent execution if no files selected
            if (selectedFiles.length === 0) return;

            // Update UI to show loading state
            btnText.innerText = "Merging...";
            spinner.classList.remove("hidden");
            mergeBtn.disabled = true;
            mergeBtn.classList.add("opacity-50", "cursor-not-allowed");
            progressText.classList.remove("hidden");
            progressText.innerText = "Preparing files...";
            progressText.style.color = "#000000";

            try {
                // Create a new empty PDF document
                const mergedPdf = await PDFLib.PDFDocument.create();

                // Loop through all selected files
                for (let i = 0; i < selectedFiles.length; i++) {
                    try {
                        // Update progress text
                        progressText.innerText = 
                            `Merging file ${i + 1} of ${selectedFiles.length} (${selectedFiles[i].name})...`;

                        const file = selectedFiles[i];

                        // Convert file to ArrayBuffer
                        let arrayBuffer;
                        try {
                            arrayBuffer = await file.arrayBuffer();
                        } catch (bufferError) {
                            console.error(`Error reading file ${i + 1}:`, bufferError);
                            throw new Error(`Failed to read file "${file.name}". Please ensure it's a valid PDF.`);
                        }

                        // Load the PDF document
                        let pdf;
                        try {
                            pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                        } catch (loadError) {
                            console.error(`Error loading PDF ${i + 1}:`, loadError);
                            throw new Error(`Failed to load PDF "${file.name}". It may be corrupted or not a valid PDF file.`);
                        }

                        // Copy all pages from current PDF
                        let copiedPages;
                        try {
                            copiedPages = await mergedPdf.copyPages(
                                pdf,
                                pdf.getPageIndices()
                            );
                        } catch (copyError) {
                            console.error(`Error copying pages from file ${i + 1}:`, copyError);
                            throw new Error(`Failed to extract pages from "${file.name}". The PDF may be protected or have compatibility issues.`);
                        }

                        // Add copied pages into merged document
                        try {
                            copiedPages.forEach((page) => mergedPdf.addPage(page));
                        } catch (addPageError) {
                            console.error(`Error adding pages from file ${i + 1}:`, addPageError);
                            throw new Error(`Failed to add pages from "${file.name}" to the merged document.`);
                        }

                    } catch (fileError) {
                        progressText.innerHTML = `❌ Error: ${fileError.message}`;
                        progressText.style.color = "#dc2626";
                        console.error(`Error processing file ${i + 1}:`, fileError);
                        throw fileError;
                    }
                }

                // Save merged PDF as byte array
                let mergedBytes;
                try {
                    mergedBytes = await mergedPdf.save();
                } catch (saveError) {
                    console.error("Error saving merged PDF:", saveError);
                    throw new Error("Failed to save the merged PDF. Please try again with different files.");
                }

                // Create Blob from merged PDF
                let blob;
                try {
                    blob = new Blob([mergedBytes], { type: "application/pdf" });
                } catch (blobError) {
                    console.error("Error creating blob:", blobError);
                    throw new Error("Failed to create downloadable file. Please try again.");
                }

                // Show download button
                downloadPDF.classList.remove("hidden");

                // Attach download handler with error catching
                downloadPDF.onclick = () => {
                    try {
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "merged.pdf";
                        link.click();

                        downloadMessage.classList.remove("hidden");
                        downloadMessage.innerText = "✅ Download Successful!";
                        downloadMessage.style.color = "#059669";
                        
                        // Clear the download message after 5 seconds
                        setTimeout(() => {
                            downloadMessage.classList.add("hidden");
                        }, 5000);
                    } catch (downloadError) {
                        console.error("Error downloading file:", downloadError);
                        downloadMessage.classList.remove("hidden");
                        downloadMessage.innerText = "❌ Error: Failed to download. Please try again.";
                        downloadMessage.style.color = "#dc2626";
                    }
                };

                // Show success message
                progressText.innerText = "✅ Merge Successful! Click 'Download Merged PDF' to save your file.";
                progressText.style.color = "#059669";

            } catch (mergeError) {
                // Show detailed error message
                if (mergeError.message) {
                    progressText.innerHTML = `❌ Error: ${mergeError.message}`;
                } else {
                    progressText.innerHTML = "❌ Error: An unexpected error occurred while merging PDFs. Please try again.";
                }
                progressText.style.color = "#dc2626";
                console.error("Merge operation error:", mergeError);
            }

        } catch (error) {
            // Catch any unexpected errors
            console.error("Unexpected error in merge handler:", error);
            progressText.innerHTML = "❌ Error: An unexpected error occurred. Please try again.";
            progressText.style.color = "#dc2626";

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
    try {
        if (faqButtons && faqButtons.length > 0) {
            faqButtons.forEach((button) => {
                button.addEventListener("click", function () {
                    try {
                        const content = this.nextElementSibling;
                        const icon = this.querySelector(".faq-icon");

                        // Validate DOM elements exist
                        if (!content || !icon) {
                            console.error("FAQ content or icon element not found");
                            return;
                        }

                        // Toggle visibility
                        content.classList.toggle("hidden");

                        // Update icon symbol
                        icon.textContent = content.classList.contains("hidden") ? "+" : "-";
                    } catch (toggleError) {
                        console.error("Error toggling FAQ:", toggleError);
                    }
                });
            });
        } else {
            console.warn("No FAQ toggle buttons found in merge-pdf page");
        }
    } catch (faqError) {
        console.error("Error initializing FAQ functionality:", faqError);
    }

});