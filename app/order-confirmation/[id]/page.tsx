import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { SiteShell } from "@/components/site-shell"
import { Button } from "@/components/ui/button"

export default function OrderConfirmationPage() {
  return (
    <SiteShell>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-8 text-primary" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Thank you for your order
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your order has been placed successfully. A confirmation email is on its way,
          and you can track the status anytime from your orders page.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/orders">View my orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </SiteShell>
  )
}
