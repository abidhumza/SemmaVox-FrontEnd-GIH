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

// Function to extract main content from the webpage
const extractMainContent = () => {
  let mainContent = "";

  // Select main content element or fall back to the body
  const mainContentElement = document.querySelector("main") || document.body;
  const extractContent = mainContentElement.querySelectorAll(
    "p, h1, h2, h3, h4, h5, h6"
  );

  // Extract text from selected elements
  extractContent.forEach((element) => {
    mainContent += element.innerText + " ";
  });

  // Extract sentences from main content
  const extractSentences = (text) => text.match(/[^\.!\?]+[\.!\?]+/g) || [];
  const sentences = extractSentences(mainContent);
  const totalSentences = sentences.length;

  // Minimum words required for summary
  const minWords = 300;
  let summaryWords = 0;
  const summarySentences = [];

  // Function to add sentence to summary
  const addSentenceToSummary = (sentence, summaryArray) => {
    summaryArray.push(sentence);
    summaryWords += sentence.split(" ").length;
  };

  // Add key sentences from start, middle, and end
  if (totalSentences > 0) addSentenceToSummary(sentences[0], summarySentences);
  if (totalSentences > 4)
    addSentenceToSummary(
      sentences[Math.floor(totalSentences / 2)],
      summarySentences
    );
  if (totalSentences > 1)
    addSentenceToSummary(sentences[totalSentences - 1], summarySentences);

  // Add random sentences to meet word count
  while (summaryWords < minWords && summarySentences.length < totalSentences) {
    const randomIndex = Math.floor(Math.random() * totalSentences);
    const sentence = sentences[randomIndex];
    if (!summarySentences.includes(sentence)) {
      addSentenceToSummary(sentence, summarySentences);
    }
  }

  // Format summary sentences as HTML div elements
  return summarySentences.map((sentence) => `<div>${sentence}</div>`).join("");
};

// Function called when summarize button is clicked
const onSummarizeClick = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: extractMainContent,
      },
      (results) => {
        const summary = results[0].result;
        const summaryDiv = document.getElementById("summary");
        summaryDiv.innerHTML = summary;
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
        document.getElementById("resumeButton").style.display = "inline-block";
        document.getElementById("fastForwardButton").disabled = false;
        document.getElementById("fastForwardButton").style.display =
          "inline-block";
        document.getElementById("downloadButton").style.display =
          "inline-block";
        document.getElementById("searchButton").style.display = "inline-block";
        document.getElementById("searchInput").style.display = "inline-block";
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
  const divs = summaryDiv.querySelectorAll("div");

  // Highlight search term in summary
  divs.forEach((div) => {
    const text = div.innerText;
    const highlightedText = text.replace(
      new RegExp(searchTerm, "gi"),
      (match) => `<span class="highlight">${match}</span>`
    );
    div.innerHTML = highlightedText;
  });
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