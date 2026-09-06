import { Suspense } from "react";
import LeadsPage from "@/components/crm/leads-page";

export default function LeadsRoute() {
  return (
    <Suspense>
      <LeadsPage />
    </Suspense>
  );
}
