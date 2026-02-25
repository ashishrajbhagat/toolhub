const counters = document.querySelectorAll(".counter");

const startCounter = (counter) => {
    const target = +counter.getAttribute("data-target");
    let count = 0;
    const increment = target / 100;

    const updateCounter = () => {
        if (count < target) {
            count += increment;
            counter.innerText = Math.ceil(count);
            setTimeout(updateCounter, 20);
        } else {
            counter.innerText = target + (target >= 1000 ? "+" : "");
        }
    };

    updateCounter();
};

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                startCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.5 }
);

counters.forEach((counter) => {
    observer.observe(counter);
});
