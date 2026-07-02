import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Pagination } from "./pagination"

// =========================
// NUMBERED VARIANT
// =========================
describe("Pagination (numbered variant)", () => {
  it("returns null when lastPage <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} lastPage={1} onPageChange={() => {}} />,
    )
    expect(container.innerHTML).toBe("")
  })

  it("returns null when lastPage = 0", () => {
    const { container } = render(
      <Pagination currentPage={1} lastPage={0} onPageChange={() => {}} />,
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders all page numbers when total <= 7", () => {
    render(<Pagination currentPage={3} lastPage={7} onPageChange={() => {}} />)

    for (let i = 1; i <= 7; i++) {
      expect(screen.getByText(String(i))).toBeInTheDocument()
    }
    // No ellipsis markers
    expect(screen.queryByText("...")).not.toBeInTheDocument()
  })

  it("renders truncated range with ellipsis for large page sets", () => {
    render(
      <Pagination currentPage={5} lastPage={10} onPageChange={() => {}} />,
    )

    // Should show: 1 ... 4 5 6 ... 10
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()

    // Ellipsis markers
    const ellipsis = screen.getAllByText("...")
    expect(ellipsis).toHaveLength(2)

    // Should NOT show unlisted numbers
    expect(screen.queryByText("2")).not.toBeInTheDocument()
    expect(screen.queryByText("3")).not.toBeInTheDocument()
    expect(screen.queryByText("7")).not.toBeInTheDocument()
    expect(screen.queryByText("8")).not.toBeInTheDocument()
    expect(screen.queryByText("9")).not.toBeInTheDocument()
  })

  it("highlights the current page button", () => {
    render(<Pagination currentPage={3} lastPage={5} onPageChange={() => {}} />)

    const page3 = screen.getByText("3")
    // The active page uses bg-primary class
    expect(page3.className).toContain("bg-primary")
    // Non-active pages don't
    expect(screen.getByText("1").className).not.toContain("bg-primary")
  })

  it("calls onPageChange when clicking a visible page number", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    // currentPage=5 is mid-range so pages 4,5,6 are all visible
    render(<Pagination currentPage={5} lastPage={10} onPageChange={onPageChange} />)

    await user.click(screen.getByText("4"))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it("disables Previous button on first page", () => {
    render(<Pagination currentPage={1} lastPage={5} onPageChange={() => {}} />)
    const buttons = screen.getAllByRole("button")
    const prevButton = buttons[0]
    expect(prevButton).toBeDisabled()
  })

  it("disables Next button on last page", () => {
    render(<Pagination currentPage={5} lastPage={5} onPageChange={() => {}} />)
    const buttons = screen.getAllByRole("button")
    const nextButton = buttons[buttons.length - 1]
    expect(nextButton).toBeDisabled()
  })

  it("calls onPageChange with prev/next values", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination currentPage={3} lastPage={10} onPageChange={onPageChange} />)

    const buttons = screen.getAllByRole("button")
    const prevButton = buttons[0]
    const nextButton = buttons[buttons.length - 1]

    await user.click(prevButton)
    expect(onPageChange).toHaveBeenCalledWith(2)

    await user.click(nextButton)
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it("renders GoToPageInput", () => {
    render(<Pagination currentPage={3} lastPage={10} onPageChange={() => {}} />)
    expect(screen.getByLabelText("Go to page")).toBeInTheDocument()
  })

  it("navigates via GoToPageInput on Enter", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination currentPage={3} lastPage={10} onPageChange={onPageChange} />)

    const input = screen.getByLabelText("Go to page")
    await user.type(input, "7")
    await user.keyboard("{Enter}")

    expect(onPageChange).toHaveBeenCalledWith(7)
  })

  it("GoToPageInput does not navigate for invalid values", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination currentPage={3} lastPage={10} onPageChange={onPageChange} />)

    const input = screen.getByLabelText("Go to page")

    // Out of range (too high)
    await user.type(input, "99")
    await user.keyboard("{Enter}")
    expect(onPageChange).not.toHaveBeenCalled()

    // Out of range (too low)
    await user.clear(input)
    await user.type(input, "0")
    await user.keyboard("{Enter}")
    expect(onPageChange).not.toHaveBeenCalled()

    // Non-numeric
    await user.clear(input)
    await user.type(input, "abc")
    await user.keyboard("{Enter}")
    expect(onPageChange).not.toHaveBeenCalled()
  })

  // Truncation edge cases — verified via rendered button text
  describe("truncation edge cases", () => {
    it("current near start: shows 1-5 ... N", () => {
      render(<Pagination currentPage={1} lastPage={10} onPageChange={() => {}} />)
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("5")).toBeInTheDocument()
      expect(screen.getByText("10")).toBeInTheDocument()
      expect(screen.getAllByText("...")).toHaveLength(1)

      // Should NOT show middle-out-of-window pages
      expect(screen.queryByText("6")).not.toBeInTheDocument()
      expect(screen.queryByText("7")).not.toBeInTheDocument()
    })

    it("current near end: shows 1 ... N-4 N-3 N-2 N-1 N", () => {
      render(<Pagination currentPage={10} lastPage={10} onPageChange={() => {}} />)
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("6")).toBeInTheDocument()
      expect(screen.getByText("7")).toBeInTheDocument()
      expect(screen.getByText("8")).toBeInTheDocument()
      expect(screen.getByText("9")).toBeInTheDocument()
      expect(screen.getByText("10")).toBeInTheDocument()
      expect(screen.getAllByText("...")).toHaveLength(1)
    })

    it("current in middle: shows 1 ... cur-1 cur cur+1 ... N", () => {
      render(<Pagination currentPage={5} lastPage={10} onPageChange={() => {}} />)
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("4")).toBeInTheDocument()
      expect(screen.getByText("5")).toBeInTheDocument()
      expect(screen.getByText("6")).toBeInTheDocument()
      expect(screen.getByText("10")).toBeInTheDocument()
      expect(screen.getAllByText("...")).toHaveLength(2)
    })

    it("boundary total=8: transitions from all-pages to truncation", () => {
      render(<Pagination currentPage={1} lastPage={8} onPageChange={() => {}} />)
      expect(screen.getByText("1")).toBeInTheDocument()
      expect(screen.getByText("5")).toBeInTheDocument()
      expect(screen.getByText("8")).toBeInTheDocument()
      expect(screen.getAllByText("...")).toHaveLength(1)
    })
  })
})

