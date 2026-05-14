document.addEventListener("DOMContentLoaded", () => {
  const dropzoneFile = document.getElementById("dropzone-file");
  const fileInput = document.getElementById("file-input");
  const selectBtn = document.getElementById("btn-select-file");
  const linkCard = document.getElementById("option-link");
  const textCard = document.getElementById("option-text");

  const progressBar = document.getElementById("analysis-progress");
  const statusSubtitle = document.getElementById("status-subtitle");

  if (dropzoneFile) {
    dropzoneFile.addEventListener("click", (e) => {
      if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        window.location.href = "index3.html";
      }
    });
  }

  if (linkCard) {
    linkCard.addEventListener("click", () => {
      if (prompt("Введите ссылку:")) window.location.href = "index3.html";
    });
  }

  if (textCard) {
    textCard.addEventListener("click", () => {
      if (prompt("Вставьте текст:")) window.location.href = "index3.html";
    });
  }

  if (progressBar) {
    let progress = 0;
    const statusMessages = [
      "Сканируем содержимое...",
      "Извлекаем термины...",
      "Генерируем конспект...",
      "Почти готово...",
    ];

    const interval = setInterval(() => {
      progress += Math.random() * 7;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        if (statusSubtitle) statusSubtitle.innerText = "Готово!";
        setTimeout(() => {
          window.location.href = "index4.html";
        }, 800);
      }

      progressBar.style.width = progress + "%";

      if (statusSubtitle) {
        if (progress < 30) statusSubtitle.innerText = statusMessages[0];
        else if (progress < 60) statusSubtitle.innerText = statusMessages[1];
        else if (progress < 90) statusSubtitle.innerText = statusMessages[2];
        else statusSubtitle.innerText = statusMessages[3];
      }
    }, 250);
  }
});

const btnQuiz = document.querySelector(".btn-quiz");
if (btnQuiz) {
  btnQuiz.addEventListener("click", () => {
    window.location.href = "index5.html";
  });
}

async function loadQuiz() {
    const response = await fetch('http://127.0.0.1:5000/get-quiz');
    const data = await response.json();

    const questionElement = document.querySelector('.quiz-question');
    
    questionElement.innerText = data.question;
    
}