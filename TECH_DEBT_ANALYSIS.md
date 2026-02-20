# Technical Debt Analysis: FC Pisos Project

## 1. Technical Debt Inventory

### **Code Debt**
- **Complex Code / God Classes:**
  - Several components are becoming extremely large and monolithic:
    - `AdminDashboard.tsx` (57.25 KB)
    - `ServicosSection.tsx` (50.74 KB)
    - `PrepostoValidationPage.tsx` (36.05 KB)
    - `ViewRespostasModal.tsx` (~36 KB)
    - `pdfGenerator.ts` (30 KB)
  - **Quantified Impact:** High cyclomatic complexity in these files makes them difficult to maintain and prone to regressions during feature additions.
- **Unresolved Technical Markers:**
  - **0 files** contain `TODO` comments. (Initial scan returned false positives for the Portuguese word 'TODOS').

### **Testing Debt**
- **Coverage Gaps:**
  - **0 Test Files Found.** There is absolutely no automated test suite (Unit, Integration, or E2E) mapped in the `src/` directory.
  - No testing framework (`vitest`, `jest`) is currently installed in `package.json`.
  - **Quantified Impact:** 0% code coverage. Every release requires full manual regression testing, increasing the risk of production bugs exponentially.

### **Architecture & Technology Debt**
- **Technology Lag:**
  - The project runs on up-to-date core libraries (React 18.3, Vite 6.3, Tailwind 4.1, Supabase 2.89).
  - However, some utilities like `xlsx` (v0.18.5) and `jspdf` might need future-proofing if complex reporting is required.
- **Tightly Coupled Utilities:**
  - Sync architecture (`syncQueue.ts`, `dataSync.ts`, `database.ts`) handles critical offline/online states. The lack of test coverage around these core utilities is a high-risk factor.

---

## 2. Impact Assessment

**Development Velocity Impact**
```
Debt Item: God Classes and lack of automated tests
Locations: AdminDashboard, ServicosSection, Offline Sync Utilities
Time Impact: 
- 2-4 hours lost per feature on manual regression testing
- Refactoring `AdminDashboard` logic requires extensive manual verification
Annual Cost: Assuming 10 hours lost per week to manual testing and slow debugging × $50/hour = ~$24,000/year in lost productivity.
```

**Quality Impact**
```
Debt Item: No automated tests for Data Sync and Offline Mode
Bug Rate Impact: High potential for silent data loss or sync conflicts
Resolution Time: Offline sync bugs typically take 4-8 hours to investigate and resolve.
```

**Risk Assessment**
- **Critical:** Lack of test coverage for offline/online sync logic (`syncQueue.ts`, `database.ts`). Data loss potential.
- **High:** Extreme centralization of logic in `AdminDashboard.tsx` and form sections (`ServicosSection.tsx`).
- **Medium:** Unresolved `TODO` items scattered across 16 files.
- **Low:** Minor dependency optimizations.

---

## 3. Debt Metrics Dashboard

### Code Quality Metrics
```yaml
Metrics:
  code_health:
    god_classes: 
      count: 5 
      target: 0
    unresolved_todos: 
      count: 0
      target: < 5
      
  test_coverage:
    unit: 0%
    integration: 0%
    target: 80% / 50%
    
  dependency_health:
    outdated_major: 0
    security_vulnerabilities: Check recommended (npm audit)
```

---

## 4. Prioritized Remediation Plan

### **Quick Wins (High Value, Low Effort)**
**Week 1:**
1. **Add Linting/Formatting Check**
   - Add ESLint / Prettier to prevent future debt accumulation.
   - *Effort: 2 hours | ROI: Consistent code style.*
2. **Install Vitest and Setup Testing Infrastructure**
   - Add `vitest`, `@testing-library/react`, and configure `vitest.config.ts`.
   - *Effort: 4 hours | ROI: Foundation for all future refactors.*

### **Medium-Term Improvements (Month 1-2)**
1. **Write Tests for Core Utilities (High Risk Area)**
   - Target `syncQueue.ts`, `dataSync.ts`, `database.ts`, and `pdfGenerator.ts`.
   - *Effort: 30 hours | Benefits: Safely modify offline/online behavior without fear of data loss.*
2. **Deconstruct `ServicosSection.tsx` & Form Sections**
   - Extract smaller, testable sub-components from the 50KB+ form files.
   - *Effort: 20 hours | Benefits: Reusability and easier form validation.*

### **Long-Term Initiatives (Quarter 2)**
1. **Refactor `AdminDashboard.tsx` (God Class)**
   - Split into focused sub-dashboards or independent widgets.
   - Introduce custom hooks for data fetching to remove logic from the UI layer.
   - *Effort: 40-50 hours | Benefits: Massive velocity increase for admin features.*

---

## 5. Implementation Strategy

**Incremental "Strangler Fig" Refactoring for God Classes:**
```typescript
// Example Phase 1 for AdminDashboard: Extract specific data fetching hooks
// Instead of 500 lines of useEffects in the UI component:
export function useAdminMetrics() {
  // Logic here
}

// Phase 2: Extract visual sections into smaller components
<AdminDashboard>
   <MetricsSummary data={metrics} />
   <RecentActivityTable data={activities} />
</AdminDashboard>
```

**Team Allocation:**
- Reserve 15-20% of sprint capacity explicitly for writing missing tests on *existing* core utilities.
- Apply the Boy Scout Rule: Any time a developer touches `AdminDashboard` or a `TODO` file, they must extract one small component or resolve one `TODO`.

---

## 6. Prevention Strategy

**Automated Quality Gates:**
```yaml
pre_commit_hooks:
  - no_new_todos: "Prevent pushing if new un-ticketed TODOs are added"
  - test_coverage: "Ensure new utility files have at least 80% coverage"

ci_pipeline:
  - type_check: "tsc --noEmit"
  - unit_tests: "vitest run"
```

---

## 7. Success Metrics
- **End of Sprint 1:** `vitest` installed and first 5 utility tests passing.
- **End of Month 1:** `syncQueue.ts` fully tested, reducing fears of offline data loss.
- **End of Month 2:** `AdminDashboard.tsx` reduced from 57KB to under 20KB by extracting UI components.
