import type { Metadata } from "next";
import { BedManagementPage } from "../../components/bed-management/BedManagementPage";

export const metadata: Metadata = {
  title: "Bed Management | PS-064",
  description:
    "Hospital-wide bed availability, occupancy and ward status for the PS-064 demonstration environment.",
};

export default function BedsPage() {
  return <BedManagementPage />;
}
