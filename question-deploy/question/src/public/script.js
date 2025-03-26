async function loadCategories() {
    try {
      const res = await fetch('/categories');
      const categories = await res.json();
      const select = document.getElementById('categorySelect');
      // Clear old
      while (select.options.length > 1) {
        select.remove(1);
      }
      // Add new
      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
      });
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }
  
  async function fetchQuestion() {
    const category = document.getElementById('categorySelect').value;
    const res = await fetch(`http://20.254.65.230:3002/question/${category}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      displayQuestion(data[0]);
    } else {
      document.getElementById('questionContainer').innerHTML = 'No questions found.';
    }
  }
  
  function displayQuestion(q) {
    const container = document.getElementById('questionContainer');
    container.innerHTML = `
      <h2>${q.question}</h2>
      <ul>
        ${q.answers.map((ans, idx) => `<li onclick="showAnswer(${q.correctIndex}, ${idx})">${ans}</li>`).join('')}
      </ul>
    `;
  }
  
  function showAnswer(correctIndex, clickedIndex) {
    alert(clickedIndex === correctIndex ? 'Correct!' : 'Incorrect!');
  }
  
  document.getElementById('fetchBtn').addEventListener('click', fetchQuestion);
  window.addEventListener('DOMContentLoaded', loadCategories);
  