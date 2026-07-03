/* RUNWAY Clip — scraper. globalThis.__rwScrape(sel) + __rwScrapeList() */
(function () {
  "use strict";
  if (globalThis.__rwScrape) return;
  const clean = (t) => (t || "").trim().replace(/\s+/g, " ");
  const pick = (sels) => { for (const s of sels) { let el; try { el = document.querySelector(s); } catch (e) { continue; } const t = el && (el.textContent || el.getAttribute("content")); if (t && clean(t)) return clean(t); } return ""; };
  const meta = (n) => { const el = document.querySelector(`meta[property="${n}"],meta[name="${n}"]`); return el ? clean(el.getAttribute("content")) : ""; };
  const qp = (k) => { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } };
  const site = () => { const h = location.hostname; return h.includes("linkedin") ? "linkedin" : h.includes("indeed") ? "indeed" : h.includes("glassdoor") ? "glassdoor" : "web"; };
  const id = (s) => { const p = qp("currentJobId") || qp("jk") || qp("jobListingId"); if (p) return s + ":" + p; try { return (s + ":" + new URL(location.href).pathname).slice(0, 120); } catch (e) { return "clip:" + Date.now() + Math.random().toString(36).slice(2, 7); } };

  globalThis.__rwScrape = function (sel) {
    const s = site();
    let role = "", co = "", loc = "", sal = "", desc = "";
    if (s === "linkedin") {
      role = pick([".job-details-jobs-unified-top-card__job-title", ".jobs-unified-top-card__job-title", ".topcard__title", "h1"]);
      co = pick([".job-details-jobs-unified-top-card__company-name a", ".job-details-jobs-unified-top-card__company-name", ".jobs-unified-top-card__company-name", ".topcard__org-name-link"]);
      loc = pick([".job-details-jobs-unified-top-card__primary-description-container span", ".topcard__flavor--bullet"]);
      desc = pick(["#job-details", ".jobs-description__content"]);
    } else if (s === "indeed") {
      role = pick(["h1.jobsearch-JobInfoHeader-title", '[data-testid="jobsearch-JobInfoHeader-title"]', "h1"]);
      co = pick(['[data-testid="inlineHeader-companyName"]', '[data-testid="company-name"]', ".jobsearch-CompanyInfoContainer a"]);
      loc = pick(['[data-testid="inlineHeader-companyLocation"]', '[data-testid="job-location"]']);
      sal = pick(['#salaryInfoAndJobType span', '[data-testid="jobsearch-OtherJobDetailsContainer"] span']);
      desc = pick(["#jobDescriptionText"]);
    } else if (s === "glassdoor") {
      role = pick(['[data-test="job-title"]', "h1"]);
      co = pick(['[data-test="employer-name"]', '[class*="EmployerProfile_employerName"]']);
      loc = pick(['[data-test="location"]']);
      sal = pick(['[data-test="detailSalary"]']);
      desc = pick(['[class*="JobDetails_jobDescription"]', "#JobDescriptionContainer"]);
    }
    if (!role) role = clean((meta("og:title") || document.title).split(/[-|–—@]/)[0]);
    if (!co) co = meta("og:site_name") || clean((document.title.split(/[-|–—@]/)[1] || "")) || s;
    const parts = [];
    if (loc) parts.push("📍 " + loc);
    if (sal) parts.push("💰 " + sal);
    if (sel && clean(sel)) parts.push(clean(sel).slice(0, 400)); else if (desc) parts.push(clean(desc).slice(0, 400));
    return { id: id(s), company: (co || "Unknown").slice(0, 80), role: (role || "Software Engineer").slice(0, 120), stage: "wishlist", source: "clip", date: new Date().toISOString().slice(0, 10), url: location.href.split("#")[0].slice(0, 500), note: parts.join("  ·  ").slice(0, 500), _desc: [role, loc, sal, desc].filter(Boolean).join(" ") };
  };

  globalThis.__rwScrapeList = function () {
    const s = site(), out = [], seen = new Set();
    const txt = (c, sels) => { for (const x of sels) { const el = c.querySelector(x); if (el && clean(el.textContent)) return clean(el.textContent); } return ""; };
    const add = (o) => { if (!o.role || !o.company) return; const k = (o.company + "|" + o.role).toLowerCase(); if (seen.has(k)) return; seen.add(k); out.push(o); };
    let cards = [];
    if (s === "linkedin") { cards = document.querySelectorAll("li.scaffold-layout__list-item, .job-card-container, .jobs-search-results__list-item"); cards.forEach((c) => { const a = c.querySelector("a[href*='/jobs/view/']"); add({ role: txt(c, [".job-card-list__title", ".job-card-container__link", "strong"]), company: txt(c, [".job-card-container__primary-description", ".artdeco-entity-lockup__subtitle"]), url: a ? a.href.split("?")[0] : location.href }); }); }
    else if (s === "indeed") { cards = document.querySelectorAll(".job_seen_beacon, [data-testid='slider_item']"); cards.forEach((c) => { const a = c.querySelector("a[href]"); add({ role: txt(c, ["h2.jobTitle span", "h2 a span", "h2"]), company: txt(c, ["[data-testid='company-name']", ".companyName"]), url: a ? a.href : location.href }); }); }
    else if (s === "glassdoor") { cards = document.querySelectorAll("[data-test='jobListing'], li.react-job-listing"); cards.forEach((c) => { const a = c.querySelector("a[href]"); add({ role: txt(c, ["[data-test='job-title']", "a.jobLink", "a"]), company: txt(c, ["[data-test='employer-short-name']", ".employerName"]), url: a ? a.href : location.href }); }); }
    return out.map((o, i) => ({ id: s + ":list:" + (o.company + o.role).slice(0, 50) + i, company: (o.company || "Unknown").slice(0, 80), role: (o.role || "Software Engineer").slice(0, 120), stage: "wishlist", source: "clip", date: new Date().toISOString().slice(0, 10), url: (o.url || location.href).slice(0, 500), note: "", _desc: o.role || "" }));
  };
})();
