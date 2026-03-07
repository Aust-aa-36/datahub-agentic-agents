---
name: power-pages-expert
description: Expert-level understanding of Power Pages architecture, Enhanced Data Model (v2), and safe CI/CD deployment patterns. Use for troubleshooting "Page Not Found" errors, GUID conflicts, and multi-site isolation in a single environment.
---

# Power Pages Expert

This skill provides comprehensive technical guidance for architecting, building, and deploying custom Power Pages sites using pro-dev tools.

## 1. Component Ownership & GUID Conflicts
Power Pages components (Web Pages, Templates, etc.) are unique **per environment**, not just per site. 
- **The Conflict**: If Site A and Site B share a component GUID, the last upload "steals" that component from the previous site.
- **The Symptom**: "Page Not Found" (404) errors on the original site because its "Home" or "Page Template" records have been re-assigned.
- **The Fix**: Re-run deployment for the original site using the `--forceUploadAll` flag to reclaim ownership.

## 2. Deployment Protocol: Automated vs. Manual

### **Automated (Pro-Dev Focus)**
- **Web Templates**: The primary location for custom code.
- **Web Pages (HTML/JS)**: The core content.
- **Web Files (CSS/Images)**: Branding assets (note: `.txt` and `.exe` are often blocked by environment settings).

### **Manual (UI Setup via Portal Management App)**
- **Site Markers**: Critical for root URL resolution. "Home" and "Page Not Found" markers must point to valid Web Pages.
- **Site Settings**: Authentication and environment-specific keys.
- **Website Language**: Every site must have a linked Language record.

## 3. Enhanced Data Model (v2) Nuances
- **Model Version**: Always use `--modelVersion 2` in the PAC CLI.
- **Code Apps**: Deployment will fail with `AuthenticatedClientException` if **"Code apps"** is not enabled in the Admin Center (Settings > Features).

## 4. Multi-Site Isolation Strategy
When maintaining a "Parallel POC" in the same environment:
1.  **Unique Website ID**: Assign a fresh GUID in `website.yml`.
2.  **GUID Randomization**: You MUST use a script to randomize every component GUID in the deployment folder to ensure 100% independence from production.
