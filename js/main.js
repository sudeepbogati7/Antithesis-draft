/* ================================================================
   ANTITHESIS — MAIN SCRIPT
   Handles: scroll reveal, method flow animation, nav scroll state,
   mobile menu, contact pre-fill by track, form submission, smooth
   scroll, hero reveal sequence on load.
   ================================================================ */
(function () {
  'use strict';

  /* ============================================================
     INTERSECTION OBSERVER — SCROLL REVEAL
     ============================================================ */
  var revealElements = document.querySelectorAll('.reveal');
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ============================================================
     METHOD FLOW — OBSERVE & ANIMATE
     ============================================================ */
  var methodFlow = document.getElementById('methodFlow');
  if (methodFlow) {
    var methodObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          methodObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    methodObserver.observe(methodFlow);
  }

  /* ============================================================
     NAV — BLEND OVER HERO, FLOATING PILL AFTER 30vh SCROLL
     ============================================================ */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var navScrolled = false;
    var updateNavState = function () {
      var shouldScroll = window.scrollY > window.innerHeight * 0.3;
      if (shouldScroll !== navScrolled) {
        nav.classList.toggle('scrolled', shouldScroll);
        navScrolled = shouldScroll;
      }
    };
    window.addEventListener('scroll', updateNavState, { passive: true });
    updateNavState();
  }

  /* ============================================================
     MOBILE MENU
     ============================================================ */
  var hamburger = document.querySelector('.nav-hamburger');
  var overlay = document.querySelector('.mobile-overlay');
  var overlayLinks = overlay ? overlay.querySelectorAll('a') : [];

  function toggleMenu() {
    var isOpen = hamburger.classList.toggle('open');
    overlay.classList.toggle('open', isOpen);
    overlay.setAttribute('aria-hidden', !isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  }

  if (hamburger) hamburger.addEventListener('click', toggleMenu);
  overlayLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (hamburger.classList.contains('open')) toggleMenu();
    });
  });

  /* ============================================================
     THEME TOGGLE — light is the default; choice persists
     ============================================================ */
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('antithesis-theme', next); } catch (e) { /* no-op */ }
    });
  }

  /* ============================================================
     CONTACT PRE-FILL — the form continues the visitor's path
     Sources, in priority order:
       1. ?need=fractional | ?need=impact in the URL (cross-page CTAs)
       2. data-need="..." on any CTA clicked within the page
     Track pages ship with the correct <option selected> already.
     ============================================================ */
  var needSelect = document.getElementById('cf-need');
  var NEED_MAP = {
    fractional: 'Fractional leadership & strategists',
    impact: 'Impact & SROI'
  };

  if (needSelect) {
    try {
      var needParam = new URLSearchParams(window.location.search).get('need');
      if (needParam && NEED_MAP[needParam]) needSelect.value = NEED_MAP[needParam];
    } catch (e) { /* URLSearchParams unavailable — skip pre-fill */ }

    document.querySelectorAll('[data-need]').forEach(function (cta) {
      cta.addEventListener('click', function () {
        var mapped = NEED_MAP[cta.getAttribute('data-need')];
        if (mapped) needSelect.value = mapped;
      });
    });
  }

  /* ============================================================
     FORM SUBMISSION — Formspree AJAX endpoint
     Submits the contact form via fetch() so we can keep the in-page
     thank-you UI. Validates client-side, shows loading + error states.
     ============================================================ */
  var form        = document.getElementById('contactForm');
  var thankyou    = document.getElementById('formThankyou');
  var submitBtn   = document.getElementById('formSubmitBtn');
  var formError   = document.getElementById('formError');
  var emailRegex  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(msg) {
    if (!formError) return;
    formError.textContent = msg || '';
    formError.classList.toggle('is-visible', !!msg);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setError('');

      var name      = (form.elements['name']  && form.elements['name'].value  || '').trim();
      var email     = (form.elements['email'] && form.elements['email'].value || '').trim();
      var need      = (form.elements['What they need'] && form.elements['What they need'].value || '').trim();
      var botcheck  = form.elements['_gotcha'] && form.elements['_gotcha'].value;

      /* Honeypot caught a bot — fake success, drop quietly */
      if (botcheck) {
        form.style.display = 'none';
        thankyou.classList.add('active');
        return;
      }

      if (!name)                    return setError('Please add your name.');
      if (!emailRegex.test(email))  return setError('That email looks off — mind double-checking?');
      if (!need)                    return setError('Tell us what you need help with so we can route this right.');

      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      var formData = new FormData(form);

      /* Formspree AJAX: returns HTTP 200 + { ok: true } on success, or a
         non-2xx with { errors: [{ message }] } on failure. */
      fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          form.style.display = 'none';
          thankyou.classList.add('active');
        } else {
          var msg = result.data && result.data.errors && result.data.errors.length
            ? result.data.errors.map(function (e) { return e.message; }).join(', ')
            : 'Submission failed';
          throw new Error(msg);
        }
      })
      .catch(function (err) {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        setError('Something went wrong sending the message. Email us directly at hello@antithesis-consulting.com.');
        if (window.console) console.error('Form submit failed:', err);
      });
    });
  }

  /* ============================================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var hash = this.getAttribute('href');
      if (hash === '#' || hash.length < 2) return;
      var target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================================
     TRIGGER HERO REVEAL ON LOAD
     ============================================================ */
  window.addEventListener('load', function () {
    document.querySelectorAll('.hero-content .reveal').forEach(function (el, i) {
      setTimeout(function () { el.classList.add('visible'); }, 100 + (i * 120));
    });
  });

  /* ============================================================
     GSAP — TRUSTED-BY ENHANCEMENTS
     Loaded from CDN as deferred scripts; main.js runs after them.
     If GSAP is unavailable (offline / blocked), the carousel
     falls back to the CSS-only marquee + transitions.
     ============================================================ */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     NUMERIC COUNTERS — handled outside the GSAP guard so reduced-motion
     users (and offline-GSAP scenarios) still see the final values, not 0.
     ============================================================ */
  var counterEls = document.querySelectorAll('.counter');
  counterEls.forEach(function (el) {
    var raw = el.dataset.target || '0';
    var target = parseFloat(raw) || 0;
    var decimals = raw.indexOf('.') !== -1 ? 1 : 0;
    var setFinal = function () { el.textContent = target.toFixed(decimals); };

    if (prefersReducedMotion || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setFinal();
      return;
    }
    var c = { val: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: function () {
        gsap.to(c, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function () { el.textContent = c.val.toFixed(decimals); }
        });
      }
    });
  });

  if (typeof gsap !== 'undefined' && !prefersReducedMotion) {

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    /* Animated stat counters — tick up from 0 once the row scrolls in */
    document.querySelectorAll('.trusted-stats__num').forEach(function (el) {
      var target = parseFloat(el.dataset.target) || 0;
      var counter = { val: 0 };
      var run = function () {
        gsap.to(counter, {
          val: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function () {
            el.textContent = Math.round(counter.val);
          }
        });
      };
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: run
        });
      } else {
        run();
      }
    });

    /* Stagger-fade the stat items as the row enters */
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.from('.trusted-stats__item', {
        scrollTrigger: {
          trigger: '#trustedStats',
          start: 'top 85%',
          once: true
        },
        y: 24,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out'
      });
    }

    /* Logo cards — bouncy hover scale */
    document.querySelectorAll('.logo-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        gsap.to(card, { scale: 1.06, duration: 0.45, ease: 'back.out(2)' });
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(card, { scale: 1, duration: 0.35, ease: 'power2.out' });
      });
    });

    /* ============================================================
       APPROACH PANELS — stagger bullets, frame fade-in, parallax
       ============================================================ */
    if (typeof ScrollTrigger !== 'undefined') {
      document.querySelectorAll('.approach-panel').forEach(function (panel) {
        var bullets = panel.querySelectorAll('.approach-pillar__list li');
        if (bullets.length) {
          gsap.from(bullets, {
            scrollTrigger: { trigger: panel, start: 'top 78%', once: true },
            y: 14,
            opacity: 0,
            duration: 0.65,
            stagger: 0.06,
            ease: 'power2.out'
          });
        }

        var pillarTitles = panel.querySelectorAll('.approach-pillar__title');
        if (pillarTitles.length) {
          gsap.from(pillarTitles, {
            scrollTrigger: { trigger: panel, start: 'top 80%', once: true },
            y: 10,
            opacity: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power2.out'
          });
        }

        /* Photo frame — fade in, then subtle scrub-driven parallax */
        var frame = panel.querySelector('.photo-frame');
        if (frame) {
          gsap.from(frame, {
            scrollTrigger: { trigger: panel, start: 'top 80%', once: true },
            scale: 0.96,
            opacity: 0,
            duration: 1.1,
            ease: 'power3.out'
          });
          gsap.to(frame, {
            scrollTrigger: {
              trigger: panel,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1
            },
            y: -28,
            ease: 'none'
          });
        }

        /* Sparkline mini-bars rise from baseline (panel 03) */
        var sparkBars = panel.querySelectorAll('.photo-frame__sparkline rect.spark-bar');
        if (sparkBars.length) {
          gsap.from(sparkBars, {
            scrollTrigger: { trigger: panel, start: 'top 75%', once: true },
            scaleY: 0,
            transformOrigin: '50% 100%',
            duration: 0.9,
            stagger: 0.08,
            ease: 'power3.out'
          });
        }

        /* Sparkline trend curve draws on */
        var sparkCurve = panel.querySelector('.photo-frame__sparkline .spark-curve');
        if (sparkCurve) {
          var len = 0;
          try { len = sparkCurve.getTotalLength ? sparkCurve.getTotalLength() : 0; } catch (e) { len = 0; }
          if (len) {
            gsap.fromTo(sparkCurve,
              { strokeDasharray: len, strokeDashoffset: len },
              {
                scrollTrigger: { trigger: panel, start: 'top 70%', once: true },
                strokeDashoffset: 0,
                duration: 1.5,
                delay: 0.3,
                ease: 'power2.out',
                onComplete: function () {
                  /* Restore the dotted look — clear GSAP's inline style overrides */
                  sparkCurve.style.strokeDasharray = '3 4';
                  sparkCurve.style.strokeDashoffset = '0';
                }
              }
            );
          }
        }
      });
    }

    /* ============================================================
       SERVICES GRID — entrance choreography
       Cards fade and lift in with a small stagger as the grid scrolls
       into view.
       ============================================================ */
    var servicesGrid = document.querySelector('.services-grid');
    if (servicesGrid && typeof ScrollTrigger !== 'undefined') {
      var nodes = servicesGrid.querySelectorAll('.services-node');
      gsap.from(nodes, {
        scrollTrigger: { trigger: servicesGrid, start: 'top 82%', once: true },
        y: 28,
        opacity: 0,
        duration: 0.85,
        stagger: 0.18,
        ease: 'power3.out'
      });
    }

    /* ============================================================
       FTF CHART — Full-Time vs Fractional infographic
       Reveal is CSS-driven (see .ftf-row.is-visible rules); GSAP is
       only used for the optional hover micro-interactions so a missed
       tween can never leave a row stranded in the hidden state.
       ============================================================ */
    var ftfChart = document.getElementById('capitalChart');
    if (ftfChart) {
      var ftfRows = ftfChart.querySelectorAll('.ftf-row');

      /* Per-row IntersectionObserver — each row reveals independently
         the moment it scrolls into view. */
      var ftfRowObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            ftfRowObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

      ftfRows.forEach(function (row) { ftfRowObserver.observe(row); });

      /* Hover interactivity (decorative — depends on GSAP if present) */
      if (typeof gsap !== 'undefined') {
        ftfRows.forEach(function (row) {
          var fracFill = row.querySelector('.ftf-bar--frac .ftf-bar__fill');
          var delta    = row.querySelector('.ftf-row__delta');
          row.addEventListener('mouseenter', function () {
            if (fracFill) gsap.to(fracFill, { scaleY: 1.15, duration: 0.3, transformOrigin: 'center', ease: 'power2.out' });
            if (delta)    gsap.to(delta, { scale: 1.06, duration: 0.3, ease: 'power2.out' });
          });
          row.addEventListener('mouseleave', function () {
            if (fracFill) gsap.to(fracFill, { scaleY: 1, duration: 0.4, ease: 'power2.out' });
            if (delta)    gsap.to(delta, { scale: 1, duration: 0.4, ease: 'power2.out' });
          });
        });
      }
    }

    /* ============================================================
       CONTACT DECOR — subtle parallax on glow shapes
       ============================================================ */
    var contactSection = document.getElementById('contact');
    if (contactSection && typeof ScrollTrigger !== 'undefined') {
      var glows = contactSection.querySelectorAll('.contact-decor__glow');
      glows.forEach(function (glow, i) {
        gsap.to(glow, {
          scrollTrigger: {
            trigger: contactSection,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          },
          y: i % 2 === 0 ? -40 : 40,
          ease: 'none'
        });
      });
    }
  }

})();
