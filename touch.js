document.addEventListener("DOMContentLoaded", function() {
    const detailboxText = document.querySelector('.detailboxtext');
    const iconFrame = document.querySelector('.detailboxiconframe');
    const separatorIcon = document.querySelector('.detailboxseparator-icon');
    const detailboxFrame = document.querySelector('.detailboxframe');
    const MAX_LENGTH = 186; // Set the character limit

    if (!detailboxText || !iconFrame || !separatorIcon || !detailboxFrame) {
        console.error("Elements not found. Ensure '.detailboxtext', '.detailboxiconframe', '.detailboxseparator-icon', and '.detailboxframe' exist.");
        return;
    }

    // Set data-category initially to ensure it’s always present
    detailboxText.setAttribute('data-category', 'touch');

    function updateUI() {
        if (detailboxText.value.trim().length > 0 || document.activeElement === detailboxText) {
            iconFrame.src = './svg/detailboxiconframecolor.svg';
            separatorIcon.src = './svg/detailboxseparatoractive.svg';
            detailboxFrame.classList.add('active');  // Add active class to detailboxFrame
            detailboxText.setAttribute('data-id', detailboxText.value.trim()); // Update data-id with input content
        } else {
            iconFrame.src = './svg/detailboxiconframe.svg';
            separatorIcon.src = './svg/detailboxseparator.svg';
            detailboxFrame.classList.remove('active');  // Remove active class from detailboxFrame
            detailboxText.removeAttribute('data-id'); // Clear data-id if no content
        }
    }

    detailboxText.addEventListener('input', function() {
        let text = this.value;

        // Enforce character limit
        if (text.length > MAX_LENGTH) {
            text = text.slice(0, MAX_LENGTH); // Trim to max length
            this.value = text; // Set the trimmed value back to the textarea
        }

        // Adjust textarea height dynamically
        this.style.height = '20px';
        this.style.height = this.scrollHeight + 'px';

        // Update UI based on content
        updateUI();
    });

    detailboxText.addEventListener('focus', function() {
        this.placeholder = ''; // Remove placeholder on focus
        updateUI(); // Ensure UI is updated when focused
    });

    detailboxText.addEventListener('blur', function() {
        if (!this.value.trim()) {
            this.placeholder = 'Eg: A 90s mystery in Barcelona, a feel-good romance, or an inspiring true story';
        }
        updateUI(); // Reset UI when blurred
    });

    // Initial adjustment of the textarea height and icon/frame states
    detailboxText.style.height = detailboxText.scrollHeight + 'px';
    updateUI();
});