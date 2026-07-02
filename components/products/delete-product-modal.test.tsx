import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DeleteProductModal } from "./delete-product-modal"
import type { ProductReferences } from "@/lib/types"

// jsdom does not support the native <dialog> element API (showModal/close).
// We polyfill them so the component works in tests.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function mockShowModal(this: HTMLDialogElement) {
    this.open = true
  })
  HTMLDialogElement.prototype.close = vi.fn(function mockClose(this: HTMLDialogElement) {
    this.open = false
  })
})

const baseProps = {
  productName: "Test Product",
  references: null,
  loading: false,
  deleting: false,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
}

// Sample references for a product linked to other data
const sampleReferences: ProductReferences = {
  has_references: true,
  references: {
    orders: 3,
    invoices: 2,
    reviews: 1,
    wishlists: 5,
    carts: 0,
    expenses: 1,
    coupons: 0,
  },
}

// =========================
// BASIC RENDERING
// =========================
describe("DeleteProductModal", () => {
  it("renders the title 'Delete Product'", () => {
    render(<DeleteProductModal {...baseProps} />)
    expect(screen.getByText("Delete Product")).toBeInTheDocument()
  })

  it("renders the product name in quotes", () => {
    render(<DeleteProductModal {...baseProps} productName="My Awesome Product" />)
    // The name is wrapped in &ldquo; and &rdquo; (smart quotes)
    expect(screen.getByText("\u201cMy Awesome Product\u201d")).toBeInTheDocument()
  })

  it("renders the 'This action cannot be undone' warning", () => {
    render(<DeleteProductModal {...baseProps} />)
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument()
  })

  it("renders the confirmation question", () => {
    render(<DeleteProductModal {...baseProps} />)
    expect(
      screen.getByText("Are you sure you want to permanently delete this product?"),
    ).toBeInTheDocument()
  })

  it("renders the Cancel button", () => {
    render(<DeleteProductModal {...baseProps} />)
    expect(screen.getByText("Cancel")).toBeInTheDocument()
  })

  it("renders the Delete Permanently button", () => {
    render(<DeleteProductModal {...baseProps} />)
    expect(screen.getByText("Delete Permanently")).toBeInTheDocument()
  })

  it("renders the close (X) button", () => {
    render(<DeleteProductModal {...baseProps} />)
    // The X icon button: look for the close button with aria-label
    expect(screen.getByLabelText("Close")).toBeInTheDocument()
  })

  it("does not render the references warning when references is null", () => {
    render(<DeleteProductModal {...baseProps} references={null} />)
    expect(
      screen.queryByText("This product may already be referenced by:"),
    ).not.toBeInTheDocument()
  })

  it("does not render the references warning when has_references is false", () => {
    render(
      <DeleteProductModal
        {...baseProps}
        references={{
          has_references: false,
          references: {
            orders: 0,
            invoices: 0,
            reviews: 0,
            wishlists: 0,
            carts: 0,
            expenses: 0,
            coupons: 0,
          },
        }}
      />,
    )
    expect(
      screen.queryByText("This product may already be referenced by:"),
    ).not.toBeInTheDocument()
  })

  it("renders the dialog element with correct attributes", () => {
    const { container } = render(<DeleteProductModal {...baseProps} />)
    const dialog = container.querySelector("dialog")
    expect(dialog).toBeInTheDocument()
  })
})

// =========================
// LOADING STATE
// =========================
describe("DeleteProductModal — loading state", () => {
  it("shows a spinner and 'Checking product references...' when loading", () => {
    render(<DeleteProductModal {...baseProps} loading={true} />)
    expect(screen.getByText("Checking product references...")).toBeInTheDocument()
  })

  it("disables Cancel and Delete buttons when loading", () => {
    render(<DeleteProductModal {...baseProps} loading={true} />)
    expect(screen.getByText("Cancel").closest("button")).toBeDisabled()
    expect(screen.getByText("Delete Permanently").closest("button")).toBeDisabled()
  })

  it("does not show reference warning while loading", () => {
    render(
      <DeleteProductModal
        {...baseProps}
        loading={true}
        references={sampleReferences}
      />,
    )
    expect(
      screen.queryByText("This product may already be referenced by:"),
    ).not.toBeInTheDocument()
  })

  it("still shows the 'cannot be undone' warning while loading", () => {
    render(<DeleteProductModal {...baseProps} loading={true} />)
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument()
  })
})

