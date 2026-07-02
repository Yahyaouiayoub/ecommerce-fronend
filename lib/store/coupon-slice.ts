import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { checkCoupon, type CouponFormData } from "@/lib/api/services"
interface CouponDetails {
  code: string
  type: string
  value: number
}

interface CouponState {
  /** Currently applied coupon code */
  code: string | null
  /** Computed discount amount */
  discount: number
  /** The coupon details returned from the server */
  details: CouponDetails | null
  /** Whether this coupon was auto-applied */
  isAutoApply: boolean
  /** Whether the coupon is being checked */
  checking: boolean
  /** Error message if validation failed */
  error: string | null
}

const initialState: CouponState = {
  code: null,
  discount: 0,
  details: null,
  isAutoApply: false,
  checking: false,
  error: null,
}

// ─── Async thunks ────────────────────────────────────────────────

/** Check/validate a coupon code with the server */
export const checkCouponAsync = createAsyncThunk(
  "coupon/checkCouponAsync",
  async (
    { code, subtotal, guestEmail }: { code: string; subtotal: number; guestEmail?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await checkCoupon(code, subtotal, guestEmail)
      if (!res.valid) {
        return rejectWithValue(res.message)
      }
      return {
        code: res.coupon!.code,
        discount: res.discount!,
        details: res.coupon!,
        isAutoApply: res.is_auto_apply ?? false,
      }
    } catch (err: unknown) {
      return rejectWithValue(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Could not validate coupon. Try again.",
      )
    }
  },
)

// ─── Slice ───────────────────────────────────────────────────────

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    /** Apply a coupon (store code and discount) */
    applyCoupon: (
      state,
      action: PayloadAction<{ code: string; discount: number; details: CouponDetails; isAutoApply?: boolean }>,
    ) => {
      state.code = action.payload.code
      state.discount = action.payload.discount
      state.details = action.payload.details
      state.isAutoApply = action.payload.isAutoApply ?? false
      state.error = null
    },
    /** Remove the applied coupon */
    removeCoupon: (state) => {
      state.code = null
      state.discount = 0
      state.details = null
      state.isAutoApply = false
      state.error = null
    },
    /** Clear any coupon error */
    clearCouponError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkCouponAsync.pending, (state) => {
        state.checking = true
        state.error = null
      })
      .addCase(checkCouponAsync.fulfilled, (state, action) => {
        state.checking = false
        state.code = action.payload.code
        state.discount = action.payload.discount
        state.details = action.payload.details
        state.isAutoApply = action.payload.isAutoApply
        state.error = null
      })
      .addCase(checkCouponAsync.rejected, (state, action) => {
        state.checking = false
        state.error = (action.payload as string) || "Invalid coupon"
      })
  },
})

export const { applyCoupon, removeCoupon, clearCouponError } = couponSlice.actions

export default couponSlice.reducer
