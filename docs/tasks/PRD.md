# Digit Recognition / Neural Network Visualizer - Product Requirements Document (PRD)

## Introduction
This Product Requirements Document (PRD) outlines the remaining tasks required to complete and harden the Digit Recognition project. The project currently features a functional FastAPI/Python backend serving a highly accurate NumPy Feed-Forward Neural Network and a PyTorch Convolutional Neural Network (CNN). The frontend is a React application built with Vite and TailwindCSS that allows users to draw digits and visualize the network's forward pass in real time.

The primary goal of this PRD is to introduce robust testing, improve accessibility, and harden error handling **without altering the existing, fully working machine learning pipeline.**

---

## Global Constraints

1. **ML Architecture Preservation:** The existing ML model architectures (784 → 128 → 64 → 10 for NumPy, and the PyTorch CNN structure) must NOT be modified.
2. **Real Data Only:** All frontend visualisations MUST use real data returned by the backend. Hardcoded neural-network values, fake activations, simulated confidence scores, or placeholder math are strictly prohibited.
3. **No Unnecessary Rewrites:** Existing functional code must not be refactored merely for stylistic reasons.
4. **Project Integrity:** The project must remain runnable after every single task.

---

## Tasks

### T001: Frontend Testing Infrastructure Setup
**Objective:** Establish a robust frontend testing environment.
**Existing Code / Files:** `frontend/package.json`, `frontend/vite.config.ts`.
**Implementation Requirements:**
- Install `vitest`, `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom` as devDependencies.
- Update `vite.config.ts` to support Vitest testing.
- Add a `"test"` script to `package.json`.
- Create a basic setup file (e.g., `frontend/src/setupTests.ts`) to import jest-dom matchers.
**Constraints:** Do not break the existing `"dev"` or `"build"` scripts.
**Acceptance Criteria:** `npm run test` executes successfully and Vitest runs without configuration errors.
**Verification:** Run the test script and verify it reports 0 tests found or passes a dummy test.
**Dependencies:** None.

### T002: Frontend Service and Utility Tests
**Objective:** Add unit tests for the core API service.
**Existing Code / Files:** `frontend/src/services/api.ts`.
**Implementation Requirements:**
- Create `frontend/src/services/api.test.ts`.
- Mock the global `fetch` API.
- Test the `fetchHealth` function and the generic `request` wrapper.
- Verify that `ApiError` is correctly thrown on non-2xx responses.
**Constraints:** Do not change the implementation of `api.ts`.
**Acceptance Criteria:** All API wrapper logic is covered by passing unit tests.
**Verification:** Run `npm run test -- api.test.ts` to ensure the tests pass.
**Dependencies:** T001.

### T003: DrawingCanvas Component Accessibility & Testing
**Objective:** Improve accessibility (a11y) of the canvas and add component tests.
**Existing Code / Files:** `frontend/src/components/DrawingCanvas.tsx`.
**Implementation Requirements:**
- Add an `aria-label` to the `<canvas>` element (e.g., "Drawing canvas for digit recognition").
- Ensure buttons (Clear, Predict) have appropriate accessible names.
- Create `frontend/src/components/DrawingCanvas.test.tsx`.
- Write tests verifying that the canvas renders and buttons trigger their respective callbacks when interacted with.
**Constraints:** Do not alter the canvas drawing logic, stroke width, or coordinate scaling math.
**Acceptance Criteria:** Screen readers can identify the canvas, and unit tests pass.
**Verification:** Run `npm run test -- DrawingCanvas.test.tsx`.
**Dependencies:** T001.

### T004: Global Error Boundary Implementation
**Objective:** Prevent React from showing a blank white screen if a rendering error occurs.
**Existing Code / Files:** `frontend/src/main.tsx` or `frontend/src/App.tsx`.
**Implementation Requirements:**
- Create a new component `frontend/src/components/ErrorBoundary.tsx` that implements the standard React error boundary lifecycle methods (`getDerivedStateFromError`, `componentDidCatch`).
- Wrap the main application component tree inside this Error Boundary.
- Display a user-friendly fallback UI with an option to reload the page when a crash occurs.
**Constraints:** Do not modify the existing API error handling in `DigitRecognitionPage.tsx`, which already correctly handles network errors.
**Acceptance Criteria:** An artificial throw inside a component triggers the Error Boundary UI instead of a blank page.
**Verification:** Temporarily inject a `throw new Error("test")` into a component to verify the fallback UI appears, then remove the throw.
**Dependencies:** None.

