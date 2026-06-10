"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"

const CART_STORAGE_KEY = "nexus_cart_v1"

interface CartItem {
  id: string
  title: string
  price: number
  image?: string
  instructor?: string
  thumbnail?: string
}

interface CartContextType {
  items: CartItem[]
  hydrated: boolean
  addToCart: (item: CartItem) => boolean
  removeFromCart: (courseId: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getItemCount: () => number
  isInCart: (courseId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function normalizeCartItem(item: CartItem): CartItem | null {
  if (!item?.id || !item?.title) return null
  const price = Number(item.price)
  if (!Number.isFinite(price) || price < 0) return null
  return {
    ...item,
    id: String(item.id),
    price,
  }
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => normalizeCartItem(item))
      .filter((item): item is CartItem => item !== null)
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setItems(readStoredCart())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const addToCart = useCallback((item: CartItem) => {
    const normalized = normalizeCartItem(item)
    if (!normalized) return false

    let added = false
    setItems((prev) => {
      if (prev.some((i) => i.id === normalized.id)) return prev
      added = true
      return [...prev, normalized]
    })
    return added
  }, [])

  const removeFromCart = useCallback((courseId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== courseId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_STORAGE_KEY, "[]")
    }
  }, [])

  const getTotalPrice = useCallback(
    () => items.reduce((total, item) => total + (Number(item.price) || 0), 0),
    [items],
  )

  const getItemCount = useCallback(() => items.length, [items])

  const isInCart = useCallback(
    (courseId: string) => items.some((i) => i.id === courseId),
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalPrice,
        getItemCount,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
