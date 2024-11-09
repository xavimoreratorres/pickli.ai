document.addEventListener("DOMContentLoaded", function() {
  const input = document.getElementById('textInput');
  const container = document.getElementById('excludeTypeTag');
  const addIcon = document.getElementById('addIcon');
  const tagsContainer = document.getElementById('tagsContainer');
  const MAX_LENGTH = 200;
  const MAX_TAGS = 3; // Maximum number of tags

  function updateUI() {
      // Check if input has text and max tags are not reached
      if (input.textContent.trim().length > 0 && tagsContainer.children.length < MAX_TAGS) {
          container.classList.add('active');
          addIcon.style.display = 'block';
          input.classList.remove('default-text');
          input.classList.add('active-text');
      } else {
          container.classList.remove('active');
          addIcon.style.display = 'none';
          input.classList.remove('active-text');
          input.classList.add('default-text');
      }
  }

  function checkMaxTags() {
      // Check the number of tags and update the visibility of the add icon
      if (tagsContainer.children.length >= MAX_TAGS) {
          addIcon.style.display = 'none';
      } else if (input.textContent.trim().length > 0) {
          // Show the add icon only if there’s text in the input
          addIcon.style.display = 'block';
      }
  }

  function createTag(text) {
      const tag = document.createElement('div');
      tag.classList.add('excludetag2');

      // Set data attributes for the tag
      tag.setAttribute('data-category', 'exclusion');
      tag.setAttribute('data-id', `${text}-excludetag21`);

      const tagText = document.createElement('div');
      tagText.classList.add('excludetag21');
      tagText.textContent = text;

      const closeIcon = document.createElement('img');
      closeIcon.classList.add('close-icon');
      closeIcon.src = './svg/Close.svg';
      closeIcon.alt = 'Close';

      closeIcon.addEventListener('click', () => {
          tag.remove();
          checkMaxTags(); // Recheck max tags when a tag is removed
          updateUI(); // Update UI in case add icon should reappear
      });

      tag.appendChild(tagText);
      tag.appendChild(closeIcon);
      tagsContainer.appendChild(tag);
      checkMaxTags(); // Check max tags after adding a new tag
  }

  input.addEventListener('beforeinput', function(event) {
      if (input.textContent.length >= MAX_LENGTH && event.inputType !== 'deleteContentBackward') {
          event.preventDefault();
      }
  });

  input.addEventListener('input', function() {
      if (input.textContent.length > MAX_LENGTH) {
          input.textContent = input.textContent.substring(0, MAX_LENGTH);

          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(input);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
      }

      updateUI();
  });

  addIcon.addEventListener('click', function() {
      const text = input.textContent.trim();
      if (text.length > 0 && tagsContainer.children.length < MAX_TAGS) {
          createTag(text);
          input.textContent = ''; // Clear input after adding the tag
          updateUI(); // Reset UI
      }
  });

  // Trigger add icon on Enter key press
  input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
          event.preventDefault(); // Prevents new line in the input
          const text = input.textContent.trim();
          if (text.length > 0 && tagsContainer.children.length < MAX_TAGS) {
              createTag(text);
              input.textContent = ''; // Clear input after adding the tag
              updateUI(); // Reset UI
          }
      }
  });

  // Initial update of the UI
  updateUI();
});
