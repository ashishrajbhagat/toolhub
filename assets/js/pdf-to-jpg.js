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

        // Update UI after file selection
        uploadMessage.classList.remove("hidden");
        convertBtn.classList.remove("hidden");

        progressText.classList.add("hidden");
        downloadSingle.classList.add("hidden");
        downloadZip.classList.add("hidden");
    });

    // --------------------------------------------------
    // Convert PDF Pages to JPG Images
    // --------------------------------------------------
    convertBtn.addEventListener("click", async () => {

        // Prevent execution if no file selected
        if (!pdfFile) return;

        // Reset UI
        progressText.classList.remove("hidden");
        progressText.innerText = "Preparing file...";
        downloadSingle.classList.add("hidden");
        downloadZip.classList.add("hidden");

        // Start loading state
        btnText.innerText = "Converting...";
        spinner.classList.remove("hidden");
        setButtonState(false);

        const fileReader = new FileReader();

        // When file reading is complete
        fileReader.onload = async function () {

            // Convert ArrayBuffer to typed array
            const typedarray = new Uint8Array(this.result);

            // Load PDF document using pdf.js
            const pdf = await pdfjsLib.getDocument(typedarray).promise;

            images = []; // Reset images array

            // Loop through each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

                progressText.innerText =
                    `Converting page ${pageNum} of ${pdf.numPages}...`;

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
            }

            // Conversion completed successfully
            progressText.innerText = "✅ Conversion Successful!";
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
        };

        // Read PDF file as ArrayBuffer
        fileReader.readAsArrayBuffer(pdfFile);
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
            icon.textContent = content.classList.contains("hidden") ? "+" : "−";
        });
    });

});