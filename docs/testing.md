# Teststrategie en Uitvoering

Voor configuratiebestanden zoals `jest.config.ts` en MSW/Cypress voorbeelden, zie de [hoofd README.md](./README.md).

## 1. Teststrategie Overzicht
    - Soorten tests: Unit, Integratie, End-to-End (E2E).
    - Doel en scope per testtype.
    - Gebruikte tools:
        - Unit/Integratie: Jest, React Testing Library, MSW
        - E2E: Cypress

## 2. Unit Tests
    - Focus: Individuele functies, utility's, geïsoleerde React component props/rendering.
    - Uitvoering: `npm test -- <testbestandsnaam>`
    - Mocks: `jest.fn()`, `jest.spyOn()`, handmatige mocks in `__mocks__` mappen.

## 3. Integratie Tests
    - Focus: Interactie tussen componenten, state changes, context, hooks, en gemockte service/API calls.
    - Voorbeeld: Testen van een formulier component inclusief state updates en de `onSubmit` call met gemockte API.
    - Mock Service Worker (MSW) wordt gebruikt om HTTP requests naar Supabase en Edge Functions te onderscheppen en te mocken (zie `src/mocks/handlers.ts` in `README_huidig.md` voor voorbeelden).
    - Uitvoering: `npm test -- <testbestandsnaam>`

## 4. End-to-End (E2E) Tests
    - Focus: Volledige gebruikersflows door de live (of bijna-live) applicatie.
    - Tool: Cypress.
    - Setup: (Verwijs naar `cypress.config.ts` indien aanwezig, en hoe de dev server gestart moet worden).
    - Voorbeeld E2E tests (zoals `auth.cy.ts` in `README_huidig.md`).
    - Uitvoering:
        ```bash
        npm run cypress:open # (of het commando om Cypress UI te openen)
        npm run cypress:run  # (of het commando om headless te draaien, bv. in CI)
        ```
    - Test Data Management voor E2E (bv. seeding, API calls in `beforeEach`).

## 5. Uitvoeren van Alle Tests
    - `npm test` (draait alle Jest unit/integratie tests).
    - Commando voor alle Cypress tests.
    - Test coverage: `npm test -- --coverage`. Output is te vinden in de `coverage/` map.

## 6. Mocking Strategie
### 6.1. Supabase Client
    - Voor unit/integratie tests kan de Supabase client gemockt worden (zie `src/utils/test-utils.tsx` voor een `mockSupabaseClient` voorbeeld).
    - Voor tests die daadwerkelijke API calls simuleren, wordt MSW gebruikt.
### 6.2. Edge Functions
    - Gemockt via MSW (zie `Register` functie mock in `src/mocks/handlers.ts`).
### 6.3. Authenticatie
    - Testen van `ProtectedRoute` en auth-afhankelijke logica door de `authStore` te mocken of de responses van Supabase Auth via MSW te sturen.

## 7. Test Coverage
    - Streefdoel: (bv. 80% voor alle categorieën, zoals in `jest.config.ts`).
    - Hoe coverage te bekijken en verbeteren. 