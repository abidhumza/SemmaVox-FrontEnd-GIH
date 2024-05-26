const extractAndSummarize = () => {
  const textContent = document.body.innerText;
  const summary = textContent.split(" ").slice(0, 100).join(" ");
  return summary;
}