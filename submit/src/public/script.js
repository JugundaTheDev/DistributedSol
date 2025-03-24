async function loadCategories() {
    try {
      const res = await fetch('/categories');
      if (!res.ok) {
        throw new Error('Failed to fetch categories');
      }
      const categories = await res.json();
      const select = document.getElementById('categorySelect');
      // Clear old options except the first
      while (select.options.length > 1) {
        select.remove(1);
      }
      // Populate new categories
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
    } catch (err) {
      alert('Error loading categories: ' + err.message);
    }
  }
  
  // This function sends the question, answers, correctIndex, category
  // to "/submit" via a POST request
  async function submitQuestion() {
    const question = document.getElementById('questionInput').value.trim();
    const answer0 = document.getElementById('answer0').value.trim();
    const answer1 = document.getElementById('answer1').value.trim();
    const answer2 = document.getElementById('answer2').value.trim();
    const answer3 = document.getElementById('answer3').value.trim();
  
    // Check which radio button is checked
    const correctIndex = document.querySelector('input[name="correctIndex"]:checked').value;
    const category = document.getElementById('categorySelect').value;
    const newCategory = document.getElementById('newCategoryInput').value.trim();
  
    // Validate required fields
    if (!question || !answer0 || !answer1 || !answer2 || !answer3) {
      alert('Please fill in all fields');
      return;
    }
  
    // Build the request body
    const body = {
      question,
      answers: [answer0, answer1, answer2, answer3],
      correctIndex: parseInt(correctIndex, 10),
      category,
      newCategory
    };
  
    try {
      const res = await fetch('/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Error: ' + data.error);
      } else {
        alert('Question submitted successfully!');
      }
    } catch (err) {
      alert('Failed to submit question: ' + err.message);
    }
  }
  
  // Attach event listeners when the page loads
  document.getElementById('submitBtn').addEventListener('click', submitQuestion);
  window.addEventListener('DOMContentLoaded', loadCategories);