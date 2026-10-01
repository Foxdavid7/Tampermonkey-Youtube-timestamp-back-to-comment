// ==UserScript==
// @name         YouTube: Back to comment after timestamp click
// @namespace    local.david.yt-back-to-comment
// @version      1.2
// @description  After you click a timestamp in a YouTube comment, adds a button that scrolls you back to the comment you were reading.
// @author       Foxdavid7 and Claude Sonnet 5.5
// @license      MIT
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const COMMENT_SELECTOR = 'ytd-comment-view-model, ytd-comment-renderer, ytd-comment-thread-renderer';
  const TIMESTAMP_HREF = /[?&]t=\d+/;

  let saved = null; // { scrollY, comment, offsetTop }

  // ---- Button ----
  const wrap = document.createElement('div');
  Object.assign(wrap.style, {
    position: 'fixed',
    left: '24px',
    bottom: '24px',
    zIndex: 99999,
    display: 'none',
    alignItems: 'stretch',
    borderRadius: '28px',
    overflow: 'hidden',
    background: '#3ea6ff',
    boxShadow: '0 3px 12px rgba(0,0,0,.55)',
  });

  const btn = document.createElement('button');
  btn.textContent = '↩ Back to comment';
  Object.assign(btn.style, {
    padding: '16px 22px',
    border: 'none',
    background: 'transparent',
    color: '#000',
    font: '500 17px Roboto, Arial, sans-serif',
    cursor: 'pointer',
  });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.title = 'Dismiss';
  Object.assign(closeBtn.style, {
    padding: '0 16px',
    border: 'none',
    borderLeft: '1px solid rgba(0,0,0,.25)',
    background: 'transparent',
    color: '#000',
    font: '500 17px Roboto, Arial, sans-serif',
    cursor: 'pointer',
  });

  wrap.append(btn, closeBtn);
  document.body.appendChild(wrap);

  function hideButton() {
    wrap.style.display = 'none';
    saved = null;
  }

  closeBtn.addEventListener('click', hideButton);

  btn.addEventListener('click', () => {
    if (!saved) return;
    const { scrollY, comment, offsetTop } = saved;
    if (comment && comment.isConnected) {
      // Put the comment back at the same spot on screen where it was
      const top = comment.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - offsetTop, behavior: 'auto' });
    } else {
      window.scrollTo({ top: scrollY, behavior: 'auto' });
    }
    hideButton();
  });

  // ---- Capture the state BEFORE YouTube scrolls to the player ----
  document.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest && e.target.closest('a[href]');
      if (!link) return;
      if (!link.closest('ytd-comments, #comments')) return;
      if (!TIMESTAMP_HREF.test(link.getAttribute('href') || '')) return;

      const comment = link.closest(COMMENT_SELECTOR);
      saved = {
        scrollY: window.scrollY,
        comment,
        offsetTop: comment ? comment.getBoundingClientRect().top : 0,
      };
      wrap.style.display = 'flex';
    },
    true // capture phase: runs before YouTube's own handlers
  );

  // New video / page navigation -> saved position is meaningless
  window.addEventListener('yt-navigate-start', hideButton);

  // Escape hatch: hide the button on Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideButton();
  });
})();
