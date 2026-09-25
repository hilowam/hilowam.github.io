/* =========================================================
   HiLo-WAM project page
   ========================================================= */

(function () {
  /* ---------------------------
     Mobile navigation
     --------------------------- */
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("navLinks");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------
     BibTeX copy
     --------------------------- */
  const copyButton = document.getElementById("copyBibtex");
  const bibtexText = document.getElementById("bibtexText");

  if (copyButton && bibtexText) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(bibtexText.textContent);
        const original = copyButton.textContent;

        copyButton.textContent = "Copied";

        setTimeout(() => {
          copyButton.textContent = original;
        }, 1300);
      } catch (error) {
        copyButton.textContent = "Copy failed";
      }
    });
  }

  /* ---------------------------
     Real-robot video speed control

     Default speed = 2x.
     Buttons set the speed for ALL real-robot videos so
     side-by-side comparisons stay consistent.
     --------------------------- */
  const robotVideos = Array.from(document.querySelectorAll(".robot-video"));
  const speedButtons = Array.from(document.querySelectorAll(".speed-button"));

  let currentPlaybackRate = 2.0;

  function setPlaybackRate(rate) {
    const safeRate = Number(rate);

    if (!Number.isFinite(safeRate) || safeRate <= 0) {
      return;
    }

    currentPlaybackRate = safeRate;

    robotVideos.forEach((video) => {
      video.defaultPlaybackRate = safeRate;
      video.playbackRate = safeRate;
    });

    speedButtons.forEach((button) => {
      const buttonRate = Number(button.dataset.speed);
      const active = Math.abs(buttonRate - safeRate) < 1e-6;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  /* Apply 2x as soon as each video's metadata is available. */
  robotVideos.forEach((video) => {
    video.defaultPlaybackRate = currentPlaybackRate;
    video.playbackRate = currentPlaybackRate;

    video.addEventListener("loadedmetadata", () => {
      video.defaultPlaybackRate = currentPlaybackRate;
      video.playbackRate = currentPlaybackRate;
    });

    /*
      Some browsers can change playbackRate through their native
      video controls. When playback restarts, we keep the user's
      global website selection consistent.
    */
    video.addEventListener("play", () => {
      if (Math.abs(video.playbackRate - currentPlaybackRate) > 1e-6) {
        video.playbackRate = currentPlaybackRate;
      }
    });
  });

  speedButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("active"))
    );

    button.addEventListener("click", () => {
      setPlaybackRate(button.dataset.speed);
    });
  });

  setPlaybackRate(currentPlaybackRate);
})();
