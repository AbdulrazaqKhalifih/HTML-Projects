// Load state from localStorage
let pages = [];
const savedState = localStorage.getItem("appState");
if (savedState) {
  pages = JSON.parse(savedState); // Parse the saved JSON string into an array
} else {
  pages = []; // Initialize an empty array if no saved state exists
}

let activePage = 0;

// DOM elements
const pageName = document.getElementById("page-name");
const cardsContainer = document.getElementById("cards-container");
const prevPageButton = document.getElementById("prev-page");
const nextPageButton = document.getElementById("next-page");
const addPageButton = document.getElementById("add-page");
const deletePageButton = document.getElementById("delete-page");
const addCardButton = document.getElementById("add-card");

// Save state to localStorage
function saveState() {
  localStorage.setItem("appState", JSON.stringify(pages));
}

// Render the current page
function renderPage() {
  const currentPage = pages[activePage];
  if (!currentPage) return;

  // Update page name
  pageName.textContent = currentPage.name;

  // Clear cards container
  cardsContainer.innerHTML = "";

  // Render cards
  currentPage.cards.forEach((card) => {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";

    const cardHeader = document.createElement("h3");
    cardHeader.textContent = card.name;

    const deleteCardButton = document.createElement("button");
    deleteCardButton.textContent = "Delete Card";
    deleteCardButton.onclick = () => deleteCard(card.id);

    const addLinkButton = document.createElement("button");
    addLinkButton.textContent = "Add Link";
    addLinkButton.onclick = () => addLink(card.id);

    const linksList = document.createElement("ul");
    linksList.className = "links";
    card.links.forEach((link) => {
      const linkItem = document.createElement("li");

      const linkAnchor = document.createElement("a");
      linkAnchor.href = link.url;
      linkAnchor.target = "_blank";
      linkAnchor.textContent = link.name;

      const deleteLinkButton = document.createElement("button");
      deleteLinkButton.textContent = "Delete";
      deleteLinkButton.onclick = () => deleteLink(card.id, link.id);

      linkItem.appendChild(linkAnchor);
      linkItem.appendChild(deleteLinkButton);
      linksList.appendChild(linkItem);
    });

    cardDiv.appendChild(cardHeader);
    cardDiv.appendChild(deleteCardButton);
    cardDiv.appendChild(addLinkButton);
    cardDiv.appendChild(linksList);
    cardsContainer.appendChild(cardDiv);
  });
}

// Add a new page
addPageButton.onclick = () => {
  if (pages.length >= 6) return alert("Maximum 6 pages allowed.");
  const name = prompt("Enter page name:");
  if (!name) return;

  pages.push({ id: Date.now(), name, cards: [] });
  setActivePage(pages.length - 1);
  saveState(); // Save state after adding a page
};

// Delete the current page
deletePageButton.onclick = () => {
  if (pages.length === 0) return;
  if (!confirm("Are you sure you want to delete this page?")) return;

  pages.splice(activePage, 1);
  setActivePage(Math.max(activePage - 1, 0));
  saveState(); // Save state after deleting a page
};

// Add a new card
addCardButton.onclick = () => {
  const currentPage = pages[activePage];
  if (!currentPage || currentPage.cards.length >= 6) {
    return alert("Maximum 6 cards allowed per page.");
  }

  const name = prompt("Enter card name:");
  if (!name) return;

  currentPage.cards.push({ id: Date.now(), name, links: [] });
  renderPage();
  saveState(); // Save state after adding a card
};

// Delete a card
function deleteCard(cardId) {
  if (!confirm("Are you sure you want to delete this card?")) return;

  const currentPage = pages[activePage];
  currentPage.cards = currentPage.cards.filter((card) => card.id !== cardId);
  renderPage();
  saveState(); // Save state after deleting a card
}

// Add a new link
function addLink(cardId) {
  const currentPage = pages[activePage];
  const card = currentPage.cards.find((c) => c.id === cardId);
  if (!card || card.links.length >= 6) {
    return alert("Maximum 6 links allowed per card.");
  }

  const name = prompt("Enter link name:");
  const url = prompt("Enter link URL:");
  if (!name || !url) return;

  card.links.push({ id: Date.now(), name, url });
  renderPage();
  saveState(); // Save state after adding a link
}

// Delete a link
function deleteLink(cardId, linkId) {
  if (!confirm("Are you sure you want to delete this link?")) return;

  const currentPage = pages[activePage];
  const card = currentPage.cards.find((c) => c.id === cardId);
  card.links = card.links.filter((link) => link.id !== linkId);
  renderPage();
  saveState(); // Save state after deleting a link
}

// Set the active page
function setActivePage(index) {
  activePage = index;
  renderPage();
}

// Navigate to the previous page
prevPageButton.onclick = () => {
  if (activePage > 0) setActivePage(activePage - 1);
};

// Navigate to the next page
nextPageButton.onclick = () => {
  if (activePage < pages.length - 1) setActivePage(activePage + 1);
};

// Initial render
renderPage();