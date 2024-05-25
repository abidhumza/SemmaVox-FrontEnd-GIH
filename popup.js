const speakText = (text, voiceName) => {
  const utterance = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find((voice) => voice.name === voiceName);

  utterance.voice = selectedVoice;
  window.speechSynthesis.speak(utterance);
};

document.getElementById("summarizeButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: function () {
          const extractMainContent = () => {
            // Remove <header> elements
            const headers = document.querySelectorAll("header");
            headers.forEach((header) => header.remove());

            let mainContent = "";
            const mainContentElement = document.querySelector("main");
            if (mainContentElement) {
              mainContent = mainContentElement.innerText;
            } else {
              mainContent = document.body.innerText;
            }

            const summary = mainContent.split(" ").slice(0, 250).join(" ");
            return summary;
          };

          return extractMainContent();
        },
      },
      (results) => {
        const summary = results[0].result;
        document.getElementById("summary").innerText = summary;
        document.getElementById("summary").style.display = "block"; // Show summary div

        // Hide the summarize button
        document.getElementById("summarizeButton").style.display = "none";

        // Enable and show the necessary elements
        document.getElementById("readAloudButton").disabled = false;
        document.getElementById("readAloudButton").style.display =
          "inline-block";
        document.getElementById("voiceSelect").disabled = false;
        document.getElementById("voiceSelect").style.display = "inline-block";
        document.getElementById("pauseButton").disabled = false;
        document.getElementById("resumeButton").disabled = false;
        document.getElementById("pauseButton").style.display = "inline-block";
        document.getElementById("resumeButton").style.display = "inline-block";
      }
    );
  });
});

// Add event listener to read aloud button
document.getElementById("readAloudButton").addEventListener("click", () => {
  const summary = document.getElementById("summary").innerText;
  const selectedVoice = document.getElementById("voiceSelect").value;
  speakText(summary, selectedVoice); // Call speakText function with summary and selectedVoice
});

// Add event listener to pause button
document.getElementById("pauseButton").addEventListener("click", () => {
  window.speechSynthesis.pause(); // Pause speech synthesis
});

// Add event listener to resume button
document.getElementById("resumeButton").addEventListener("click", () => {
  window.speechSynthesis.resume(); // Resume speech synthesis
});

// Populate voice list
function populateVoiceList() {
  if (typeof speechSynthesis === "undefined") {
    return;
  }

  const voices = speechSynthesis.getVoices();
  const voiceSelect = document.getElementById("voiceSelect");
  voiceSelect.innerHTML = "";

  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.textContent = `${voice.name} (${voice.lang})`;
    option.value = voice.name;
    voiceSelect.appendChild(option);
  });
}

populateVoiceList();

if (
  typeof speechSynthesis !== "undefined" &&
  speechSynthesis.onvoiceschanged !== undefined
) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}
