// Define hardcoded data-id values for each format option
const dataIdMapping = {
    "Movie": "movie",  // Hardcoded ID for Movie
    "TV show": "series"  // Hardcoded ID for TV show
  };
  
  // Function to handle format-option clicks
  document.querySelectorAll('.format-option').forEach(option => {
    option.addEventListener('click', () => {
      // Remove "clicked" class and data-id attribute from all format options
      document.querySelectorAll('.format-option').forEach(opt => {
        opt.classList.remove('clicked');
        opt.removeAttribute('data-id');
        opt.querySelector('.formattagtext').classList.remove('clicked');
      });
      
      // Add "clicked" class to the selected option and its text
      option.classList.add('clicked');
      option.querySelector('.formattagtext').classList.add('clicked');
      
      // Retrieve the text inside the clicked option
      const text = option.querySelector('.formattagtext').innerText;
      
      // Set the hardcoded data-id based on the mapping
      if (dataIdMapping[text]) {
        option.setAttribute('data-category', 'showtype');
        option.setAttribute('data-id', dataIdMapping[text]);
      }
    });
  });
  