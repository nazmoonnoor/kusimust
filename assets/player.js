function initAudioList(items) {
  const list = document.getElementById("questionList");
  if (!list) return;

  const controlsHost =
    document.getElementById("audioControls") ||
    (() => {
      const div = document.createElement("div");
      div.id = "audioControls";
      div.className = "audio-controls";
      list.parentNode.insertBefore(div, list);
      return div;
    })();

  let currentAudio = null;
  let currentItem = null;

  let isSequencePlaying = false;
  let stopSequenceRequested = false;

  let playAllBtn = null;
  let progressRange = null;
  let progressLabel = null;

  let currentSequenceIndex = 0;
  let pendingJumpIndex = null;
  let isUserDraggingProgress = false;

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (currentItem) {
      currentItem.classList.remove("playing");
      currentItem.classList.remove("question-playing");
      currentItem.classList.remove("answer-playing");
      currentItem = null;
    }
  }

  function setSequenceButtonState() {
    if (!playAllBtn) return;
    playAllBtn.textContent = isSequencePlaying ? "⏹ Stop all" : "▶ Play all";
  }

  function updateProgressUi(index = 0) {
    if (!progressRange || !progressLabel) return;

    const safeIndex = Math.max(0, Math.min(items.length - 1, index));

    if (!isUserDraggingProgress) {
      progressRange.value = safeIndex;
    }

    progressLabel.textContent = `${safeIndex + 1} / ${items.length}`;
  }

  function scrollToItem(element) {
    if (!element) return;
    element.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function highlightItem(element, mode) {
    if (!element) return;
    element.classList.add("playing");
    element.classList.remove("question-playing", "answer-playing");
    element.classList.add(mode === "answer" ? "answer-playing" : "question-playing");
  }

  function clearHighlight(element) {
    if (!element) return;
    element.classList.remove("playing", "question-playing", "answer-playing");
  }

  function playSingleAudio(audioPath, element, mode = "question") {
    return new Promise((resolve) => {
      stopCurrent();

      if (!audioPath) {
        resolve(false);
        return;
      }

      const audio = new Audio(audioPath);
      currentAudio = audio;
      currentItem = element;

      highlightItem(element, mode);

      audio.addEventListener("ended", () => {
        if (currentItem === element) {
          clearHighlight(element);
        }
        if (currentAudio === audio) currentAudio = null;
        if (currentItem === element) currentItem = null;
        resolve(true);
      });

      audio.addEventListener("error", () => {
        if (currentItem === element) {
          clearHighlight(element);
        }
        if (currentAudio === audio) currentAudio = null;
        if (currentItem === element) currentItem = null;
        resolve(false);
      });

      audio.play().catch(() => {
        if (currentItem === element) {
          clearHighlight(element);
        }
        if (currentAudio === audio) currentAudio = null;
        if (currentItem === element) currentItem = null;
        resolve(false);
      });
    });
  }

  async function playItemSequence(item, element) {
    if (stopSequenceRequested) return;
    if (pendingJumpIndex !== null) return;

    await playSingleAudio(item.audio, element, "question");
    if (stopSequenceRequested || pendingJumpIndex !== null) return;

    await wait(1000); // gap between question and answer
    if (stopSequenceRequested || pendingJumpIndex !== null) return;

    if (item.answerAudio) {
      await playSingleAudio(item.answerAudio, element, "answer");
      if (stopSequenceRequested || pendingJumpIndex !== null) return;
    }

    await wait(1500); // gap before next item
  }

  async function playAllSequentially(startIndex = 0) {
    if (isSequencePlaying) return;

    isSequencePlaying = true;
    stopSequenceRequested = false;
    pendingJumpIndex = null;
    currentSequenceIndex = startIndex;

    setSequenceButtonState();
    updateProgressUi(currentSequenceIndex);

    while (currentSequenceIndex < items.length) {
      if (stopSequenceRequested) break;

      const row = list.children[currentSequenceIndex];
      updateProgressUi(currentSequenceIndex);
      scrollToItem(row);

      await playItemSequence(items[currentSequenceIndex], row);

      if (stopSequenceRequested) break;

      if (pendingJumpIndex !== null) {
        currentSequenceIndex = pendingJumpIndex;
        pendingJumpIndex = null;
        stopCurrent();
        continue;
      }

      currentSequenceIndex += 1;
    }

    stopCurrent();
    isSequencePlaying = false;
    stopSequenceRequested = false;
    pendingJumpIndex = null;

    if (currentSequenceIndex >= items.length) {
      currentSequenceIndex = items.length - 1;
    }

    updateProgressUi(currentSequenceIndex);
    setSequenceButtonState();
  }

  function stopAllSequentially() {
    stopSequenceRequested = true;
    pendingJumpIndex = null;
    stopCurrent();
    isSequencePlaying = false;
    setSequenceButtonState();
  }

  function jumpToIndex(index) {
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    currentSequenceIndex = safeIndex;
    updateProgressUi(safeIndex);

    const row = list.children[safeIndex];
    scrollToItem(row);

    if (isSequencePlaying) {
      pendingJumpIndex = safeIndex;
      stopCurrent();
    }
  }

  playAllBtn = document.createElement("button");
  playAllBtn.type = "button";
  playAllBtn.className = "play-all-btn";
  playAllBtn.textContent = "▶ Play all";

  const progressWrap = document.createElement("div");
  progressWrap.className = "progress-wrap";

  progressRange = document.createElement("input");
  progressRange.type = "range";
  progressRange.className = "play-progress";
  progressRange.min = "0";
  progressRange.max = String(Math.max(items.length - 1, 0));
  progressRange.step = "1";
  progressRange.value = "0";

  progressLabel = document.createElement("div");
  progressLabel.className = "progress-label";
  progressLabel.textContent = `1 / ${items.length}`;

  playAllBtn.addEventListener("click", () => {
    if (isSequencePlaying) {
      stopAllSequentially();
    } else {
      playAllSequentially(currentSequenceIndex || 0);
    }
  });

  progressRange.addEventListener("mousedown", () => {
    isUserDraggingProgress = true;
  });

  progressRange.addEventListener("touchstart", () => {
    isUserDraggingProgress = true;
  });

  progressRange.addEventListener("input", () => {
    const value = Number(progressRange.value);
    progressLabel.textContent = `${value + 1} / ${items.length}`;
  });

  progressRange.addEventListener("change", () => {
    const value = Number(progressRange.value);
    isUserDraggingProgress = false;
    jumpToIndex(value);
  });

  progressRange.addEventListener("mouseup", () => {
    isUserDraggingProgress = false;
  });

  progressRange.addEventListener("touchend", () => {
    isUserDraggingProgress = false;
  });

  progressWrap.appendChild(progressRange);
  progressWrap.appendChild(progressLabel);

  controlsHost.appendChild(playAllBtn);
  controlsHost.appendChild(progressWrap);

  items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "item";

const questionTranslationHtml = item.textTranslation
  ? `<div class="item-translation">${item.textTranslation}</div>`
  : "";

const answerHtml = item.answer
  ? `
    <div class="item-answer">${item.answer}</div>
    ${item.answerTranslation ? `<div class="item-translation">${item.answerTranslation}</div>` : ""}
  `
  : "";

div.innerHTML = `
  <div class="item-num">${idx + 1}</div>
  <div class="item-content">
      <div class="item-text">${item.text}</div>
      ${questionTranslationHtml}
      ${answerHtml}
  </div>
`;

    let hoverTimer = null;

    div.addEventListener("mouseenter", () => {
      if (isSequencePlaying) return;
      hoverTimer = setTimeout(() => {
        playSingleAudio(item.audio, div, "question");
      }, 120);
    });

    div.addEventListener("mouseleave", () => clearTimeout(hoverTimer));

    div.addEventListener("click", async () => {
      if (isSequencePlaying) return;

      currentSequenceIndex = idx;
      updateProgressUi(idx);

      await playSingleAudio(item.audio, div, "question");
      await wait(1000);

      if (item.answerAudio) {
        await playSingleAudio(item.answerAudio, div, "answer");
      }
    });

    list.appendChild(div);
  });

  updateProgressUi(0);
}