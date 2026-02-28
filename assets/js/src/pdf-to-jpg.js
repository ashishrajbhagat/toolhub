// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc ="../assets/js/vendor/pdf.worker.min.js";

// Wait until DOM is fully loaded before executing script
document.addEventListener("DOMContentLoaded", () => {

    // Get required DOM elements
    const pdfInput = document.getElementById("pdfFile");
    const uploadMessage = document.getElementById("uploadMessage");
    const convertBtn = document.getElementById("convertBtn");
    const btnText = document.getElementById("btnText");
    const spinner = document.getElementById("spinner");
    const progressText = document.getElementById("progressText");
    const downloadSingle = document.getElementById("downloadSingle");
    const downloadZip = document.getElementById("downloadZip");
    const downloadMessage = document.getElementById("downloadMessage");
    const faqButtons = document.querySelectorAll(".faq-toggle");

    // Store selected PDF file and generated images
    let pdfFile = null;
    let images = [];

    // File size validation constants
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
    const FILE_SIZE_WARNING = 20 * 1024 * 1024; // 20 MB warning threshold

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
    // Utility: Enable / Disable Convert Button
    // --------------------------------------------------
    const setButtonState = (enabled) => {
        convertBtn.disabled = !enabled;
        convertBtn.classList.toggle("opacity-50", !enabled);
        convertBtn.classList.toggle("cursor-not-allowed", !enabled);
    };

    // --------------------------------------------------
    // Handle PDF File Selection
    // --------------------------------------------------
    pdfInput.addEventListener("change", (e) => {

        // Store selected file
        pdfFile = e.target.files[0];

        // Exit if no file selected
        if (!pdfFile) return;

        // Validate file size
        if (pdfFile.size > MAX_FILE_SIZE) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `❌ Error: File size (${formatBytes(pdfFile.size)}) exceeds maximum limit (${formatBytes(MAX_FILE_SIZE)}). Please select a smaller file.`;
            progressText.style.color = "#dc2626";
            uploadMessage.classList.add("hidden");
            convertBtn.classList.add("hidden");
            downloadSingle.classList.add("hidden");
            downloadZip.classList.add("hidden");
            pdfFile = null;
            return;
        }

        // Show warning if file is large
        if (pdfFile.size > FILE_SIZE_WARNING) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = `⚠️ Warning: Large file (${formatBytes(pdfFile.size)}). Conversion may take longer.`;
            progressText.style.color = "#f59e0b";
        } else {
            progressText.classList.add("hidden");
        }

        // Update UI after file selection
        uploadMessage.classList.remove("hidden");
        convertBtn.classList.remove("hidden");

        downloadSingle.classList.add("hidden");
        downloadZip.classList.add("hidden");
    });

    // --------------------------------------------------
    // Convert PDF Pages to JPG Images
    // --------------------------------------------------
    convertBtn.addEventListener("click", async () => {

        // Prevent execution if no file selected
        if (!pdfFile) return;

        try {
            // Reset UI
            progressText.classList.remove("hidden");
            progressText.innerText = "Preparing file...";
            progressText.style.color = "#059669";
            downloadSingle.classList.add("hidden");
            downloadZip.classList.add("hidden");

            // Start loading state
            btnText.innerText = "Converting...";
            spinner.classList.remove("hidden");
            setButtonState(false);

            const fileReader = new FileReader();

            // Error handler for FileReader
            fileReader.onerror = () => {
                progressText.classList.remove("hidden");
                progressText.innerHTML = "❌ Error: Failed to read PDF file. Please try again.";
                progressText.style.color = "#dc2626";
                console.error("FileReader error:", fileReader.error);
                spinner.classList.add("hidden");
                setButtonState(true);
            };

            // Abort handler for FileReader
            fileReader.onabort = () => {
                progressText.classList.remove("hidden");
                progressText.innerHTML = "❌ Error: File reading was aborted.";
                progressText.style.color = "#dc2626";
                spinner.classList.add("hidden");
                setButtonState(true);
            };

            // When file reading is complete
            fileReader.onload = async function () {
                try {
                    // Convert ArrayBuffer to typed array
                    const typedarray = new Uint8Array(this.result);

                    // Load PDF document using pdf.js
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;

                    images = []; // Reset images array

                    // Loop through each page
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

                        progressText.innerText =
                            `Converting page ${pageNum} of ${pdf.numPages}...`;

                        try {
                            const page = await pdf.getPage(pageNum);

                            // Increase scale for better image quality
                            const viewport = page.getViewport({ scale: 2 });

                            // Create canvas dynamically
                            const canvas = document.createElement("canvas");
                            canvas.width = viewport.width;
                            canvas.height = viewport.height;

                            // Render PDF page into canvas
                            await page.render({
                                canvasContext: canvas.getContext("2d"),
                                viewport
                            }).promise;

                            // Convert canvas to JPG base64 image
                            images.push(canvas.toDataURL("image/jpeg"));
                        } catch (pageError) {
                            console.error(`Error processing page ${pageNum}:`, pageError);
                            throw new Error(`Failed to convert page ${pageNum}. Please try a different PDF.`);
                        }
                    }

                    // Conversion completed successfully
                    progressText.innerText = "✅ Conversion Successful!";
                    progressText.style.color = "#059669";
                    spinner.classList.add("hidden");
                    setButtonState(true);

                    // Show download options
                    if (images.length === 1) {
                        downloadSingle.classList.remove("hidden");
                    } else if (images.length > 1) {
                        downloadZip.classList.remove("hidden");
                    }

                    // Change button text for next action
                    btnText.innerText = "Convert Another File";

                    // Reload page if clicked again
                    convertBtn.onclick = () => location.reload();
                } catch (error) {
                    progressText.classList.remove("hidden");
                    progressText.innerHTML = `❌ Error: ${error.message || 'Conversion failed. Please try another PDF.'}`;
                    progressText.style.color = "#dc2626";
                    console.error("PDF conversion error:", error);
                    spinner.classList.add("hidden");
                    setButtonState(true);
                }
            };

            // Read PDF file as ArrayBuffer
            fileReader.readAsArrayBuffer(pdfFile);
        } catch (error) {
            progressText.classList.remove("hidden");
            progressText.innerHTML = "❌ Error: An unexpected error occurred. Please try again.";
            progressText.style.color = "#dc2626";
            console.error("PDF to JPG conversion error:", error);
            spinner.classList.add("hidden");
            setButtonState(true);
        }
    });

    // --------------------------------------------------
    // Download Single Image
    // --------------------------------------------------
    downloadSingle.addEventListener("click", () => {

        const link = document.createElement("a");
        link.href = images[0];
        link.download = "converted.jpg";
        link.click();

        downloadMessage.classList.remove("hidden");
        downloadMessage.innerText = "✅ Download Successful!";
    });

    // --------------------------------------------------
    // Download All Images as ZIP
    // --------------------------------------------------
    downloadZip.addEventListener("click", async () => {

        const zip = new JSZip();

        // Add each image to ZIP file
        images.forEach((img, index) => {
            const base64Data = img.split(",")[1];

            zip.file(
                `page-${index + 1}.jpg`,
                base64Data,
                { base64: true }
            );
        });

        // Generate ZIP file as blob
        const content = await zip.generateAsync({ type: "blob" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "converted-images.zip";
        link.click();

        downloadMessage.classList.remove("hidden");
        downloadMessage.innerText = "✅ Download Successful!";
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