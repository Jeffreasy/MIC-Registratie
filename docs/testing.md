# Testing Documentatie

## Jest Setup
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

## Test Utilities
```typescript
// src/utils/test-utils.tsx
import { render as rtlRender } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const mockSupabaseClient = createClient('mock-url', 'mock-key')

export function render(ui: React.ReactElement, options = {}) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
```

## Mock Service Worker Setup
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.post('/functions/v1/Register', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        userId: 'mock-user-id'
      })
    )
  }),

  rest.get('/rest/v1/profiles', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          {
            id: 'mock-id',
            email: 'test@example.com',
            role: 'medewerker'
          }
        ]
      })
    )
  })
]
```

## Example Test Cases
```typescript
// src/components/Auth/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@/utils/test-utils'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('validates required fields', async () => {
    render(<LoginForm onSubmit={jest.fn()} />)
    
    fireEvent.click(screen.getByRole('button', { name: /inloggen/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/email is verplicht/i)).toBeInTheDocument()
      expect(screen.getByText(/wachtwoord is verplicht/i)).toBeInTheDocument()
    })
  })

  it('calls onSubmit with form data', async () => {
    const mockOnSubmit = jest.fn()
    render(<LoginForm onSubmit={mockOnSubmit} />)
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText(/wachtwoord/i), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /inloggen/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })
})
```

## End-to-End Tests with Cypress
```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should login successfully', () => {
    cy.get('[data-cy=email-input]').type('test@example.com')
    cy.get('[data-cy=password-input]').type('password123')
    cy.get('[data-cy=login-button]').click()

    cy.url().should('include', '/dashboard')
    cy.get('[data-cy=user-menu]').should('be.visible')
  })

  it('should show error on invalid credentials', () => {
    cy.get('[data-cy=email-input]').type('wrong@example.com')
    cy.get('[data-cy=password-input]').type('wrongpass')
    cy.get('[data-cy=login-button]').click()

    cy.get('[data-cy=error-message]')
      .should('be.visible')
      .and('contain', 'Ongeldige inloggegevens')
  })
})
```

## Custom Hook voor Error Handling
```typescript
interface UseErrorHandlingProps {
  onError?: (error: Error) => void;
}

const useErrorHandling = ({ onError }: UseErrorHandlingProps = {}) => {
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: Error) => {
    setError(error)
    onError?.(error)
    trackError(error)
  }, [onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const wrapAsync = useCallback(async <T,>(
    promise: Promise<T>,
    errorMessage = 'Er is een fout opgetreden'
  ): Promise<T> => {
    try {
      setIsLoading(true)
      const result = await promise
      return result
    } catch (error) {
      const wrappedError = new Error(
        error instanceof Error ? error.message : errorMessage
      )
      handleError(wrappedError)
      throw wrappedError
    } finally {
      setIsLoading(false)
    }
  }, [handleError])

  return {
    error,
    isLoading,
    clearError,
    wrapAsync,
    handleError
  }
}
``` 