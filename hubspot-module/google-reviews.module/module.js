(function () {
  "use strict";

  // ── Config from HubL (set in module.html) ────────────────────────────────
  var config      = window.GR_CONFIG || {};
  var PROXY_URL   = config.proxyUrl   || "";
  var MAX_REVIEWS = config.maxReviews || 5;
  var SHOW_SUMMARY = config.showSummary !== false;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  var listEl          = document.getElementById("gr-list");
  var overallNumberEl = document.getElementById("gr-overall-number");
  var overallStarsEl  = document.getElementById("gr-overall-stars");
  var totalEl         = document.getElementById("gr-total");

  if (!PROXY_URL) {
    showError("Reviews API URL is not configured. Please set it in the module settings.");
    return;
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  fetch(PROXY_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("Server returned " + res.status);
      return res.json();
    })
    .then(render)
    .catch(function (err) {
      console.error("Google Reviews error:", err);
      showError("Could not load reviews. Please try again later.");
    });

  // ── Render ────────────────────────────────────────────────────────────────
  function render(data) {
    // Overall summary
    if (SHOW_SUMMARY && overallNumberEl) {
      var rating = data.rating || 0;
      overallNumberEl.textContent = rating.toFixed(1);
      if (overallStarsEl) overallStarsEl.innerHTML = buildStars(rating, "1.4rem");
      if (totalEl) totalEl.textContent = (data.totalRatings || 0).toLocaleString() + " Google reviews";
    }

    // Cards
    var reviews = (data.reviews || []).slice(0, MAX_REVIEWS);
    if (!reviews.length) {
      listEl.innerHTML = '<p class="gr-error">No reviews available.</p>';
      return;
    }

    listEl.innerHTML = reviews.map(buildCard).join("");

    // Read-more toggles
    listEl.querySelectorAll(".gr-read-more").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var shortEl = btn.previousElementSibling.previousElementSibling;
        var fullEl  = btn.previousElementSibling;
        var isShowing = shortEl.style.display === "none";
        shortEl.style.display = isShowing ? "" : "none";
        fullEl.style.display  = isShowing ? "none" : "";
        btn.textContent = isShowing ? "Read more" : "Read less";
      });
    });
  }

  // ── Card builder ──────────────────────────────────────────────────────────
  var MAX_TEXT = 160;

  function buildCard(review) {
    var text     = (review.text || "").trim();
    var title    = extractTitle(text);       // first sentence → bold heading
    var hasMore  = text.length > MAX_TEXT;
    var shortTxt = hasMore ? text.slice(0, MAX_TEXT).trim() + "…" : text;

    var textBlock = hasMore
      ? [
          '<p class="gr-review-text" style="display:none">' + escHtml(text) + "</p>",
          '<p class="gr-review-text">' + escHtml(shortTxt) + "</p>",
          '<button class="gr-read-more">Read more</button>',
        ].join("")
      : '<p class="gr-review-text">' + escHtml(text) + "</p>";

    return [
      '<div class="gr-card">',
        // 1. Stars
        buildStars(review.rating, "2rem"),
        // 2. Title (first sentence)
        '<p class="gr-card-title">' + escHtml(title) + "</p>",
        // 3. Review text
        textBlock,
        // 4. Author (photo + name)
        '<div class="gr-author">',
          buildPhotoWrap(review),
          '<span class="gr-author-name">' + escHtml(review.author) + "</span>",
        "</div>",
      "</div>",
    ].join("");
  }

  // ── Extract first sentence as card title ──────────────────────────────────
  function extractTitle(text) {
    // Split on sentence-ending punctuation followed by a space or end
    var match = text.match(/^.{10,80}?[.!?](?:\s|$)/);
    if (match) return match[0].trim();
    // Fallback: first 60 chars
    return text.slice(0, 60).trim() + (text.length > 60 ? "…" : "");
  }

  // ── Photo wrap with dashed ring + quote badge ─────────────────────────────
  function buildPhotoWrap(review) {
    var inner = review.authorPhoto
      ? '<img class="gr-avatar" src="' + escAttr(review.authorPhoto) + '" ' +
          'alt="' + escAttr(review.author) + '" ' +
          'onerror="this.outerHTML=\'<div class=&quot;gr-avatar-fallback&quot;>' +
          escAttr((review.author || "?").charAt(0).toUpperCase()) +
          "</div>\\'\">"
      : '<div class="gr-avatar-fallback">' +
          escHtml((review.author || "?").charAt(0).toUpperCase()) +
        "</div>";

    return '<div class="gr-photo-wrap">' + inner + "</div>";
  }

  // ── Star builder ──────────────────────────────────────────────────────────
  function buildStars(rating, size) {
    var stars = "";
    for (var i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars += '<span class="gr-star filled" style="font-size:' + size + '">★</span>';
      } else if (rating >= i - 0.5) {
        stars += '<span class="gr-star half"  style="font-size:' + size + '">★</span>';
      } else {
        stars += '<span class="gr-star"        style="font-size:' + size + '">★</span>';
      }
    }
    return '<div class="gr-stars">' + stars + "</div>";
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showError(msg) {
    if (listEl) listEl.innerHTML = '<p class="gr-error">' + escHtml(msg) + "</p>";
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escAttr(str) {
    return escHtml(str).replace(/'/g, "&#39;");
  }

})();
