function initAudioList(items) {
  const list = document.getElementById("questionList");
  if (!list) return;

  let currentAudio = null;
  let currentItem = null;
  let answerTimer = null;

  function clearAnswerTimer() {
    if (answerTimer) {
      clearTimeout(answerTimer);
      answerTimer = null;
    }
  }

  function stopCurrent() {
    clearAnswerTimer();

    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    if (currentItem) {
      currentItem.classList.remove("playing");
      currentItem = null;
    }
  }

  function tryPlayAnswerAudio(answerAudioPath, element) {
    if (!answerAudioPath) {
      element.classList.remove("playing");
      currentAudio = null;
      currentItem = null;
      return;
    }

    const answerAudio = new Audio(answerAudioPath);

    answerAudio.addEventListener("canplaythrough", () => {
      if (currentItem !== element) return;
      currentAudio = answerAudio;
      answerAudio.play().catch(() => {});
    }, { once: true });

    answerAudio.addEventListener("ended", () => {
      if (currentItem === element) {
        element.classList.remove("playing");
        currentAudio = null;
        currentItem = null;
      }
    });

    answerAudio.addEventListener("error", () => {
      if (currentItem === element) {
        element.classList.remove("playing");
        currentAudio = null;
        currentItem = null;
      }
    });

    answerAudio.load();
  }

  function playQuestion(item, element) {
    if (!item.audio) return;

    if (currentAudio && currentAudio.src.endsWith(item.audio) && !currentAudio.paused) {
      return;
    }

    stopCurrent();

    const audio = new Audio(item.audio);
    currentAudio = audio;
    currentItem = element;
    element.classList.add("playing");

    audio.addEventListener("ended", () => {
      if (item.answerAudio && currentItem === element) {
        answerTimer = setTimeout(() => {
          tryPlayAnswerAudio(item.answerAudio, element);
        }, 1500);
      } else {
        element.classList.remove("playing");
        currentAudio = null;
        currentItem = null;
      }
    });

    audio.addEventListener("error", () => {
      element.classList.remove("playing");
      currentAudio = null;
      currentItem = null;
    });

    audio.play().catch(() => {
      element.classList.remove("playing");
      currentAudio = null;
      currentItem = null;
    });
  }

  items.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "qa-item";

    const left = document.createElement("div");
    left.className = "qa-question";

    const num = document.createElement("div");
    num.className = "item-num";
    num.textContent = idx + 1;

    const qText = document.createElement("div");
    qText.className = "item-text";
    qText.textContent = item.text || "";

    left.appendChild(num);
    left.appendChild(qText);

    const right = document.createElement("div");
    right.className = "qa-answer";

    const aText = document.createElement("div");
    aText.className = "item-answer";
    aText.innerHTML = item.answer
      ? item.answer.replace(/\n/g, "<br>")
      : "";

    right.appendChild(aText);

    row.appendChild(left);
    row.appendChild(right);

    let hoverTimer = null;

    row.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(() => playQuestion(item, row), 120);
    });

    row.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
    });

    row.addEventListener("click", () => {
      playQuestion(item, row);
    });

    list.appendChild(row);
  });
}