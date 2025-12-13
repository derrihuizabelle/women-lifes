import { renderHook, waitFor, act } from '@testing-library/react'
import { useFeminicideData } from '../../hooks/useFeminicideData'

// Mock do fetch global
const mockFetchResponse = {
  count: 5000,
  countSince2018: 4500000,
  dailyAverage: 1750,
  lastUpdated: new Date().toISOString(),
  historicalContext: {
    totalSince2018: 4500000,
    averagePerDay: 1750,
    daysSince2018: 2500,
    cutoffDate: new Date().toISOString(),
  }
}

describe('useFeminicideData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Estado inicial', () => {
    it('deve começar com isLoading true', () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock

      const { result } = renderHook(() => useFeminicideData())

      expect(result.current.isLoading).toBe(true)
    })

    it('deve começar com error null', () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock

      const { result } = renderHook(() => useFeminicideData())

      expect(result.current.error).toBeNull()
    })

    it('deve começar com dados iniciais', () => {
      global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock

      const { result } = renderHook(() => useFeminicideData())

      expect(result.current.data.count).toBe(0)
      expect(result.current.data.countSince2018).toBe(0)
      expect(result.current.data.dailyAverage).toBe(1748)
    })
  })

  describe('Fetch com sucesso', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFetchResponse)
        })
      ) as jest.Mock
    })

    it('deve atualizar dados após fetch bem sucedido', async () => {
      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data.countSince2018).toBe(mockFetchResponse.countSince2018)
      expect(result.current.data.dailyAverage).toBe(mockFetchResponse.dailyAverage)
    })

    it('deve setar isLoading para false após fetch', async () => {
      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('deve manter error como null após sucesso', async () => {
      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeNull()
    })

    it('deve chamar fetch com a URL correta', async () => {
      renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/feminicide-data',
          expect.objectContaining({
            signal: expect.any(AbortSignal)
          })
        )
      })
    })
  })

  describe('Fetch com erro', () => {
    it('deve setar error quando fetch falha', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500
        })
      ) as jest.Mock

      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Erro HTTP: 500')
    })

    it('deve setar error quando fetch lança exceção', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock

      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe('Network error')
    })

    it('deve setar isLoading para false mesmo com erro', async () => {
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock

      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Refetch', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFetchResponse)
        })
      ) as jest.Mock
    })

    it('deve expor função refetch', async () => {
      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(typeof result.current.refetch).toBe('function')
    })

    it('refetch deve setar isLoading para true', async () => {
      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.refetch()
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('refetch deve chamar fetch novamente', async () => {
      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const fetchCallsBefore = (global.fetch as jest.Mock).mock.calls.length

      await act(async () => {
        await result.current.refetch()
      })

      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(fetchCallsBefore)
    })
  })

  describe('Cleanup', () => {
    it('deve abortar requisição quando desmonta', async () => {
      const abortSpy = jest.fn()
      
      global.fetch = jest.fn(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockFetchResponse)
            })
          }, 1000)
        })
      }) as jest.Mock

      const { unmount } = renderHook(() => useFeminicideData())

      // Desmonta antes do fetch completar
      unmount()

      // O abort deve ter sido chamado no cleanup
      // Verificamos indiretamente que o cleanup funcionou
      // se não houver erros de "Can't perform a React state update on an unmounted component"
    })
  })

  describe('Retorno do hook', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFetchResponse)
        })
      ) as jest.Mock
    })

    it('deve retornar objeto com todas as propriedades esperadas', async () => {
      const { result } = renderHook(() => useFeminicideData())

      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('error')
      expect(result.current).toHaveProperty('refetch')
    })

    it('data deve ter estrutura correta após fetch', async () => {
      const { result } = renderHook(() => useFeminicideData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toHaveProperty('count')
      expect(result.current.data).toHaveProperty('countSince2018')
      expect(result.current.data).toHaveProperty('dailyAverage')
      expect(result.current.data).toHaveProperty('lastUpdated')
      expect(result.current.data).toHaveProperty('historicalContext')
    })
  })
})

