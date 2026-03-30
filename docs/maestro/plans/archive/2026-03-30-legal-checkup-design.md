# Design Document: Legal Checkup & Compliance (v1.0.0 Readiness)

**Date:** 2026-03-30
**Topic Slug:** legal-checkup-compliance
**Design Depth:** standard
**Task Complexity:** medium

## 1. Problem Statement
The "ABI Planer" project is nearing publication, but its legal texts and compliance mechanisms have several gaps:
- **Impressum:** Incomplete according to § 5 DDG (missing full address and phone number).
- **Privacy Policy (DSGVO):** Claims no cookies are used in a "Parody Banner," while Google AdSense is active and setting tracking cookies.
- **Cookie Consent:** Missing a mandatory opt-in mechanism (Art. 6 Abs. 1 lit. a DSGVO) for non-essential cookies (AdSense).
- **Version Mismatch:** The `terms_version` in the registration form is outdated (`2026-03-20`) compared to the current AGB (`2026-03-29`).

## 2. Requirements
### Functional
- Provide a legally compliant Impressum.
- Synchronize terms acceptance versioning.
- Implement a Cookie Consent Banner that controls Google AdSense script loading.
- Update the Privacy Policy to reflect the consent mechanism.

### Non-Functional
- **UX:** The cookie banner should match the `shadcn/ui` aesthetic.
- **Security:** Ensure consent is stored securely (localStorage/Cookie).
- **Performance:** Conditionally load heavy scripts (AdSense) only after consent.

## 3. Approach
### Approach 1: Integrated Legal Compliance (Recommended)
- **Summary:** A comprehensive update to all legal pages and the implementation of a custom, styled Cookie Consent Manager.
- **Implementation:**
  - Update `src/app/impressum/page.tsx` with full details.
  - Sync `terms_version` in `src/app/register/page.tsx`.
  - Create `src/components/layout/CookieConsent.tsx`.
  - Wrap the AdSense script in a conditional loader in `src/app/layout.tsx`.
  - Update `src/app/datenschutz/page.tsx`.
- **Pros:** Full GDPR compliance, consistent UI, performance benefits (AdSense script deferred).
- **Cons:** More development effort than a simple checkbox.
- **Best When:** Professionalism and legal safety are prioritized.
- **Risk Level:** Low.

### Approach 2: Pragmatic Fix
- **Summary:** Focuses on the most critical text updates and adds a minimal consent layer.
- **Pros:** Fast to implement.
- **Cons:** Less robust GDPR compliance, potential script loading issues.
- **Risk Level:** Medium (Legal risk).

### Decision Matrix
| Criterion | Weight | Approach 1 | Approach 2 |
|-----------|--------|------------|------------|
| Legal Safety | 50% | 5: Full compliance | 3: Minimal compliance |
| UI/UX Integration | 30% | 5: Seamless with shadcn | 3: Basic |
| Performance | 20% | 4: Conditional loading | 2: Standard loading |
| **Weighted Total** | 100% | **4.8** | **2.8** |

## 4. Architecture
- **Consent Store:** `localStorage` (key: `cookie-consent-accepted`).
- **Component:** `CookieConsent.tsx` (Bottom-fixed banner, shadcn/ui buttons).
- **Control Flow:** `layout.tsx` reads consent state → conditionally renders the `<script>` tag.

## 5. Agent Team
- **Compliance Reviewer:** Lead the design and content validation.
- **Coder:** Implement the React components and logic.
- **Technical Writer:** Update the markdown/TSX text files.

## 6. Risk Assessment
- **Risk:** Consent state not persisting across subdomains (if any).
- **Mitigation:** Use root domain cookies or `localStorage` for the SPA.
- **Risk:** User misses the banner but expects ads to work.
- **Mitigation:** Clear UI but non-obtrusive.

## 7. Success Criteria
- [ ] Impressum contains full address and phone.
- [ ] RegisterForm uses `2026-03-29` as `terms_version`.
- [ ] Google AdSense script ONLY loads after clicking "Akzeptieren".
- [ ] Privacy Policy mentions the consent mechanism.