// =========================
// DELETE (LOADING) STATE
// =========================
describe("DeleteProductModal — deleting state", () => {
  it("shows 'Deleting...' text when deleting is true", () => {
    render(<DeleteProductModal {...baseProps} deleting={true} />)
    expect(screen.getByText("Deleting...")).toBeInTheDocument()
  })

  it("disables Cancel and Delete buttons when deleting", () => {
    render(<DeleteProductModal {...baseProps} deleting={true} />)
    expect(screen.getByText("Cancel").closest("button")).toBeDisabled()
    expect(screen.getByText("Deleting...").closest("button")).toBeDisabled()
  })

  it("does not show 'Delete Permanently' while deleting", () => {
    render(<DeleteProductModal {...baseProps} deleting={true} />)
    expect(screen.queryByText("Delete Permanently")).not.toBeInTheDocument()
  })
})

// =========================
// REFERENCES WARNING
// =========================
describe("DeleteProductModal — references warning", () => {
  it("shows the references warning header when has_references is true", () => {
    render(
      <DeleteProductModal {...baseProps} references={sampleReferences} />,
    )
    expect(
      screen.getByText("This product may already be referenced by:"),
    ).toBeInTheDocument()
  })

  it("shows only references with non-zero counts", () => {
    render(
      <DeleteProductModal {...baseProps} references={sampleReferences} />,
    )
    // Should show
    expect(screen.getByText("Orders")).toBeInTheDocument()
    expect(screen.getByText("Invoices")).toBeInTheDocument()
    expect(screen.getByText("Reviews")).toBeInTheDocument()
    expect(screen.getByText("Wishlist")).toBeInTheDocument()
    expect(screen.getByText("Expenses")).toBeInTheDocument()

    // Should NOT show zero-count references
    expect(screen.queryByText("Shopping Carts")).not.toBeInTheDocument()
    expect(screen.queryByText("Coupons")).not.toBeInTheDocument()

    // Verify specific count values are present for each reference label
    // Each reference row contains its label text and count value
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    // There are two rows with count "1" (Reviews and Expenses)
    expect(screen.getAllByText("1")).toHaveLength(2)
  })

  it("shows the historical data warning text", () => {
    render(
      <DeleteProductModal {...baseProps} references={sampleReferences} />,
    )
    expect(
      screen.getByText(
        "Deleting this product may affect historical data and reporting.",
      ),
    ).toBeInTheDocument()
  })
})

// =========================
// INTERACTIONS
// =========================
describe("DeleteProductModal — interactions", () => {
  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DeleteProductModal {...baseProps} onClose={onClose} />)

    await user.click(screen.getByText("Cancel"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("calls onConfirm when Delete Permanently is clicked", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<DeleteProductModal {...baseProps} onConfirm={onConfirm} />)

    await user.click(screen.getByText("Delete Permanently"))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("does not call onClose when Cancel is clicked during deleting", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <DeleteProductModal {...baseProps} deleting={true} onClose={onClose} />,
    )

    // Button is disabled; clicking should have no effect
    await user.click(screen.getByText("Cancel").closest("button")!)
    expect(onClose).not.toHaveBeenCalled()
  })

  it("does not call onConfirm when Delete is clicked during deleting", async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <DeleteProductModal
        {...baseProps}
        deleting={true}
        onConfirm={onConfirm}
      />,
    )

    await user.click(screen.getByText("Deleting...").closest("button")!)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

// =========================
// KEYBOARD & ACCESSIBILITY
// =========================
describe("DeleteProductModal — keyboard and accessibility", () => {
  it("calls onClose when Escape is pressed and not deleting", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DeleteProductModal {...baseProps} onClose={onClose} />)

    await user.keyboard("{Escape}")
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("does not call onClose on Escape when deleting", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <DeleteProductModal {...baseProps} deleting={true} onClose={onClose} />,
    )

    await user.keyboard("{Escape}")
    expect(onClose).not.toHaveBeenCalled()
  })

  it("calls onClose when backdrop is clicked and not deleting", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <DeleteProductModal {...baseProps} onClose={onClose} />,
    )

    // Click the dialog backdrop (the <dialog> element itself)
    const dialog = container.querySelector("dialog")!
    await user.click(dialog)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("does not call onClose when backdrop is clicked while deleting", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const { container } = render(
      <DeleteProductModal
        {...baseProps}
        deleting={true}
        onClose={onClose}
      />,
    )

    const dialog = container.querySelector("dialog")!
    await user.click(dialog)
    expect(onClose).not.toHaveBeenCalled()
  })

  it("does not call onClose when clicking inside the modal content", async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DeleteProductModal {...baseProps} onClose={onClose} />)

    // Click the Cancel button (inside the modal content)
    await user.click(screen.getByText("Cancel"))
    expect(onClose).toHaveBeenCalledTimes(1) // from Cancel click, not from backdrop
  })
})
