import React from "react";
import { Stack } from "@mui/material";
import { Project } from "../../../../domain/types/Project";
import BankChecklistViewer from "../../../components/BankChecklistViewer";

interface ComplianceTrackerProps {
  project?: Project;
  statusFilter?: string;
  ownerFilter?: string;
  approverFilter?: string;
  dueDateFilter?: string;
}

const ComplianceTracker: React.FC<ComplianceTrackerProps> = () => {
  return (
    <Stack className="compliance-tracker" sx={{ width: "100%" }}>
      <BankChecklistViewer />
    </Stack>
  );
};

export default ComplianceTracker;
