import { Suspense } from "react";
import { CheckoutSuccessClient } from "@/components/checkout-success-client";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl px-4 py-8">Loading...</main>}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
