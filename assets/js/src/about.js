try {
    // Get all counter elements
    const counters = document.querySelectorAll(".counter");

    // Validate that counter elements exist
    if (!counters || counters.length === 0) {
        console.warn("No counter elements found on this page");
    } else {
        /**
         * Start counter animation for a specific counter element
         * @param {HTMLElement} counter - The counter element to animate
         */
        const startCounter = (counter) => {
            try {
                // Get target value from data attribute
                const targetStr = counter.getAttribute("data-target");
                
                // Validate that data-target exists and is a valid number
                if (!targetStr || isNaN(Number(targetStr))) {
                    console.error("Counter element missing valid data-target attribute", counter);
                    return;
                }

                const target = +targetStr;
                let count = 0;
                const increment = target / 100;
                let timeoutId;

                const updateCounter = () => {
                    try {
                        if (count < target) {
                            count += increment;
                            counter.innerText = Math.ceil(count);
                            // Store timeout ID to allow cleanup
                            timeoutId = setTimeout(updateCounter, 20);
                        } else {
                            counter.innerText = target + (target >= 1000 ? "+" : "");
                        }
                    } catch (updateError) {
                        console.error("Error updating counter:", updateError);
                        // Clear timeout on error
                        if (timeoutId) clearTimeout(timeoutId);
                    }
                };

                updateCounter();
            } catch (counterError) {
                console.error("Error starting counter animation:", counterError);
            }
        };

        // Initialize Intersection Observer with error handling
        try {
            const observer = new IntersectionObserver(
                (entries) => {
                    try {
                        entries.forEach((entry) => {
                            try {
                                if (entry.isIntersecting && entry.target) {
                                    startCounter(entry.target);
                                    observer.unobserve(entry.target);
                                }
                            } catch (entryError) {
                                console.error("Error processing intersection entry:", entryError);
                            }
                        });
                    } catch (entriesError) {
                        console.error("Error in intersection observer callback:", entriesError);
                    }
                },
                { threshold: 0.5 }
            );

            // Observe each counter element
            counters.forEach((counter) => {
                try {
                    if (counter && counter instanceof HTMLElement) {
                        observer.observe(counter);
                    } else {
                        console.warn("Invalid counter element:", counter);
                    }
                } catch (observeError) {
                    console.error("Error observing counter element:", observeError);
                }
            });
        } catch (observerError) {
            console.error("Error initializing intersection observer:", observerError);
            
            // Fallback: run counters immediately if observer fails
            console.warn("Intersection Observer failed. Running counters immediately as fallback.");
            try {
                counters.forEach((counter) => {
                    try {
                        startCounter(counter);
                    } catch (fallbackError) {
                        console.error("Error in fallback counter execution:", fallbackError);
                    }
                });
            } catch (fallbackAllError) {
                console.error("Error in fallback counter loop:", fallbackAllError);
            }
        }
    }
} catch (mainError) {
    console.error("Error initializing counter animations:", mainError);
}
