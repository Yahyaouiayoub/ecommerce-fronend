import { configureStore, createSelector } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import cartReducer from "./cart-slice"
import productsReducer from "./products-slice"
import ordersReducer from "./orders-slice"
import usersReducer from "./users-slice"
import expensesReducer from "./expenses-slice"
import invoicesReducer from "./invoices-slice"
import wishlistReducer from "./wishlist-slice"
import couponReducer from "./coupon-slice"

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    products: productsReducer,
    orders: ordersReducer,
    users: usersReducer,
    expenses: expensesReducer,
    invoices: invoicesReducer,
    wishlist: wishlistReducer,
    coupon: couponReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Cart selectors
export const selectCartItems = (state: RootState) => state.cart.items
export const selectCartCount = (state: RootState) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0)
export const selectCartSubtotal = (state: RootState) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

// Products selectors
export const selectProducts = (state: RootState) => state.products.items
export const selectProductsLoading = (state: RootState) => state.products.loading
export const selectProductsError = (state: RootState) => state.products.error
export const selectProductsPagination = createSelector(
  [(state: RootState) => state.products.total,
   (state: RootState) => state.products.currentPage,
   (state: RootState) => state.products.lastPage],
  (total, currentPage, lastPage) => ({ total, currentPage, lastPage })
)
export const selectProductsUpdating = (state: RootState) => state.products.updatingIds

// Orders selectors
export const selectOrders = (state: RootState) => state.orders.items
export const selectOrdersLoading = (state: RootState) => state.orders.loading
export const selectOrdersUpdating = (state: RootState) => state.orders.updatingIds

// Users selectors
export const selectUsers = (state: RootState) => state.users.items
export const selectUsersLoading = (state: RootState) => state.users.loading
export const selectUsersError = (state: RootState) => state.users.error
export const selectUsersPagination = (state: RootState) => ({
  total: state.users.total,
  currentPage: state.users.currentPage,
  lastPage: state.users.lastPage,
})
export const selectUsersDeleting = (state: RootState) => state.users.deletingIds

// Expenses selectors
export const selectExpenses = (state: RootState) => state.expenses.items
export const selectExpensesLoading = (state: RootState) => state.expenses.loading
export const selectExpensesError = (state: RootState) => state.expenses.error
export const selectExpensesPagination = (state: RootState) => ({
  total: state.expenses.total,
  currentPage: state.expenses.currentPage,
  lastPage: state.expenses.lastPage,
})
export const selectExpensesUpdating = (state: RootState) => state.expenses.updatingIds

// Invoices selectors
export const selectInvoices = (state: RootState) => state.invoices.items
export const selectInvoicesLoading = (state: RootState) => state.invoices.loading
export const selectInvoicesUpdating = (state: RootState) => state.invoices.updatingIds
export const selectInvoicesPagination = (state: RootState) => ({
  total: state.invoices.total,
  currentPage: state.invoices.currentPage,
  lastPage: state.invoices.lastPage,
})

// Coupon selectors
export const selectCouponCode = (state: RootState) => state.coupon.code
export const selectCouponDiscount = (state: RootState) => state.coupon.discount
export const selectCouponDetails = (state: RootState) => state.coupon.details
export const selectCouponChecking = (state: RootState) => state.coupon.checking
export const selectCouponError = (state: RootState) => state.coupon.error
export const selectCouponIsAutoApply = (state: RootState) => state.coupon.isAutoApply
export const selectCouponSubtotal = (state: RootState) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0)

// Wishlist selectors
export const selectWishlistItems = (state: RootState) => state.wishlist.items
export const selectWishlistCount = (state: RootState) => state.wishlist.items.length
export const selectIsInWishlist = (productId: number) => (state: RootState) =>
  state.wishlist.items.some((i) => i.productId === productId)
