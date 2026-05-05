/**
 * PaintPro CRM — Embeddable Quote Form Widget
 * ============================================
 * Drop this single script tag anywhere on your website:
 *
 *   <script src="https://painterspro.app/quote-form.js"></script>
 *
 * The widget will inject a mobile-friendly quote request form into the page.
 * It requires zero external dependencies and uses only inline styles.
 *
 * Configuration (optional — set before loading the script):
 *   window.PaintProWidget = {
 *     apiUrl:      'https://painterspro.app/api/public/leads',  // default
 *     source:      'dfw-painters.com',   // identifies which site sent the lead
 *     primaryColor: '#1d4ed8',           // button / accent color (CSS color)
 *     title:       'Get a Free Quote',   // form heading
 *     subtitle:    'We respond within 24 hours.',
 *     containerId: 'paintpro-quote',     // ID of a host element (optional)
 *   };
 */
(function (global) {
  "use strict";

  /* ── Configuration ─────────────────────────────────────────────────────── */
  var cfg = Object.assign(
    {
      apiUrl: "https://painterspro.app/api/public/leads",
      source: (function () {
        try { return global.location.hostname; } catch (e) { return "widget"; }
      })(),
      primaryColor: "#1d4ed8",
      title: "Get a Free Quote",
      subtitle: "We respond within 24 hours.",
      containerId: null,
    },
    global.PaintProWidget || {}
  );

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "style" && typeof attrs[k] === "object") {
          Object.assign(node.style, attrs[k]);
        } else if (k === "className") {
          node.className = attrs[k];
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function css(styles) {
    var tag = document.createElement("style");
    tag.textContent = styles;
    document.head.appendChild(tag);
  }

  /* ── Inject scoped styles ───────────────────────────────────────────────── */
  css(
    ".ppw-wrap *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}" +
    ".ppw-wrap{background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:32px 28px;max-width:480px;width:100%;margin:0 auto}" +
    ".ppw-title{font-size:22px;font-weight:700;color:#111827;margin:0 0 4px}" +
    ".ppw-subtitle{font-size:14px;color:#6b7280;margin:0 0 24px}" +
    ".ppw-group{margin-bottom:16px}" +
    ".ppw-label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px}" +
    ".ppw-input,.ppw-select,.ppw-textarea{width:100%;padding:10px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:15px;color:#111827;background:#fff;outline:none;transition:border-color .15s}" +
    ".ppw-input:focus,.ppw-select:focus,.ppw-textarea:focus{border-color:" + cfg.primaryColor + ";box-shadow:0 0 0 3px " + cfg.primaryColor + "22}" +
    ".ppw-textarea{resize:vertical;min-height:90px}" +
    ".ppw-select{appearance:none;-webkit-appearance:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 10px center;padding-right:36px}" +
    ".ppw-btn{width:100%;padding:13px;background:" + cfg.primaryColor + ";color:#fff;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;transition:opacity .15s;margin-top:8px}" +
    ".ppw-btn:hover{opacity:.88}" +
    ".ppw-btn:disabled{opacity:.55;cursor:not-allowed}" +
    ".ppw-success{text-align:center;padding:32px 16px}" +
    ".ppw-success-icon{font-size:48px;margin-bottom:12px}" +
    ".ppw-success-title{font-size:20px;font-weight:700;color:#059669;margin:0 0 8px}" +
    ".ppw-success-msg{font-size:15px;color:#6b7280;margin:0}" +
    ".ppw-error{background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;font-size:14px;color:#b91c1c;margin-top:12px;display:none}" +
    ".ppw-required{color:#ef4444;margin-left:2px}" +
    "@media(max-width:520px){.ppw-wrap{padding:24px 16px;border-radius:8px}}"
  );

  /* ── Build form DOM ─────────────────────────────────────────────────────── */
  function buildForm() {
    function labelEl(text, required) {
      return el("label", { className: "ppw-label" }, [
        text,
        required ? el("span", { className: "ppw-required" }, "*") : null,
      ]);
    }

    function group(labelText, required, inputEl) {
      return el("div", { className: "ppw-group" }, [
        labelEl(labelText, required),
        inputEl,
      ]);
    }

    var nameInput = el("input", {
      className: "ppw-input",
      type: "text",
      placeholder: "John Smith",
      autocomplete: "name",
      id: "ppw-name",
    });

    var phoneInput = el("input", {
      className: "ppw-input",
      type: "tel",
      placeholder: "(214) 555-1234",
      autocomplete: "tel",
      id: "ppw-phone",
    });

    var emailInput = el("input", {
      className: "ppw-input",
      type: "email",
      placeholder: "john@example.com",
      autocomplete: "email",
      id: "ppw-email",
    });

    var serviceSelect = el("select", { className: "ppw-select", id: "ppw-service" }, [
      el("option", { value: "" }, "— Select a service —"),
      el("option", { value: "Interior Painting" }, "Interior Painting"),
      el("option", { value: "Exterior Painting" }, "Exterior Painting"),
      el("option", { value: "Cabinet Painting" }, "Cabinet Painting"),
      el("option", { value: "Commercial" }, "Commercial"),
      el("option", { value: "Deck/Fence" }, "Deck / Fence"),
      el("option", { value: "Other" }, "Other"),
    ]);

    var messageTextarea = el("textarea", {
      className: "ppw-textarea",
      placeholder: "Tell us about your project — size, timeline, any special requirements…",
      id: "ppw-message",
    });

    var submitBtn = el(
      "button",
      { className: "ppw-btn", type: "submit" },
      "Request My Free Quote"
    );

    var errorBox = el("div", { className: "ppw-error", id: "ppw-error" });

    var form = el("form", { id: "ppw-form", novalidate: "true" }, [
      el("h2", { className: "ppw-title" }, cfg.title),
      el("p", { className: "ppw-subtitle" }, cfg.subtitle),
      group("Full Name", true, nameInput),
      group("Phone Number", true, phoneInput),
      group("Email Address", false, emailInput),
      group("Service Type", false, serviceSelect),
      group("Project Details", false, messageTextarea),
      submitBtn,
      errorBox,
    ]);

    return { form: form, nameInput: nameInput, phoneInput: phoneInput, emailInput: emailInput, serviceSelect: serviceSelect, messageTextarea: messageTextarea, submitBtn: submitBtn, errorBox: errorBox };
  }

  function buildSuccess() {
    return el("div", { className: "ppw-success" }, [
      el("div", { className: "ppw-success-icon" }, "✅"),
      el("h3", { className: "ppw-success-title" }, "Thanks! We'll be in touch shortly."),
      el("p", { className: "ppw-success-msg" }, "One of our team members will contact you within 24 hours to discuss your project."),
    ]);
  }

  /* ── Mount widget ───────────────────────────────────────────────────────── */
  function mount() {
    var host = cfg.containerId
      ? document.getElementById(cfg.containerId)
      : null;

    if (!host) {
      // Auto-inject a container right before the closing </body>
      host = el("div", { id: "paintpro-quote-widget" });
      host.style.cssText = "padding:24px 16px;";
      document.body.appendChild(host);
    }

    var wrap = el("div", { className: "ppw-wrap" });
    host.appendChild(wrap);

    var parts = buildForm();
    wrap.appendChild(parts.form);

    /* ── Form submission ──────────────────────────────────────────────────── */
    parts.form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = parts.nameInput.value.trim();
      var phone = parts.phoneInput.value.trim();
      var email = parts.emailInput.value.trim();
      var serviceType = parts.serviceSelect.value;
      var message = parts.messageTextarea.value.trim();

      // Client-side validation
      parts.errorBox.style.display = "none";
      parts.errorBox.textContent = "";

      if (!name) {
        showError("Please enter your full name.");
        parts.nameInput.focus();
        return;
      }
      if (!phone) {
        showError("Please enter your phone number.");
        parts.phoneInput.focus();
        return;
      }

      // Disable button and show loading state
      parts.submitBtn.disabled = true;
      parts.submitBtn.textContent = "Sending…";

      var payload = {
        name: name,
        phone: phone,
        email: email || undefined,
        serviceType: serviceType || undefined,
        message: message || undefined,
        source: cfg.source,
      };

      fetch(cfg.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { status: res.status, data: data };
          });
        })
        .then(function (result) {
          if (result.status >= 200 && result.status < 300 && result.data.success) {
            // Replace form with success message
            wrap.innerHTML = "";
            wrap.appendChild(buildSuccess());
          } else {
            var msg =
              (result.data && result.data.error) ||
              "Something went wrong. Please try again or call us directly.";
            showError(msg);
            resetButton();
          }
        })
        .catch(function (err) {
          console.error("[PaintPro Widget] Submission error:", err);
          showError(
            "Unable to submit your request right now. Please try again or call us directly."
          );
          resetButton();
        });

      function showError(msg) {
        parts.errorBox.textContent = msg;
        parts.errorBox.style.display = "block";
      }

      function resetButton() {
        parts.submitBtn.disabled = false;
        parts.submitBtn.textContent = "Request My Free Quote";
      }
    });
  }

  /* ── Wait for DOM ready ─────────────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})(window);
