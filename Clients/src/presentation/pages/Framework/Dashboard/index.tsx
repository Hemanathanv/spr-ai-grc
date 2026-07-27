import React from "react";
import { Stack } from "@mui/material";
import { Project } from "../../../../domain/types/Project";
import { Framework } from "../../../../domain/types/Framework";
import BankChecklistViewer from "../../../components/BankChecklistViewer";

interface DashboardProps {
  organizationalProject?: Project;
  filteredFrameworks?: Framework[];
}

const FrameworkDashboard: React.FC<DashboardProps> = () => {
  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <BankChecklistViewer />
    </Stack>
  );
};

export default FrameworkDashboard;