// =========================
// SIMPLE VARIANT
// =========================
describe("Pagination (simple variant)", () => {
  it("returns null when lastPage <= 1", () => {
    const { container } = render(
      <Pagination simple currentPage={1} lastPage={1} onPageChange={() => {}} />,
    )
    expect(container.innerHTML).toBe("")
  })

  it("renders 'Page X of Y' text", () => {
    render(<Pagination simple currentPage={3} lastPage={10} onPageChange={() => {}} />)
    expect(screen.getByText("Page 3 of 10")).toBeInTheDocument()
  })

  it("renders Previous and Next buttons", () => {
    render(<Pagination simple currentPage={3} lastPage={10} onPageChange={() => {}} />)
    expect(screen.getByText("Previous")).toBeInTheDocument()
    expect(screen.getByText("Next")).toBeInTheDocument()
  })

  it("disables Previous on first page", () => {
    render(<Pagination simple currentPage={1} lastPage={5} onPageChange={() => {}} />)
    expect(screen.getByText("Previous").closest("button")).toBeDisabled()
  })

  it("disables Next on last page", () => {
    render(<Pagination simple currentPage={5} lastPage={5} onPageChange={() => {}} />)
    expect(screen.getByText("Next").closest("button")).toBeDisabled()
  })

  it("calls onPageChange with prev/next values", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination simple currentPage={3} lastPage={10} onPageChange={onPageChange} />)

    await user.click(screen.getByText("Previous"))
    expect(onPageChange).toHaveBeenCalledWith(2)

    await user.click(screen.getByText("Next"))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it("renders GoToPageInput", () => {
    render(<Pagination simple currentPage={3} lastPage={10} onPageChange={() => {}} />)
    expect(screen.getByLabelText("Go to page")).toBeInTheDocument()
  })

  it("navigates via GoToPageInput on blur", async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<Pagination simple currentPage={3} lastPage={10} onPageChange={onPageChange} />)

    const input = screen.getByLabelText("Go to page")
    await user.type(input, "7")
    // Trigger blur by tabbing
    await user.tab()

    expect(onPageChange).toHaveBeenCalledWith(7)
  })

  it("does not render numbered page buttons", () => {
    render(<Pagination simple currentPage={3} lastPage={10} onPageChange={() => {}} />)
    // No individual page numbers should appear (1, 2, 3, 4, etc. are not rendered)
    expect(screen.queryByText("1")).not.toBeInTheDocument()
    expect(screen.queryByText("10")).not.toBeInTheDocument()
  })
})
