'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, useState, type ReactNode } from 'react'
import { X, Beaker } from 'lucide-react'
import { calculateBundleDiscount, normalizeJoinCartItems, getAllJoinTherapies } from '@/lib/config/join-therapies'

const BAC_WATER_ID = 'bacteriostatic-water'

// =============================================
// TYPES
// =============================================

export interface JoinCartItem {
  therapyId: string
  name: string
  /** Price per unit in USD. null = consultation/TBD pricing */
  price: number | null
  pricingNote?: string
  /** Dosage/size info (e.g. "5 MG | 3 ML") — used in QB invoice descriptions */
  note?: string
  quantity: number
}

interface JoinCartState {
  items: JoinCartItem[]
  isLoaded: boolean
}

type JoinCartAction =
  | { type: 'ADD_ITEM'; payload: Omit<JoinCartItem, 'quantity'> & { quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { therapyId: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; payload: JoinCartItem[] }

interface JoinCartContextValue {
  items: JoinCartItem[]
  isLoaded: boolean
  addItem: (item: Omit<JoinCartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (therapyId: string) => void
  updateQuantity: (therapyId: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
  isInCart: (therapyId: string) => boolean
  getCartTotal: () => number
  getBundleDiscount: () => number
  getSubtotalAfterBundle: () => number
  hasConsultationItems: () => boolean
  bacWaterJustAdded: boolean
  clearBacWaterNotification: () => void
}

// =============================================
// REDUCER
// =============================================

const STORAGE_KEY = 'cultr-join-cart'

function cartReducer(state: JoinCartState, action: JoinCartAction): JoinCartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.therapyId === action.payload.therapyId)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.therapyId === action.payload.therapyId
              ? { ...i, quantity: i.quantity + (action.payload.quantity || 1) }
              : i
          ),
        }
      }
      return {
        ...state,
        items: [
          ...state.items,
          {
            therapyId: action.payload.therapyId,
            name: action.payload.name,
            price: action.payload.price,
            pricingNote: action.payload.pricingNote,
            note: action.payload.note,
            quantity: action.payload.quantity || 1,
          },
        ],
      }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.therapyId !== action.payload) }
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.therapyId !== action.payload.therapyId) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.therapyId === action.payload.therapyId ? { ...i, quantity: action.payload.quantity } : i
        ),
      }
    }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'LOAD':
      return { ...state, items: action.payload, isLoaded: true }
    default:
      return state
  }
}

// =============================================
// CONTEXT
// =============================================

const JoinCartContext = createContext<JoinCartContextValue | null>(null)

export function JoinCartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isLoaded: false })
  const [bacWaterJustAdded, setBacWaterJustAdded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as JoinCartItem[]
        dispatch({ type: 'LOAD', payload: normalizeJoinCartItems(parsed) })
      } else {
        dispatch({ type: 'LOAD', payload: [] })
      }
    } catch {
      dispatch({ type: 'LOAD', payload: [] })
    }
  }, [])

  // Persist to localStorage on changes
  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    }
  }, [state.items, state.isLoaded])

  // Auto-dismiss the BAC water notification after 5 seconds
  useEffect(() => {
    if (!bacWaterJustAdded) return
    const timer = setTimeout(() => setBacWaterJustAdded(false), 5000)
    return () => clearTimeout(timer)
  }, [bacWaterJustAdded])

  const addItem = useCallback(
    (item: Omit<JoinCartItem, 'quantity'> & { quantity?: number }) => {
      dispatch({ type: 'ADD_ITEM', payload: item })

      // Auto-add bacteriostatic water for any non-BAC product if not already in cart
      if (
        item.therapyId !== BAC_WATER_ID &&
        !state.items.some((i) => i.therapyId === BAC_WATER_ID)
      ) {
        const bacWater = getAllJoinTherapies().find((t) => t.id === BAC_WATER_ID)
        if (bacWater) {
          dispatch({
            type: 'ADD_ITEM',
            payload: {
              therapyId: bacWater.id,
              name: bacWater.name,
              price: bacWater.price,
              pricingNote: bacWater.pricingNote,
              note: bacWater.note,
            },
          })
          setBacWaterJustAdded(true)
        }
      }
    },
    [state.items]
  )

  const removeItem = useCallback((therapyId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: therapyId })
  }, [])

  const updateQuantity = useCallback((therapyId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { therapyId, quantity } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const getItemCount = useCallback(() => {
    return state.items.reduce((sum, i) => sum + i.quantity, 0)
  }, [state.items])

  const isInCart = useCallback(
    (therapyId: string) => state.items.some((i) => i.therapyId === therapyId),
    [state.items]
  )

  const getCartTotal = useCallback(() => {
    return state.items.reduce((sum, i) => (i.price ? sum + i.price * i.quantity : sum), 0)
  }, [state.items])

  const hasConsultationItems = useCallback(() => {
    return state.items.some((i) => i.price === null)
  }, [state.items])

  const getBundleDiscount = useCallback(() => {
    return calculateBundleDiscount(state.items)
  }, [state.items])

  const getSubtotalAfterBundle = useCallback(() => {
    return getCartTotal() - getBundleDiscount()
  }, [getCartTotal, getBundleDiscount])

  const clearBacWaterNotification = useCallback(() => setBacWaterJustAdded(false), [])

  return (
    <JoinCartContext.Provider
      value={{
        items: state.items,
        isLoaded: state.isLoaded,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        isInCart,
        getCartTotal,
        getBundleDiscount,
        getSubtotalAfterBundle,
        hasConsultationItems,
        bacWaterJustAdded,
        clearBacWaterNotification,
      }}
    >
      {children}

      {/* Auto-add notification toast */}
      {bacWaterJustAdded && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 px-4 py-3 bg-[#D8F3DC] border border-[#B7E4C7] rounded-xl shadow-lg max-w-sm w-[calc(100vw-2rem)]"
        >
          <Beaker className="w-5 h-5 text-[#2A4542] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#2A4542]">Bacteriostatic Water added</p>
            <p className="text-xs text-[#2A4542]/70 mt-0.5">
              Required for reconstituting injectable peptides — added automatically.
            </p>
          </div>
          <button
            onClick={clearBacWaterNotification}
            aria-label="Dismiss"
            className="shrink-0 text-[#2A4542]/50 hover:text-[#2A4542] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </JoinCartContext.Provider>
  )
}

export function useJoinCart() {
  const ctx = useContext(JoinCartContext)
  if (!ctx) {
    throw new Error('useJoinCart must be used within <JoinCartProvider>')
  }
  return ctx
}
