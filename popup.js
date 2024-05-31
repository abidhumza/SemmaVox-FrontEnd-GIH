// Default speech rate
let currentRate = 1;

// Function to speak text using SpeechSynthesisUtterance
const speakText = (text, voiceName, rate = 1) => {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find((voice) => voice.name === voiceName);

  utterance.voice = selectedVoice;
  utterance.rate = rate; // Set the speech rate
  window.speechSynthesis.speak(utterance);
};

// Function to format text into a single paragraph
const formatText = (text) => {
  return text.replace(/\n/g, " ");
};

// Function called when summarize button is clicked
const onSummarizeClick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          return Array.from(document.querySelectorAll("p"))
            .map((p) => p.innerText)
            .join("\n");
        },
      },
      async (results) => {
        const content = formatText(results[0].result);
        console.log("Extracted content:", content); // Debugging

        try {
          const response = await fetch("http://127.0.0.1:3000/summarize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: content }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Response data:", data); // Debugging

          const summaryDiv = document.getElementById("summary");
          summaryDiv.innerHTML = data.summary;
          summaryDiv.style.display = "block";

          // Update UI elements visibility and state
          document.getElementById("summarizeButton").style.display = "none";
          document.getElementById("readAloudButton").disabled = false;
          document.getElementById("readAloudButton").style.display =
            "inline-block";
          document.getElementById("voiceSelect").disabled = false;
          document.getElementById("voiceSelect").style.display = "inline-block";
          document.getElementById("pauseButton").disabled = false;
          document.getElementById("resumeButton").disabled = false;
          document.getElementById("pauseButton").style.display = "inline-block";
          document.getElementById("resumeButton").style.display =
            "inline-block";
          document.getElementById("fastForwardButton").disabled = false;
          document.getElementById("fastForwardButton").style.display =
            "inline-block";
          document.getElementById("downloadButton").style.display =
            "inline-block";
          document.getElementById("searchButton").style.display =
            "inline-block";
          document.getElementById("searchInput").style.display = "inline-block";
        } catch (error) {
          console.error("Error during fetch:", error); // Debugging
          alert("There was an error fetching the summary. Please try again.");
        }
      }
    );
  });
};

// Add event listener to summarize button
document
  .getElementById("summarizeButton")
  .addEventListener("click", onSummarizeClick);

// Event listener for read aloud button
document.getElementById("readAloudButton").addEventListener("click", () => {
  const summary = document.getElementById("summary").innerText;
  const selectedVoice = document.getElementById("voiceSelect").value;
  speakText(summary, selectedVoice, currentRate);
});

// Event listener for pause button
document.getElementById("pauseButton").addEventListener("click", () => {
  window.speechSynthesis.pause();
});

// Event listener for resume button
document.getElementById("resumeButton").addEventListener("click", () => {
  window.speechSynthesis.resume();
});

// Event listener for fast forward button
document.getElementById("fastForwardButton").addEventListener("click", () => {
  currentRate += 0.5;
  const summary = document.getElementById("summary").innerText;
  const selectedVoice = document.getElementById("voiceSelect").value;
  window.speechSynthesis.cancel();
  speakText(summary, selectedVoice, currentRate);
});

// Event listener for download button
document.getElementById("downloadButton").addEventListener("click", () => {
  const summary = document.getElementById("summary").innerText;
  download("summary.txt", summary);
});

// Event listener for search button
document.getElementById("searchButton").addEventListener("click", () => {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const summaryDiv = document.getElementById("summary");
  const summaryText = summaryDiv.innerText;

  // Reset previous highlighting
  summaryDiv.innerHTML = summaryText;

  // Highlight search term in summary
  const regex = new RegExp(searchTerm, "gi");
  const matches = summaryText.match(regex);

  if (matches) {
    matches.forEach((match) => {
      const replacedHTML = summaryDiv.innerHTML.replace(
        new RegExp(match, "gi"),
        `<span class="highlight">${match}</span>`
      );
      summaryDiv.innerHTML = replacedHTML;
    });
  }
});

// Function to download text content
const download = (filename, text) => {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Function to populate the voice selection dropdown
const populateVoiceList = () => {
  if (typeof speechSynthesis === "undefined") return;

  const voices = speechSynthesis.getVoices();
  const voiceSelect = document.getElementById("voiceSelect");
  voiceSelect.innerHTML = "";

  // Add voices to the dropdown
  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.textContent = `${voice.name} (${voice.lang})`;
    option.value = voice.name;
    voiceSelect.appendChild(option);
  });
};

// Initial population of voice list
populateVoiceList();

// Update voice list when voices change
if (
  typeof speechSynthesis !== "undefined" &&
  speechSynthesis.onvoiceschanged !== undefined
) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}