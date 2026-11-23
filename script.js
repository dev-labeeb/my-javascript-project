// =====================================================
//  Shortly - URL Shortener  (beginner-friendly JavaScript)
// =====================================================

// ---------- 1. GRAB THE HTML ELEMENTS WE NEED ----------
const form = document.getElementById("shorten-form");
const urlInput = document.getElementById("url-input");
const errorMessage = document.getElementById("error-message");
const shortenBtn = document.getElementById("shorten-btn");
const resultsList = document.getElementById("results");
const menuBtn = document.getElementById("menu-btn");
const nav = document.getElementById("nav");

// The name we use to save our links in the browser's storage
const STORAGE_KEY = "shortly-links";

// This array holds all shortened links: [{ original: "...", short: "..." }, ...]
let links = [];


// ---------- 2. MOBILE MENU ----------
// When the hamburger is clicked, show or hide the menu
menuBtn.addEventListener("click", function () {
  nav.classList.toggle("open");
  const isOpen = nav.classList.contains("open");
  menuBtn.setAttribute("aria-expanded", isOpen);
});


// ---------- 3. SAVE & LOAD LINKS (localStorage) ----------
// localStorage keeps data even after the page is refreshed.
// It can only store text, so we use JSON.stringify to turn the array into text.
function saveLinks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

// JSON.parse turns the saved text back into an array.
function loadLinks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    links = JSON.parse(saved);
  }
}


// ---------- 4. SHOW / HIDE ERROR MESSAGES ----------
function showError(message) {
  errorMessage.textContent = message;
  urlInput.classList.add("invalid"); // red border
}

function clearError() {
  errorMessage.textContent = "";
  urlInput.classList.remove("invalid");
}


// ---------- 5. CHECK IF A LINK LOOKS VALID ----------
function isValidUrl(text) {
  try {
    new URL(text); // throws an error if the text is not a real URL
    return true;
  } catch (error) {
    return false;
  }
}


// ---------- 6. CALL THE API TO SHORTEN THE LINK ----------
// We use the free is.gd service. We send it the long link and it sends back a short one.
async function shortenUrl(longUrl) {
  const apiUrl = "https://is.gd/create.php?format=json&url=" + encodeURIComponent(longUrl);

  const response = await fetch(apiUrl);
  const data = await response.json();

  // If the API sends an error, we stop and show it
  if (data.errormessage) {
    throw new Error(data.errormessage);
  }

  return data.shorturl; // e.g. "https://is.gd/abc123"
}


// ---------- 7. DRAW THE LINKS ON THE PAGE ----------
function renderLinks() {
  resultsList.innerHTML = ""; // empty the list first

  // Go through every saved link and build a row for it
  links.forEach(function (link) {
    const item = document.createElement("li");
    item.className = "result";

    const original = document.createElement("p");
    original.className = "result__original";
    original.textContent = link.original;

    const short = document.createElement("a");
    short.className = "result__short";
    short.href = link.short;
    short.target = "_blank";
    short.rel = "noopener";
    short.textContent = link.short;

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn";
    copyBtn.textContent = "Copy";

    // When Copy is clicked, copy the short link to the clipboard
    copyBtn.addEventListener("click", function () {
      copyLink(link.short, copyBtn);
    });

    item.append(original, short, copyBtn);
    resultsList.appendChild(item);
  });
}


// ---------- 8. COPY TO CLIPBOARD ----------
async function copyLink(text, button) {
  try {
    await navigator.clipboard.writeText(text);

    // Reset every button back to "Copy", then mark this one as "Copied!"
    document.querySelectorAll(".result .btn").forEach(function (b) {
      b.textContent = "Copy";
      b.classList.remove("copied");
    });
    button.textContent = "Copied!";
    button.classList.add("copied");
  } catch (error) {
    alert("Could not copy. Please copy the link by hand.");
  }
}


// ---------- 9. WHEN THE FORM IS SUBMITTED ----------
form.addEventListener("submit", async function (event) {
  event.preventDefault(); // stop the page from reloading

  const longUrl = urlInput.value.trim(); // trim() removes extra spaces

  // Check 1: is the input empty?
  if (longUrl === "") {
    showError("Please add a link");
    return;
  }

  // Check 2: is it a real link?
  if (!isValidUrl(longUrl)) {
    showError("Please enter a valid link (e.g. https://example.com)");
    return;
  }

  clearError();
  shortenBtn.disabled = true;
  shortenBtn.textContent = "Loading...";

  try {
    const shortLink = await shortenUrl(longUrl);

    // Add the new link to the START of the list
    links.unshift({ original: longUrl, short: shortLink });
    saveLinks();
    renderLinks();
    urlInput.value = ""; // clear the input
  } catch (error) {
    showError("Something went wrong. Please try again.");
    console.error(error);
  }

  // Whether it worked or not, turn the button back on
  shortenBtn.disabled = false;
  shortenBtn.textContent = "Shorten It!";
});

// Remove the red error as soon as the user starts typing again
urlInput.addEventListener("input", clearError);


// ---------- 10. START THE APP ----------
loadLinks();   // get saved links from storage
renderLinks(); // show them on the page