"use client"

import { SiteShell } from "@/components/site-shell"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

const FAQS = [
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and cash on delivery for select locations.",
  },
  {
    q: "How long does shipping take?",
    a: "Standard shipping takes 3-5 business days. Express shipping (1-2 business days) is available at checkout for an additional fee.",
  },
  {
    q: "Do you offer free shipping?",
    a: "Yes, we offer free standard shipping on orders over a certain amount. The minimum amount is displayed during checkout.",
  },
  {
    q: "What is your return policy?",
    a: "You can return most items within 30 days of delivery. Items must be unused and in their original packaging.",
  },
  {
    q: "How can I track my order?",
    a: "Once your order ships, you will receive a confirmation email with a tracking number. You can also check your order status in your account dashboard.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently, we ship within Morocco. International shipping will be available soon.",
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-3 text-muted-foreground">
          Find answers to common questions about our products and services.
        </p>

        <div className="mt-10 space-y-2">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium transition-colors hover:bg-muted/30"
              >
                {faq.q}
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="border-t border-border px-6 py-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          This page is ready for your custom content. Add more questions or customize the answers.
        </p>
      </div>
    </SiteShell>
  )
}
