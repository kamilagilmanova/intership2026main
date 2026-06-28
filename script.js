document.addEventListener("DOMContentLoaded", () => {
  const dropzoneFile = document.getElementById("dropzone-file");
  const fileInput = document.getElementById("file-input");
  const linkCard = document.getElementById("option-link");
  const textCard = document.getElementById("option-text");

  const progressBar = document.getElementById("analysis-progress");
  const statusSubtitle = document.getElementById("status-subtitle");

  
  // === 1. ЗАГРУЗКА ФАЙЛА (КАРТИНКИ ИЛИ ТЕКСТА) ===
  if (dropzoneFile && fileInput) {
    dropzoneFile.addEventListener("click", (e) => {
      if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        
        const reader = new FileReader();
        reader.onload = function(e) {
          sessionStorage.setItem("uploadType", "file");
          sessionStorage.setItem("fileData", e.target.result);
          sessionStorage.setItem("fileName", file.name);
          sessionStorage.setItem("fileType", file.type);
          
          window.location.href = "index3.html";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // === 2. ВВОД ССЫЛКИ ===
  if (linkCard) {
    linkCard.addEventListener("click", () => {
      const link = prompt("Введите ссылку:");
      if (link && link.trim() !== "") {
        sessionStorage.setItem("uploadType", "text");
        sessionStorage.setItem("userContent", "Проанализируй материалы по ссылке: " + link);
        window.location.href = "index3.html";
      }
    });
  }

  // === 3. ВВОД ТЕКСТА ===
  if (textCard) {
    textCard.addEventListener("click", () => {
      const userText = prompt("Вставьте текст лекции:");
      if (userText && userText.trim() !== "") {
        sessionStorage.setItem("uploadType", "text");
        sessionStorage.setItem("userContent", userText.trim());
        window.location.href = "index3.html";
      }
    });
  }

  // === 4. ЭКРАН АНИМАЦИИ И ЗАПРОС К БЭКЕНДУ ===
  if (progressBar) {
    let progress = 0;
    const statusMessages = [
      "Сканируем содержимое...",
      "Распознаем текст и изображения...",
      "Генерируем конспект...",
      "Почти готово...",
    ];

    const interval = setInterval(() => {
      if (progress < 85) {
        progress += Math.random() * 5;
        progressBar.style.width = progress + "%";

        if (statusSubtitle) {
          if (progress < 25) statusSubtitle.innerText = statusMessages[0];
          else if (progress < 50) statusSubtitle.innerText = statusMessages[1];
          else if (progress < 75) statusSubtitle.innerText = statusMessages[2];
          else statusSubtitle.innerText = statusMessages[3];
        }
      }
    }, 250);

    const uploadType = sessionStorage.getItem("uploadType");
    const formData = new FormData();

    if (uploadType === "file") {
      const fileData = sessionStorage.getItem("fileData");
      const fileName = sessionStorage.getItem("fileName");
      const fileType = sessionStorage.getItem("fileType");
      
      const byteString = atob(fileData.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: fileType });
      
      formData.append("file", blob, fileName);
    } else {
      const userContent = sessionStorage.getItem("userContent") || "Тестовая лекция";
      const blob = new Blob([userContent], { type: "text/plain" });
      formData.append("file", blob, "lecture.txt");
    }

    fetch("http://127.0.0.1:8000/upload", {
      method: "POST",
      body: formData
    })
    .then(response => {
      if (!response.ok) throw new Error("Ошибка сервера бэкенда");
      return response.json();
    })
    .then(data => {
      clearInterval(interval);
      progressBar.style.width = "100%";
      if (statusSubtitle) statusSubtitle.innerText = "Готово!";

      localStorage.setItem("aiResult", JSON.stringify(data));

      setTimeout(() => {
        window.location.href = "index4.html";
      }, 700);
    })
    .catch(error => {
      clearInterval(interval);
      console.error("Ошибка запроса:", error);
      if (statusSubtitle) statusSubtitle.innerText = "Ошибка распознавания или работы ИИ.";
    });
  }

 // === 5. ВЫВОД РЕЗУЛЬТАТОВ НА INDEX4.HTML ===
  const summaryList = document.querySelector(".summary-list") || document.querySelector("ul");
  const tagsContainer = document.querySelector(".tags-container");
  
  const topicTextElement = document.querySelector(".left-card p, .card p") || document.querySelector(".result-card h3 + p");

  if (summaryList || tagsContainer || topicTextElement) {
    const aiDataRaw = localStorage.getItem("aiResult");
    
    if (aiDataRaw) {
      const aiData = JSON.parse(aiDataRaw);

      if (topicTextElement && aiData.topic) {
        topicTextElement.innerText = aiData.topic.toUpperCase();
      }

      if (summaryList && aiData.summary) {
        summaryList.innerHTML = ""; 
        aiData.summary.forEach(item => {
          const li = document.createElement("li");
          li.innerText = item;
          summaryList.appendChild(li);
        });
      }

      if (tagsContainer && aiData.terms) {
        tagsContainer.innerHTML = ""; 
        aiData.terms.forEach(term => {
          const span = document.createElement("span");
          span.className = "tag";
          span.innerText = term;
          tagsContainer.appendChild(span);
        });
      }
    }
  }
});