### T005: End-to-End (E2E) Testing Setup
**Objective:** Validate the complete user flow from a real browser.
**Existing Code / Files:** `frontend/package.json`.
**Implementation Requirements:**
- Install `@playwright/test` into the frontend directory.
- Initialize Playwright configuration (`playwright.config.ts`).
- Create `frontend/e2e/app.spec.ts`.
- Write a test that visits the application, verifies the canvas is present, and checks that the API health endpoint resolves.
**Constraints:** Do not mock the backend for E2E tests; assume the backend is running.
**Acceptance Criteria:** Playwright can successfully open the app and execute a basic sanity test.
**Verification:** Run `npx playwright test` and ensure the test passes.
**Dependencies:** None.

### T006: Backend Structured Logging (Optional Hardening)
**Objective:** Improve backend observability by switching to structured logging.
**Existing Code / Files:** `backend/app/main.py`, `backend/app/preprocessing/image_processor.py`, `backend/app/dataset/mnist_loader.py`.
**Implementation Requirements:**
- Configure the standard Python `logging` module to format logs with timestamps and log levels.
- Ensure that the startup script or `main.py` applies this configuration globally.
**Constraints:** Do not change API endpoint contracts or JSON response structures. Do not add heavy 3rd-party logging libraries (keep it standard library based).
**Acceptance Criteria:** Backend terminal output shows properly formatted timestamps and log levels.
**Verification:** Start the backend and verify terminal output format.
**Dependencies:** None.

### T007: Final Project Verification
**Objective:** Perform a complete regression check on the entire application.
**Existing Code / Files:** Entire repository.
**Implementation Requirements:**
- Start the FastAPI backend.
- Start the Vite frontend.
- Navigate to the UI in a browser.
- Draw a digit and observe the prediction.
- Run backend tests: `pytest` (Must pass all 78 tests).
- Run frontend unit tests: `npm run test`
- Run E2E tests: `npx playwright test`
- Verify that Jupyter notebooks in `notebooks/` still execute properly.
**Constraints:** Do not modify any code unless a severe regression is found.
**Acceptance Criteria:** All checks pass without errors.
**Verification:** Manual verification of the steps listed above.
**Dependencies:** T001, T002, T003, T004, T005, T006.

---

## Ralph Execution Rules

To ensure safe autonomous execution, Ralph must adhere to the following rules at all times:

1. **Read Before Modifying:** Always use file viewing/listing tools to inspect the target files and their immediate dependencies before proposing or making changes.
2. **Single Task Focus:** Work on exactly one task (e.g., T001) at a time.
3. **Sequential Completion:** Complete, verify, and document the current task before starting the next.
4. **Scope Containment:** Never modify files that are not explicitly related to the active task.
5. **Respect Working Code:** Never rewrite, refactor, or delete working code without a concrete, documented reason derived from the PRD.
6. **No Fake Data:** Never invent missing functionality. Never use fake, hardcoded, or randomly generated ML results for the UI. The UI must always derive its state from the actual `fetch` API responses.
7. **Continuous Verification:** Run relevant tests (e.g., `npm run test`, `pytest`) immediately after implementing changes.
8. **Fix Before Proceeding:** If a test fails, you must fix the failure before considering the task complete.
9. **Minimalism:** Keep changes minimal, focused, and directly tied to the acceptance criteria.
10. **Report Progress:** Update the user after each completed task.
11. **Safety First:** If a requirement is ambiguous, inspect the existing implementation and documentation before making assumptions. If a task cannot be safely completed, document the blocker and halt rather than making a risky change.

---

## Definition of Done
A task is considered "Done" when:
- The implementation precisely matches the PRD requirements.
- No constraints were violated.
- Acceptance criteria are fully met.
- The verification step was executed and passed.
- The application starts and functions without errors.

## Final Verification Checklist
- [ ] Backend tests passing (`pytest`).
- [ ] Frontend unit tests passing (`vitest`).
- [ ] Frontend E2E tests passing (`playwright`).
- [ ] Application starts successfully (`npm run dev` & `uvicorn app.main:app`).
- [ ] Canvas drawing triggers correct API flow.
- [ ] Neural network visualization updates with REAL backend data.
- [ ] Jupyter notebooks remain functional.
