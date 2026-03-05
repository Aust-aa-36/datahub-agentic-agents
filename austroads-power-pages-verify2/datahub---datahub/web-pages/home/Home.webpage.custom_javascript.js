/**
 * Home page JS — Agent chat wired to Power Automate
 * Austroads Data Info Hub
 * Panel built entirely in JS — no HTML dependency for the drawer.
 * document.body.appendChild escapes Power Pages CSS transform ancestor.
 *
 * Iteration 16: User context, feedback, copy, new conversation,
 *               source citations, conversation export.
 */
(function () {
  'use strict';

  var AGENT_ENDPOINT = 'https://8bbd70f60473e9689748b73f7eed2f.c4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/53bac4d2842d44f1a284437479dfc99d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XG5HvZMP6LxawnVjc3PcSqD8VlnPXz1F7-xoGDXh5qs';
  var SESSION_ID = 'datahub-' + Date.now();
  var panelReady = false;
  var chatHistory = []; /* Track last 8 messages (4 exchanges) for router context */

  console.log('[auAgent] script loaded, session:', SESSION_ID);

  /* ── SVG Icons ── */
  var BOT_SVG_LG   = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a5 5 0 0 1 5 5v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5z"/><circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/></svg>';
  var BOT_SVG_SM   = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a5 5 0 0 1 5 5v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5z"/><circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/></svg>';
  var CLOSE_SVG    = '<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>';
  var SEND_SVG     = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var HINT_SVG     = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
  var THUMBUP_SVG  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
  var THUMBDN_SVG  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>';
  var COPY_SVG     = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CHECK_SVG    = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var REFRESH_SVG  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  var DOWNLOAD_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';

  /* ── Product name → URL slug mapping for source citations ── */
  var PRODUCT_MAP = {
    'vehicles & registrations': 'vehicles-reg', 'vehicle registration': 'vehicles-reg', 'registration data': 'vehicles-reg',
    'national vin': 'natvin', 'vin database': 'natvin',
    'driver licence': 'driver', 'driver license': 'driver',
    'stolen': 'stolen', 'write-off': 'stolen', 'swovs': 'stolen',
    'gold data': 'gold', 'vehicles gold': 'gold',
    'plate-to-vin': 'p2v', 'p2v': 'p2v',
    'safety recall': 'recall',
    'aec data': 'aec', 'aec': 'aec',
    'bitre': 'bitre', 'motor vehicle census': 'bitre',
    'enabling rav': 'rav',
    'vehicle enrolment': 'ems', 'ems': 'ems',
    'spatiotemporal': 'spatiotemporal', 'gnss telemetry': 'spatiotemporal',
    'spatial data': 'spatial', 'iac': 'spatial',
    'road analytics': 'road-analytics',
    'smart obm': 'smart-obm', 'on-board mass': 'smart-obm',
    'hpfr': 'hpfr', 'high productivity freight': 'hpfr', 'freight routes': 'hpfr',
    'new zealand': 'nz'
  };

  var PRODUCT_DISPLAY = {
    'vehicles-reg': 'Vehicles & Registrations', 'natvin': 'National VIN Database',
    'driver': 'Driver Licences', 'stolen': 'Stolen & Write-off (SWOVS)',
    'gold': 'Vehicles Gold Data', 'p2v': 'Plate-to-VIN (P2V)',
    'recall': 'Safety Recalls', 'aec': 'AEC Data Provisioning',
    'bitre': 'BITRE Motor Vehicle Census', 'rav': 'Enabling RAV',
    'ems': 'Vehicle Enrolment (EMS)', 'spatiotemporal': 'Spatiotemporal Data',
    'spatial': 'Spatial Data Services', 'road-analytics': 'Road Analytics Services',
    'smart-obm': 'Smart OBM Data Services', 'hpfr': 'High Productivity Freight Routes',
    'nz': 'New Zealand Historical Study'
  };

  /* ── Global API — inline onclick calls this ── */
  window.auAgent = {
    open:   function () { openPanel(); },
    close:  function () { closePanel(); },
    toggle: function () {
      var p = document.getElementById('au-agent-panel');
      if (p && p.classList.contains('au-open')) { closePanel(); } else { openPanel(); }
    }
  };

  /* ════════════════════════════════════════════════════
     buildPanel — creates the drawer DOM from scratch
     and appends it to document.body.
     Called once on first open.
  ════════════════════════════════════════════════════ */
  function buildPanel() {
    if (panelReady) return;
    panelReady = true;

    /* Read user data from hidden element set by Liquid */
    var nameEl    = document.getElementById('au-user-data');
    var rawFirst  = nameEl ? (nameEl.getAttribute('data-first-name') || '') : '';
    var rawFull   = nameEl ? (nameEl.getAttribute('data-full-name') || '') : '';
    var rawEmail  = nameEl ? (nameEl.getAttribute('data-email') || '') : '';
    var firstName = (rawFirst.indexOf('{{') === -1) ? rawFirst.trim() : '';
    var fullName  = (rawFull.indexOf('{{') === -1) ? rawFull.trim() : '';
    var userEmail = (rawEmail.indexOf('{{') === -1) ? rawEmail.trim() : '';
    var initials  = firstName ? firstName.charAt(0).toUpperCase() : '';

    var welcomeText = firstName
      ? 'Hi ' + firstName + '! I\u2019m the Data Hub Assistant. I can help with NEVDIS and TCA data products, access requirements, and delivery details. What would you like to know?'
      : 'Hi! I\u2019m the Data Hub Assistant. I can help with NEVDIS and TCA data products, access requirements, and delivery details. What would you like to know?';

    /* Backdrop */
    var bd = document.createElement('div');
    bd.id = 'au-agent-backdrop';
    bd.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bd);

    /* Panel */
    var panel = document.createElement('div');
    panel.id = 'au-agent-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'AI Assistant Chat');
    panel.innerHTML =
      '<div class="au-agent-panel-body">' +
        '<div class="au-agent-section__header">' +
          '<div class="au-agent-bot-avatar" aria-hidden="true">' + BOT_SVG_LG + '</div>' +
          '<div class="au-agent-section__header-meta">' +
            '<div class="au-agent-section__title">Data Hub Assistant</div>' +
            '<div class="au-agent-section__status">' +
              '<span class="au-agent-status-dot" aria-hidden="true"></span>' +
              'Online \u00b7 NEVDIS &amp; TCA' +
            '</div>' +
          '</div>' +
          '<button class="au-agent-section__new" id="au-agent-new" aria-label="New conversation" title="New conversation">' + REFRESH_SVG + '</button>' +
          '<button class="au-agent-section__close" id="au-agent-close" aria-label="Close AI Assistant">' + CLOSE_SVG + '</button>' +
        '</div>' +
        '<div class="au-agent-chat" id="au-agent-chat" aria-live="polite" aria-label="Chat messages">' +
          '<div class="au-agent-chat-inner" id="au-agent-chat-inner">' +
            '<div class="au-agent-msg au-agent-msg--bot">' +
              '<div class="au-msg-bot-avatar" aria-hidden="true">' + BOT_SVG_SM + '</div>' +
              '<div class="au-msg-bubble" id="au-agent-welcome-text">' + welcomeText + '</div>' +
            '</div>' +
            '<div class="au-agent-suggestions" id="au-agent-suggestions" aria-label="Suggested questions">' +
              '<button class="au-suggestion-chip" type="button">What is NEVDIS?</button>' +
              '<button class="au-suggestion-chip" type="button">How do I access TCA data?</button>' +
              '<button class="au-suggestion-chip" type="button">What is Plate-to-VIN?</button>' +
              '<button class="au-suggestion-chip" type="button">What TCA services are available?</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="au-agent-input-wrap">' +
          '<form class="au-agent-input-row" id="au-agent-form" aria-label="Send message">' +
            '<input type="text" id="au-agent-input" class="au-agent-input" placeholder="Ask about NEVDIS, TCA, data access\u2026" autocomplete="off" aria-label="Your message" maxlength="500">' +
            '<button type="submit" id="au-agent-send-btn" class="au-agent-send" aria-label="Send" disabled>' + SEND_SVG + '</button>' +
          '</form>' +
          '<div class="au-agent-input-footer">' +
            '<div class="au-agent-input-hint" aria-hidden="true">' + HINT_SVG + ' Powered by AI Builder</div>' +
            '<button class="au-agent-export-btn" id="au-agent-export" type="button" aria-label="Export conversation" title="Export conversation">' + DOWNLOAD_SVG + ' Export</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);

    /* Wire up chat interactions */
    wireChat(panel, {
      initials: initials,
      firstName: firstName,
      fullName: fullName,
      email: userEmail
    });
  }

  /* ── Open / Close ── */
  function openPanel() {
    buildPanel();
    var panel = document.getElementById('au-agent-panel');
    var bd    = document.getElementById('au-agent-backdrop');
    if (!panel) { console.error('[auAgent] panel not found after build'); return; }
    panel.classList.add('au-open');
    panel.setAttribute('aria-hidden', 'false');
    if (bd) bd.classList.add('au-open');
    setTimeout(function () {
      var inp = document.getElementById('au-agent-input');
      if (inp) inp.focus();
    }, 350);
  }

  function closePanel() {
    var panel = document.getElementById('au-agent-panel');
    var bd    = document.getElementById('au-agent-backdrop');
    if (!panel) return;
    panel.classList.remove('au-open');
    panel.setAttribute('aria-hidden', 'true');
    if (bd) bd.classList.remove('au-open');
  }

  /* ── Reset conversation ── */
  function resetConversation() {
    SESSION_ID = 'datahub-' + Date.now();
    console.log('[auAgent] New conversation, session:', SESSION_ID);
    chatHistory = [];

    var chatInner = document.getElementById('au-agent-chat-inner');
    if (!chatInner) return;

    while (chatInner.firstChild) chatInner.removeChild(chatInner.firstChild);

    /* Read name again (in case it wasn't available on first build) */
    var nameEl = document.getElementById('au-user-data');
    var rawFirst = nameEl ? (nameEl.getAttribute('data-first-name') || '') : '';
    var firstName = (rawFirst.indexOf('{{') === -1) ? rawFirst.trim() : '';

    var welcomeText = firstName
      ? 'Hi ' + firstName + '! I\u2019m the Data Hub Assistant. I can help with NEVDIS and TCA data products, access requirements, and delivery details. What would you like to know?'
      : 'Hi! I\u2019m the Data Hub Assistant. I can help with NEVDIS and TCA data products, access requirements, and delivery details. What would you like to know?';

    var welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'au-agent-msg au-agent-msg--bot';
    welcomeMsg.innerHTML =
      '<div class="au-msg-bot-avatar" aria-hidden="true">' + BOT_SVG_SM + '</div>' +
      '<div class="au-msg-bubble">' + welcomeText + '</div>';
    chatInner.appendChild(welcomeMsg);

    var sug = document.createElement('div');
    sug.className = 'au-agent-suggestions';
    sug.id = 'au-agent-suggestions';
    sug.setAttribute('aria-label', 'Suggested questions');
    sug.innerHTML =
      '<button class="au-suggestion-chip" type="button">What is NEVDIS?</button>' +
      '<button class="au-suggestion-chip" type="button">How do I access TCA data?</button>' +
      '<button class="au-suggestion-chip" type="button">What is Plate-to-VIN?</button>' +
      '<button class="au-suggestion-chip" type="button">What TCA services are available?</button>';
    chatInner.appendChild(sug);

    var chat = document.getElementById('au-agent-chat');
    if (chat) chat.scrollTop = 0;

    var input = document.getElementById('au-agent-input');
    var sendBtn = document.getElementById('au-agent-send-btn');
    if (input)   { input.disabled = false; input.value = ''; input.focus(); }
    if (sendBtn) sendBtn.disabled = true;
  }

  /* ── Export conversation ── */
  function exportConversation() {
    if (!chatHistory || chatHistory.length === 0) {
      console.warn('[auAgent] No conversation to export');
      return;
    }
    var lines = [];
    lines.push('Austroads Data Info Hub \u2014 Conversation Export');
    lines.push('\u2550'.repeat(50));
    lines.push('Session: ' + SESSION_ID);
    lines.push('Exported: ' + new Date().toLocaleString());
    lines.push('');
    for (var i = 0; i < chatHistory.length; i++) {
      var entry = chatHistory[i];
      lines.push((entry.role === 'user' ? 'You' : 'Assistant') + ':');
      lines.push(entry.text);
      lines.push('');
    }
    lines.push('\u2500'.repeat(50));
    lines.push('End of conversation');

    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'datahub-chat-' + new Date().toISOString().split('T')[0] + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[auAgent] Conversation exported');
  }

  /* ── Document-level click delegation ── */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#au-agent-open-hero') ||
        t.closest('#au-agent-open-banner') ||
        t.closest('#au-agent-open')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var p = document.getElementById('au-agent-panel');
      if (p && p.classList.contains('au-open')) { closePanel(); } else { openPanel(); }
    } else if (t.closest('#au-agent-new')) {
      e.stopImmediatePropagation();
      resetConversation();
    } else if (t.closest('#au-agent-export')) {
      e.stopImmediatePropagation();
      exportConversation();
    } else if (t.closest('#au-agent-close')) {
      e.stopImmediatePropagation();
      closePanel();
    } else if (t.closest('#au-agent-backdrop')) {
      e.stopImmediatePropagation();
      closePanel();
    }
  });

  /* Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var p = document.getElementById('au-agent-panel');
      if (p && p.classList.contains('au-open')) closePanel();
    }
  });

  /* ════════════════════════════════════════════════════
     wireChat — binds chat events to the built panel
  ════════════════════════════════════════════════════ */
  function wireChat(panel, userData) {
    var initials      = userData.initials || '?';
    var userFirstName = userData.firstName || '';
    var userFullName  = userData.fullName || '';
    var userEmail     = userData.email || '';

    var form        = document.getElementById('au-agent-form');
    var input       = document.getElementById('au-agent-input');
    var sendBtn     = document.getElementById('au-agent-send-btn');
    var chatInner   = document.getElementById('au-agent-chat-inner');
    var chat        = document.getElementById('au-agent-chat');
    var suggestions = document.getElementById('au-agent-suggestions');

    if (input && sendBtn) {
      input.addEventListener('input', function () {
        sendBtn.disabled = !this.value.trim();
      });
    }
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitMessage(input ? input.value.trim() : '');
      });
    }
    if (suggestions) {
      suggestions.querySelectorAll('.au-suggestion-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          submitMessage(this.textContent.trim());
        });
      });
    }

    /* Delegate action-bar clicks (feedback + copy) on chatInner */
    if (chatInner) {
      chatInner.addEventListener('click', function (e) {
        var target = e.target.closest('.au-msg-action-btn');
        if (!target) {
          /* Also handle suggestion chip clicks (for reset-created chips) */
          var chip = e.target.closest('.au-suggestion-chip');
          if (chip) submitMessage(chip.textContent.trim());
          return;
        }
        var container = target.closest('.au-msg-bubble-container');
        if (!container) return;
        var bubble = container.querySelector('.au-msg-bubble');
        if (!bubble) return;
        var rawText = bubble.getAttribute('data-raw-text') || '';

        if (target.classList.contains('au-msg-action-btn--thumbup')) {
          handleFeedback(target, 'thumbup', rawText);
        } else if (target.classList.contains('au-msg-action-btn--thumbdown')) {
          handleFeedback(target, 'thumbdown', rawText);
        } else if (target.classList.contains('au-msg-action-btn--copy')) {
          handleCopy(target, rawText);
        }
      });
    }

    var BOT_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a5 5 0 0 1 5 5v2h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5z"/><circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/></svg>';

    /* ── Lightweight markdown → HTML for bot responses ── */
    function renderMarkdown(raw) {
      var s = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
      s = s.replace(/(?<!\w)\*([^*]+?)\*(?!\w)/g, '<em>$1</em>');
      s = s.replace(/`([^`]+?)`/g, '<code>$1</code>');

      var lines = s.split('\n');
      var html = [];
      var inList = false;
      var listType = '';

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.trim();

        if (/^#{1,3}\s+/.test(trimmed)) {
          if (inList) { html.push('</' + listType + '>'); inList = false; }
          var level = trimmed.match(/^(#{1,3})/)[1].length;
          var hText = trimmed.replace(/^#{1,3}\s+/, '');
          html.push('<h' + (level + 3) + ' class="au-md-h">' + hText + '</h' + (level + 3) + '>');
          continue;
        }

        if (/^[-*]\s+/.test(trimmed)) {
          if (!inList || listType !== 'ul') {
            if (inList) html.push('</' + listType + '>');
            html.push('<ul class="au-md-list">');
            inList = true; listType = 'ul';
          }
          html.push('<li>' + trimmed.replace(/^[-*]\s+/, '') + '</li>');
          continue;
        }

        if (/^\d+[.)]\s+/.test(trimmed)) {
          if (!inList || listType !== 'ol') {
            if (inList) html.push('</' + listType + '>');
            html.push('<ol class="au-md-list">');
            inList = true; listType = 'ol';
          }
          html.push('<li>' + trimmed.replace(/^\d+[.)]\s+/, '') + '</li>');
          continue;
        }

        if (inList) { html.push('</' + listType + '>'); inList = false; }

        if (!trimmed) {
          html.push('<div class="au-md-spacer"></div>');
          continue;
        }

        html.push('<p class="au-md-p">' + trimmed + '</p>');
      }
      if (inList) html.push('</' + listType + '>');
      return html.join('');
    }

    /* ── Source citations — auto-link mentioned products ── */
    function addSourceCitations(bubbleEl, rawText) {
      var found = [];
      var lower = rawText.toLowerCase();
      for (var key in PRODUCT_MAP) {
        if (PRODUCT_MAP.hasOwnProperty(key) && lower.indexOf(key) !== -1) {
          var slug = PRODUCT_MAP[key];
          if (found.indexOf(slug) === -1) found.push(slug);
        }
      }
      if (found.length === 0) return;

      var box = document.createElement('div');
      box.className = 'au-msg-citations';
      box.innerHTML = '<div class="au-msg-citations__label">Related pages:</div>';
      var links = document.createElement('div');
      links.className = 'au-msg-citations__links';
      for (var i = 0; i < found.length; i++) {
        var a = document.createElement('a');
        a.href = '/detail-' + found[i];
        a.className = 'au-msg-citation-link';
        a.textContent = PRODUCT_DISPLAY[found[i]] || found[i];
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        links.appendChild(a);
      }
      box.appendChild(links);
      bubbleEl.appendChild(box);
    }

    /* ── Feedback handler ── */
    function handleFeedback(button, type, rawText) {
      if (button.classList.contains('au-msg-action-btn--selected')) return;
      button.classList.add('au-msg-action-btn--selected');
      /* Deselect sibling feedback button */
      var bar = button.parentElement;
      var siblings = bar.querySelectorAll('.au-msg-action-btn--thumbup, .au-msg-action-btn--thumbdown');
      for (var i = 0; i < siblings.length; i++) {
        if (siblings[i] !== button) siblings[i].classList.remove('au-msg-action-btn--selected');
      }
      console.log('[auAgent] Feedback:', type, '| Preview:', rawText.substring(0, 80));
      /* TODO: POST feedback to Power Automate endpoint when backend is ready */
    }

    /* ── Copy handler ── */
    function handleCopy(button, rawText) {
      if (!navigator.clipboard) { console.warn('[auAgent] Clipboard API unavailable'); return; }
      navigator.clipboard.writeText(rawText).then(function () {
        var original = button.innerHTML;
        button.innerHTML = CHECK_SVG;
        button.classList.add('au-msg-action-btn--copied');
        button.setAttribute('title', 'Copied!');
        setTimeout(function () {
          button.innerHTML = original;
          button.classList.remove('au-msg-action-btn--copied');
          button.setAttribute('title', 'Copy message');
        }, 2000);
      }).catch(function (err) {
        console.error('[auAgent] Copy failed:', err);
      });
    }

    /* ── Add message to chat ── */
    function addMessage(text, role, domain) {
      var msg = document.createElement('div');
      msg.className = 'au-agent-msg au-agent-msg--' + role;

      var av = document.createElement('div');
      if (role === 'bot') {
        av.className = 'au-msg-bot-avatar';
        av.setAttribute('aria-hidden', 'true');
        av.innerHTML = BOT_SVG;
      } else {
        av.className = 'au-msg-user-avatar';
        av.setAttribute('aria-hidden', 'true');
        av.textContent = initials || '?';
      }

      if (role === 'bot') {
        /* Bot messages: bubble-container wraps bubble + action bar */
        var container = document.createElement('div');
        container.className = 'au-msg-bubble-container';

        var bub = document.createElement('div');
        bub.className = 'au-msg-bubble';
        bub.setAttribute('data-raw-text', text);
        bub.innerHTML = renderMarkdown(text);

        /* Domain badge */
        if (domain) {
          var badge = document.createElement('span');
          var dk = domain.toLowerCase();
          badge.className = 'au-msg-domain-badge au-msg-domain--' + dk;
          badge.textContent = dk === 'general' ? 'AUSTROADS' : domain;
          bub.insertBefore(badge, bub.firstChild);
        }

        /* Source citations */
        addSourceCitations(bub, text);

        /* Action bar: thumbs up/down + copy */
        var actions = document.createElement('div');
        actions.className = 'au-msg-actions';
        actions.innerHTML =
          '<button class="au-msg-action-btn au-msg-action-btn--thumbup" aria-label="Helpful" title="Helpful">' + THUMBUP_SVG + '</button>' +
          '<button class="au-msg-action-btn au-msg-action-btn--thumbdown" aria-label="Not helpful" title="Not helpful">' + THUMBDN_SVG + '</button>' +
          '<button class="au-msg-action-btn au-msg-action-btn--copy" aria-label="Copy message" title="Copy message">' + COPY_SVG + '</button>';

        container.appendChild(bub);
        container.appendChild(actions);
        msg.appendChild(av);
        msg.appendChild(container);
      } else {
        /* User messages: simple bubble */
        var bub = document.createElement('div');
        bub.className = 'au-msg-bubble';
        bub.textContent = text;
        msg.appendChild(av);
        msg.appendChild(bub);
      }

      if (chatInner) chatInner.appendChild(msg);
      if (chat) chat.scrollTop = chat.scrollHeight;
    }

    function showTyping() {
      var msg = document.createElement('div');
      msg.className = 'au-agent-msg au-agent-msg--bot';
      msg.id = 'au-typing-indicator';
      var av = document.createElement('div');
      av.className = 'au-msg-bot-avatar';
      av.setAttribute('aria-hidden', 'true');
      av.innerHTML = BOT_SVG;
      var bub = document.createElement('div');
      bub.className = 'au-msg-bubble';
      bub.innerHTML =
        '<div class="au-agent-typing"><span></span><span></span><span></span></div>' +
        '<div class="au-typing-slow" id="au-typing-slow">Still thinking\u2026 responses can take up to 15 seconds</div>';
      msg.appendChild(av);
      msg.appendChild(bub);
      if (chatInner) chatInner.appendChild(msg);
      if (chat) chat.scrollTop = chat.scrollHeight;
    }

    function removeTyping() {
      var el = document.getElementById('au-typing-indicator');
      if (el) el.remove();
    }

    function showSlowHint() {
      var el = document.getElementById('au-typing-slow');
      if (el) el.classList.add('show');
    }

    function askAgent(message, isRetry) {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 45000);
      return fetch(AGENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          sessionId: SESSION_ID,
          history: chatHistory.slice(-8),
          user: {
            firstName: userFirstName,
            fullName: userFullName,
            email: userEmail
          }
        }),
        signal: controller.signal
      })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && data.reply) {
          return { reply: data.reply, domain: data.domain || '', intent: data.intent || '' };
        }
        throw new Error('empty_reply');
      })
      .catch(function (err) {
        clearTimeout(timer);
        if (!isRetry && err.name === 'AbortError') {
          showSlowHint();
          return askAgent(message, true);
        }
        throw err;
      });
    }

    function submitMessage(text) {
      if (!text || !text.trim()) return;
      /* Hide any visible suggestion chips */
      var sug = document.getElementById('au-agent-suggestions');
      if (sug) sug.style.display = 'none';
      addMessage(text, 'user');
      chatHistory.push({ role: 'user', text: text });
      if (input)   { input.value = ''; input.disabled = true; }
      if (sendBtn) sendBtn.disabled = true;
      showTyping();
      var slowTimer = setTimeout(showSlowHint, 12000);
      askAgent(text)
        .then(function (result) {
          clearTimeout(slowTimer);
          removeTyping();
          addMessage(result.reply, 'bot', result.domain);
          chatHistory.push({ role: 'bot', text: result.reply });
          if (result.domain) {
            console.log('[auAgent] domain:', result.domain, '| intent:', result.intent);
          }
        })
        .catch(function (err) {
          clearTimeout(slowTimer);
          removeTyping();
          addMessage(
            err.name === 'AbortError'
              ? 'The assistant timed out. Please try again \u2014 responses can take up to 20 seconds.'
              : 'The assistant is temporarily unavailable. Please try again or contact nevdis@austroads.com.au.',
            'bot'
          );
          console.error('[Agent]', err);
        })
        .then(function () {
          if (input)   { input.disabled = false; input.focus(); }
          if (sendBtn) sendBtn.disabled = !(input && input.value.trim());
        });
    }
  }

})();
