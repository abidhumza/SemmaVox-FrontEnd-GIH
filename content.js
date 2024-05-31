const extractMainContent = () => {
  const mainContentElement = document.body;
  const mainContent = mainContentElement.innerText.trim();

  return mainContent;
};
