let currentRate = 1; // Default speech rate

const speakText = (text, voiceName, rate = 1) => {
  const utterance = new SpeechSynthesisUtterance(text);

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find((voice) => voice.name === voiceName);

  utterance.voice = selectedVoice;
  utterance.rate = rate; // Set the speech rate

  window.speechSynthesis.speak(utterance);
};

document.getElementById("summarizeButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: function () {
          const extractMainContent = () => {
            let mainContent = "";

            // Select the main content element or fall back to the body
            const mainContentElement =
              document.querySelector("main") || document.body;

            // Get all <p> and <h1> tags within the selected main content element
            const extractContent = mainContentElement.querySelectorAll(
              "p, h1, h2, h3, h4, h5, h6"
            );

            // Extract text from all <p> tags
            extractContent.forEach((element) => {
              mainContent += element.innerText + " "; // Concatenate the inner text of each element
            });

            // Function to extract sentences
            const extractSentences = (text) => {
              return text.match(/[^\.!\?]+[\.!\?]+/g) || [];
            };

            const sentences = extractSentences(mainContent);
            const totalSentences = sentences.length;

            // Ensure a minimum summary length
            const minWords = 300;
            let summaryWords = 0;

            // Function to add a sentence to the summary
            const addSentenceToSummary = (sentence, summaryArray) => {
              summaryArray.push(sentence);
              summaryWords += sentence.split(" ").length;
            };

            const summarySentences = [];

            // Add key sentences from the beginning
            if (totalSentences > 0) {
              addSentenceToSummary(sentences[0], summarySentences); // Start
            }

            // Add a key sentence from the middle
            if (totalSentences > 4) {
              addSentenceToSummary(
                sentences[Math.floor(totalSentences / 2)],
                summarySentences
              ); // Middle
            }

            // Add key sentences from the end
            if (totalSentences > 1) {
              addSentenceToSummary(
                sentences[totalSentences - 1],
                summarySentences
              ); // End
            }

            // Add random key sentences to reach the minimum word count
            while (
              summaryWords < minWords &&
              summarySentences.length < totalSentences
            ) {
              const randomIndex = Math.floor(Math.random() * totalSentences);
              const sentence = sentences[randomIndex];
              if (!summarySentences.includes(sentence)) {
                addSentenceToSummary(sentence, summarySentences);
              }
            }

            // Combine selected sentences to form the summary
            const summary = summarySentences
              .map((sentence) => `<div>${sentence}</div>`)
              .join("");
            return summary;
          };

          return extractMainContent();
        },
      },
      (results) => {
        const summary = results[0].result;
        document.getElementById("summary").innerHTML = summary; // Use innerHTML to preserve line breaks
        document.getElementById("summary").style.display = "block"; // Show summary div

        // Hide the summarize button
        document.getElementById("summarizeButton").style.display = "none";

        // Enable and show the necessary elements
        document.getElementById("readAloudButton").disabled = false;
        document.getElementById("readAloudButton").style.display = "inline-block";
        document.getElementById("voiceSelect").disabled = false;
        document.getElementById("voiceSelect").style.display = "inline-block";
        document.getElementById("pauseButton").disabled = false;
        document.getElementById("resumeButton").disabled = false;
        document.getElementById("pauseButton").style.display = "inline-block";
        document.getElementById("resumeButton").style.display = "inline-block";
        document.getElementById("fastForwardButton").style.display = "inline-block"; // Show the fast forward button
        document.getElementById("downloadButton").style.display = "inline-block";
        document.getElementById("searchButton").style.display = "inline-block";
        document.getElementById("searchInput").style.display = "inline-block";
        document.getElementById("fastForwardButton").style.display = "inline-block";
      }
    );
  });
});

// Add event listener to read aloud button
document.getElementById("readAloudButton").addEventListener("click", () => {
  const summary = document.getElementById("summary").innerText;
  const selectedVoice = document.getElementById("voiceSelect").value;
  speakText(summary, selectedVoice, currentRate); // Call speakText function with summary, selectedVoice, and currentRate
});

// Add event listener to pause button
document.getElementById("pauseButton").addEventListener("click", () => {
  window.speechSynthesis.pause(); // Pause speech synthesis
});

// Add event listener to resume button
document.getElementById("resumeButton").addEventListener("click", () => {
  window.speechSynthesis.resume(); // Resume speech synthesis
});

// Add event listener to fast forward button
document.getElementById("fastForwardButton").addEventListener("click", () => {
  currentRate += 0.5; // Increase the speech rate
  const summary = document.getElementById("summary").innerText;
  const selectedVoice = document.getElementById("voiceSelect").value;
  window.speechSynthesis.cancel(); // Cancel the current speech
  speakText(summary, selectedVoice, currentRate); // Restart with the new rate
});

// Add event listener to download button
document.getElementById("downloadButton").addEventListener("click", () => {
  const summary = document.getElementById("summary").innerText;
  download("summary.txt", summary);
});

// Add event listener to search button
document.getElementById("searchButton").addEventListener("click", () => {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const summaryDiv = document.getElementById("summary");

  // Highlight search results while maintaining summary structure
  const divs = summaryDiv.querySelectorAll("div");
  divs.forEach((div) => {
    const text = div.innerText;
    const highlightedText = text.replace(
      new RegExp(searchTerm, "gi"),
      (match) => `<span class="highlight">${match}</span>`
    );
    div.innerHTML = highlightedText;
  });
});

// Function to download text as a file
function download(filename, text) {
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
}

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
