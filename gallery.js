let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}
function scrollGallery(direction) {
    const gallery = document.querySelector('.gallery-container');
    const scrollAmount = gallery.clientWidth * 0.8; // Scroll by 80% of the container width
    gallery.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}
function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    let dots = document.getElementsByClassName("dot");
    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}
// Lightbox functionality
document.querySelectorAll('.gallery-item img').forEach(image => {
    image.addEventListener('click', () => {
        const lightbox = document.createElement('div');
        lightbox.classList.add('lightbox');
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${image.src}" alt="${image.alt}">
                <p>${image.nextElementSibling.textContent}</p>
            </div>
        `;
        document.body.appendChild(lightbox);

        // Close lightbox on click
        lightbox.addEventListener('click', () => {
            lightbox.remove();
        });
    });
});