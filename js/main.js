/* ================================================================
   ANTITHESIS — MAIN SCRIPT
   Handles: scroll reveal, method flow animation, nav scroll state,
   mobile menu, theme toggle, form submission, smooth scroll, hero
   reveal sequence on load.
   ================================================================ */
(function () {
  'use strict';

  /* ============================================================
     SERVICES CONSTELLATION — link node hover to spoke highlight
     ============================================================ */
  document.querySelectorAll('.services-node[data-spoke]').forEach(function (node) {
    var id = node.dataset.spoke;
    var spoke = document.querySelector('.services-spoke[data-spoke="' + id + '"]');
    var tip   = document.querySelector('.services-spoke-tip[data-spoke="' + id + '"]');
    var activate = function () {
      if (spoke) spoke.classList.add('is-active');
      if (tip)   tip.classList.add('is-active');
    };
    var deactivate = function () {
      if (spoke) spoke.classList.remove('is-active');
      if (tip)   tip.classList.remove('is-active');
    };
    node.addEventListener('mouseenter', activate);
    node.addEventListener('mouseleave', deactivate);
    node.addEventListener('focusin', activate);
    node.addEventListener('focusout', deactivate);
  });

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
     THEME TOGGLE
     ============================================================ */
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('antithesis-theme', next); } catch (e) { /* no-op */ }
    });
  }

  /* ============================================================
     FORM SUBMISSION
     ============================================================ */
  var form = document.getElementById('contactForm');
  var thankyou = document.getElementById('formThankyou');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.style.display = 'none';
      thankyou.classList.add('active');
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
       SERVICES CONSTELLATION — entrance choreography
       Nodes fade up with stagger; hub scales in last; spokes draw
       on once everything is in place.
       ============================================================ */
    var constellation = document.querySelector('.services-constellation');
    if (constellation && typeof ScrollTrigger !== 'undefined') {
      var nodes = constellation.querySelectorAll('.services-node');
      gsap.from(nodes, {
        scrollTrigger: { trigger: constellation, start: 'top 78%', once: true },
        y: 28,
        opacity: 0,
        duration: 0.85,
        stagger: 0.18,
        ease: 'power3.out'
      });

      var hub = constellation.querySelector('.services-hub');
      if (hub) {
        gsap.from(hub, {
          scrollTrigger: { trigger: constellation, start: 'top 75%', once: true },
          scale: 0,
          opacity: 0,
          duration: 0.95,
          delay: 0.5,
          ease: 'back.out(1.6)'
        });
      }

      /* Spokes: draw from hub outward */
      var spokes = constellation.querySelectorAll('.services-spoke');
      spokes.forEach(function (spoke, i) {
        var len = 0;
        try { len = spoke.getTotalLength ? spoke.getTotalLength() : 0; } catch (e) { len = 0; }
        if (!len) return;
        gsap.fromTo(spoke,
          { strokeDasharray: len, strokeDashoffset: len },
          {
            scrollTrigger: { trigger: constellation, start: 'top 70%', once: true },
            strokeDashoffset: 0,
            duration: 1.1,
            delay: 0.7 + i * 0.12,
            ease: 'power2.out',
            onComplete: function () {
              /* Restore the dashed pattern after the draw finishes */
              spoke.style.strokeDasharray = '4 8';
              spoke.style.strokeDashoffset = '0';
            }
          }
        );
      });

      /* Spoke tips appear after their spoke */
      var tips = constellation.querySelectorAll('.services-spoke-tip');
      gsap.from(tips, {
        scrollTrigger: { trigger: constellation, start: 'top 70%', once: true },
        scale: 0,
        opacity: 0,
        duration: 0.5,
        delay: 1.5,
        stagger: 0.1,
        transformOrigin: 'center',
        ease: 'back.out(1.8)'
      });
    }

    /* ============================================================
       CAPITAL EFFICIENCY CHART — animate bar heights from 0
       ============================================================ */
    var capitalChart = document.getElementById('capitalChart');
    if (capitalChart && typeof ScrollTrigger !== 'undefined') {
      var chartBars = capitalChart.querySelectorAll('.chart-bar__shape');
      gsap.from(chartBars, {
        scrollTrigger: { trigger: capitalChart, start: 'top 80%', once: true },
        scaleY: 0,
        duration: 1.3,
        stagger: 0.18,
        ease: 'power3.out',
        transformOrigin: '50% 100%'
      });
      var chartCallout = capitalChart.querySelector('.chart-callout__chip');
      if (chartCallout) {
        gsap.from(chartCallout, {
          scrollTrigger: { trigger: capitalChart, start: 'top 75%', once: true },
          scale: 0,
          opacity: 0,
          duration: 0.85,
          delay: 0.55,
          ease: 'back.out(1.7)'
        });
      }
      var chartBracket = capitalChart.querySelector('.chart-callout__bracket path');
      if (chartBracket) {
        var bLen = 0;
        try { bLen = chartBracket.getTotalLength ? chartBracket.getTotalLength() : 0; } catch (e) { bLen = 0; }
        if (bLen) {
          gsap.fromTo(chartBracket,
            { strokeDasharray: bLen, strokeDashoffset: bLen },
            {
              scrollTrigger: { trigger: capitalChart, start: 'top 78%', once: true },
              strokeDashoffset: 0,
              duration: 1.3,
              delay: 0.4,
              ease: 'power2.out',
              onComplete: function () {
                chartBracket.style.strokeDasharray = '3 5';
                chartBracket.style.strokeDashoffset = '0';
              }
            }
          );
        }
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
