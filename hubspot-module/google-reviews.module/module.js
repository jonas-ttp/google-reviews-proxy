(function () {
  "use strict";

  // ── Config from HubL (set in module.html) ────────────────────────────────
  var config = window.GR_CONFIG || {};
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

  // ── Fetch reviews ─────────────────────────────────────────────────────────
  fetch(PROXY_URL)
    .then(function (res) {
      if (!res.ok) throw new Error("Server returned " + res.status);
      return res.json();
    })
    .then(function (data) {
      render(data);
    })
    .catch(function (err) {
      console.error("Google Reviews error:", err);
      showError("Could not load reviews. Please try again later.");
    });

  // ── Render ────────────────────────────────────────────────────────────────
  function render(data) {
    // Overall rating summary
    if (SHOW_SUMMARY && overallNumberEl) {
      var rating = data.rating || 0;
      overallNumberEl.textContent = rating.toFixed(1);
      if (overallStarsEl) overallStarsEl.innerHTML = buildStars(rating);
      if (totalEl) totalEl.textContent = (data.totalRatings || 0).toLocaleString() + " Google reviews";
    }

    // Reviews list
    var reviews = (data.reviews || []).slice(0, MAX_REVIEWS);

    if (!reviews.length) {
      listEl.innerHTML = '<p class="gr-error">No reviews available.</p>';
      return;
    }

    listEl.innerHTML = reviews.map(buildCard).join("");

    // Wire up "Read more" toggles
    listEl.querySelectorAll(".gr-read-more").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var full  = btn.previousElementSibling;
        var short = full.previousElementSibling;
        if (short.style.display === "none") {
          short.style.display = "";
          full.style.display  = "none";
          btn.textContent = "Read more";
        } else {
          short.style.display = "none";
          full.style.display  = "";
          btn.textContent = "Read less";
        }
      });
    });
  }

  // ── Card builder ──────────────────────────────────────────────────────────
  var MAX_TEXT = 150;

  function buildCard(review) {
    var text      = (review.text || "").trim();
    var shortText = text.length > MAX_TEXT ? text.slice(0, MAX_TEXT).trim() + "…" : text;
    var hasMore   = text.length > MAX_TEXT;

    return [
      '<div class="gr-card">',
        '<div class="gr-card-header">',
          buildAvatar(review),
          '<div class="gr-author-info">',
            '<span class="gr-author-name">' + escHtml(review.author) + '</span>',
            '<span class="gr-time">' + escHtml(review.time) + '</span>',
          '</div>',
        '</div>',
        '<div class="gr-card-stars">' + buildStars(review.rating) + '</div>',
        hasMore
          ? [
              '<p class="gr-review-text">' + escHtml(shortText) + '</p>',
              '<p class="gr-review-text" style="display:none">' + escHtml(text) + '</p>',
              '<button class="gr-read-more">Read more</button>',
            ].join("")
          : '<p class="gr-review-text">' + escHtml(text) + '</p>',
      '</div>',
    ].join("");
  }

  // ── Avatar builder ────────────────────────────────────────────────────────
  function buildAvatar(review) {
    if (review.authorPhoto) {
      return (
        '<img class="gr-avatar" src="' + escAttr(review.authorPhoto) + '" ' +
        'alt="' + escAttr(review.author) + '" ' +
        'onerror="this.outerHTML=\'' + escAttr(fallbackAvatar(review.author)) + '\'">'
      );
    }
    return fallbackAvatar(review.author);
  }

  function fallbackAvatar(name) {
    var initial = (name || "?").charAt(0).toUpperCase();
    return '<div class="gr-avatar-fallback">' + initial + '</div>';
  }

  // ── Star builder ──────────────────────────────────────────────────────────
  function buildStars(rating) {
    var stars = "";
    for (var i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars += '<span class="gr-star filled">★</span>';
      } else if (rating >= i - 0.5) {
        stars += '<span class="gr-star half">★</span>';
      } else {
        stars += '<span class="gr-star">★</span>';
      }
    }
    return '<div class="gr-stars">' + stars + '</div>';
  }

  // ── Error state ───────────────────────────────────────────────────────────
  function showError(msg) {
    if (listEl) listEl.innerHTML = '<p class="gr-error">' + escHtml(msg) + '</p>';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
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
