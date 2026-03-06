/**
 * Austroads Data Info Hub — Shared JS
 * Power Pages POC · Internal Use
 *
 * Handles: mobile nav, tab switching, search, active nav state
 */

(function () {
  'use strict';

  /* ── Mobile navigation toggle ── */
  function initMobileNav() {
    const toggle = document.getElementById('au-nav-toggle');
    const nav = document.getElementById('au-main-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen.toString());
      toggle.innerHTML = isOpen
        ? `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
             <line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
             <line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/>
           </svg>`;
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Tab switching ── */
  function initTabs() {
    // Wire up all tab buttons with data-tab attribute
    document.querySelectorAll('[data-tab-target]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetId = this.dataset.tabTarget;
        const container = this.closest('[data-tab-group]');
        if (!container) return;

        // Deactivate all in group
        container.querySelectorAll('[data-tab-target]').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        container.querySelectorAll('[data-tab-panel]').forEach(function (p) {
          p.classList.remove('active');
          p.setAttribute('hidden', '');
        });

        // Activate selected
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
        const panel = document.getElementById(targetId);
        if (panel) {
          panel.classList.add('active');
          panel.removeAttribute('hidden');
        }
      });
    });
  }

  /* ── Live search filter (catalog cards) ── */
  function initSearch() {
    const input = document.getElementById('au-search-input');
    if (!input) return;

    // Cache static DOM elements to avoid re-querying on every input
    const noResult = document.getElementById('au-search-empty');

    // Debounce the search input to avoid layout thrashing on fast typing
    const handleInput = debounce(function (e) {
      const q = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('[data-searchable]');
      let visibleCount = 0;

      cards.forEach(function (card) {
        const text = (card.textContent || '').toLowerCase();
        const match = !q || text.includes(q);
        card.style.display = match ? '' : 'none';
        if (match) visibleCount++;
      });

      if (noResult) noResult.style.display = visibleCount === 0 ? 'block' : 'none';
    }, 250); // 250ms debounce

    input.addEventListener('input', handleInput);

    // Clear on escape
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        this.value = '';
        this.dispatchEvent(new Event('input'));
        this.blur();
      }
    });
  }

  /* ── Set active nav link based on current page ── */
  function initActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.au-nav__link[data-page]').forEach(function (link) {
      if (link.dataset.page === currentPath || currentPath.startsWith(link.dataset.page.replace('.html', ''))) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ── Scroll-triggered animation (Intersection Observer) ── */
  function initScrollAnimations() {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.anim-slide-up').forEach(function (el) {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
  }

  /* ── Smooth stat counter animation ── */
  function animateCounters() {
    document.querySelectorAll('[data-count-to]').forEach(function (el) {
      const target = parseInt(el.dataset.countTo, 10);
      const duration = 1000;
      const start = performance.now();
      const suffix = el.dataset.countSuffix || '';

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  /* ── Agent chat panel toggle ── */
  function initAgentPanel() {
    const openBtn = document.getElementById('au-agent-open');
    const closeBtn = document.getElementById('au-agent-close');
    const panel = document.getElementById('au-agent-panel');
    if (!panel) return;

    if (openBtn) openBtn.addEventListener('click', function () {
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
    });
    if (closeBtn) closeBtn.addEventListener('click', function () {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    });

    // Close on backdrop click
    panel.addEventListener('click', function (e) {
      if (e.target === panel) {
        panel.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
      }
    });

    // Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        panel.classList.remove('open');
      }
    });
  }

  /* ── Utility: debounce ── */
  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn.apply.bind(fn, this, arguments), delay);
    };
  }

  /* ── Init all on DOM ready ── */
  function init() {
    initMobileNav();
    initTabs();
    initSearch();
    initActiveNav();
    initScrollAnimations();
    animateCounters();
    initAgentPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
