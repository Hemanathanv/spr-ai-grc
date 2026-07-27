import React, { useEffect, useState, useMemo } from "react";

import { Stack, Typography, Tooltip, Link } from "@mui/material";
import { ArrowUpRight as WhiteUpRightArrowIcon, Eye as EyeIcon, ExternalLink } from "lucide-react";

import { CustomizableButton } from "../../button/customizable-button";
import ViewRelationshipsButton from "../../ViewRelationshipsButton";
import ProgressBar from "../../ProjectCard/ProgressBar";
import {
  progressStyle,
  projectCardSpecKeyStyle,
  projectCardSpecValueStyle,
  projectCardStyle,
  projectCardTitleStyle,
  euAiActChipStyle,
  iso42001ChipStyle,
} from "./style";
import useNavigateSearch from "../../../../application/hooks/useNavigateSearch";
import { fetchData } from "../../../../application/hooks/fetchDataHook";
import useUsers from "../../../../application/hooks/useUsers";

import { Project } from "../../../../domain/types/Project";
import { User } from "../../../../domain/types/User";
import {
  AssessmentProgress,
  ComplianceProgress,
} from "../../../../application/interfaces/iprogress";

function ProjectCardSkeleton() {
  return (
    <Stack className="project-card" sx={projectCardStyle}>
      <Stack className="project-card-header" sx={{ gap: 2 }}>
        <Typography className="project-card-title" sx={projectCardTitleStyle}>
          Loading...
        </Typography>
      </Stack>
      <Stack className="project-card-stats" sx={{ gap: 5 }}>
        <Stack className="project-progress" sx={{ gap: 1 }}>
          <ProgressBar progress="0/0" />
          <Typography sx={progressStyle}>Loading...</Typography>
        </Stack>
        <Stack className="project-progress" sx={{ gap: 1 }}>
          <ProgressBar progress="0/0" />
          <Typography sx={progressStyle}>Loading...</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

interface AnnexesProgress {
  totalAnnexcategories: number;
  doneAnnexcategories: number;
}

interface ClausesProgress {
  totalSubclauses: number;
  doneSubclauses: number;
}

interface ProjectCardProps {
  project: Project;
  isLoading?: boolean;
}

// Helper to fetch progress data
function useProjectProgress(projectFrameworkId?: number, projectFrameworkId2?: number) {
  const [complianceProgressData, setComplianceProgressData] = useState<ComplianceProgress>();
  const [assessmentProgressData, setAssessmentProgressData] = useState<AssessmentProgress>();
  const [annexesProgressData, setAnnexesProgressData] = useState<AnnexesProgress>();
  const [clausesProgressData, setClausesProgressData] = useState<ClausesProgress>();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        if (projectFrameworkId) {
          await fetchData(
            `/eu-ai-act/compliances/progress/${projectFrameworkId}`,
            setComplianceProgressData,
          );
          await fetchData(
            `/eu-ai-act/assessments/progress/${projectFrameworkId}`,
            setAssessmentProgressData,
          );
        }
        if (projectFrameworkId2) {
          await fetchData(
            `/iso-42001/clauses/progress/${projectFrameworkId2}`,
            setClausesProgressData,
          );
          await fetchData(
            `/iso-42001/annexes/progress/${projectFrameworkId2}`,
            setAnnexesProgressData,
          );
        }
      } catch (_error) {
        // Optionally handle error globally
      }
    };
    fetchProgressData();
  }, [projectFrameworkId, projectFrameworkId2]);

  return {
    complianceProgressData,
    assessmentProgressData,
    annexesProgressData,
    clausesProgressData,
  };
}

function FrameworkButton({
  label,
  type,
  onClick,
}: {
  label: string;
  type: "eu" | "iso";
  onClick: () => void;
}) {
  const tooltipText =
    type === "eu"
      ? "EU AI Act: View and complete requirements for EU's AI Act. Answer compliance questions and track your progress."
      : "ISO 42001: Work through ISO/IEC 42001 requirements. Fill out clauses, annexes, and assessments to build your AI management system";

  return (
    <Tooltip title={tooltipText} arrow placement="top">
      <CustomizableButton
        variant="contained"
        onClick={onClick}
        sx={{
          ...(type === "eu" ? euAiActChipStyle : iso42001ChipStyle),
          "cursor": "pointer",
          "&:hover": {
            opacity: 0.9,
          },
        }}
        size="small"
        endIcon={<WhiteUpRightArrowIcon size={16} />}
      >
        {label}
      </CustomizableButton>
    </Tooltip>
  );
}

import { displayFormattedDate } from "../../../tools/isoDateToString";

export const ProjectCard = React.memo(function ProjectCard({
  project,
  isLoading = false,
}: ProjectCardProps) {
  const navigate = useNavigateSearch();
  const { users } = useUsers();

  // Memoize framework IDs
  const projectFrameworkId = useMemo(
    () => project.framework?.find((p) => p.framework_id === 1)?.project_framework_id,
    [project.framework],
  );
  const projectFrameworkId2 = useMemo(
    () => project.framework?.find((p) => p.framework_id === 2)?.project_framework_id,
    [project.framework],
  );

  // Fetch progress data
  const {
    complianceProgressData,
    assessmentProgressData,
    annexesProgressData,
    clausesProgressData,
  } = useProjectProgress(projectFrameworkId, projectFrameworkId2);

  // Find project owner
  const ownerUser: User | null = useMemo(
    () => users?.find((user: User) => user.id === project.owner) ?? null,
    [users, project.owner],
  );

  // Navigation handlers for framework buttons
  const handleFrameworkClick = (frameworkId: number) => {
    navigate("/project-view", {
      projectId: project.id.toString(),
      tab: "frameworks",
      framework: frameworkId.toString(),
    });
  };

  if (isLoading) {
    return <ProjectCardSkeleton />;
  }

  return (
    <Stack
      className="project-card"
      sx={{ ...projectCardStyle, display: "flex", flexDirection: "column" }}
      role="article"
      aria-label={`Project card for ${project.project_title}`}
    >
      {/* Header */}
      <Stack className="project-card-header" sx={{ gap: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography className="project-card-title" sx={projectCardTitleStyle}>
            {project.uc_id ? `${project.uc_id}: ` : ""}
            {project.project_title}
          </Typography>
          <Stack direction="row" spacing={8} sx={{ ml: 2 }}>
            <Stack className="project-card-spec-tile" alignItems="flex-end">
              <Typography sx={projectCardSpecKeyStyle}>Project owner</Typography>
              <Typography sx={projectCardSpecValueStyle}>
                {ownerUser ? `${ownerUser.name} ${ownerUser.surname}` : "Unknown User"}
              </Typography>
            </Stack>
            <Stack className="project-card-spec-tile" alignItems="flex-end">
              <Typography sx={projectCardSpecKeyStyle}>Last updated</Typography>
              <Typography sx={projectCardSpecValueStyle}>
                {displayFormattedDate(project.last_updated.toString())}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={1.5} className="project-card-frameworks" sx={{ mb: "16px", flexWrap: "wrap", gap: 1 }}>
          <FrameworkButton label="RBI FREE-AI & ITGRC" type="eu" onClick={() => navigate("/bank-checklist")} />
          <FrameworkButton label="OWASP LLM 2025" type="iso" onClick={() => navigate("/bank-checklist")} />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={4} className="project-card-stats" sx={{ mb: 2 }}>
        <Stack sx={{ flex: 1, gap: 0.5 }}>
          <Stack className="project-progress" sx={{ gap: 0.5 }}>
            <ProgressBar progress="145/145" />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography sx={progressStyle}>
                Requirements: 145 out of 145 Controls Ingested
              </Typography>
              <Link
                component="button"
                onClick={() => navigate("/bank-checklist")}
                sx={{
                  "color": "#014576",
                  "textDecoration": "none",
                  "cursor": "pointer",
                  "display": "flex",
                  "alignItems": "center",
                  "ml": 0.5,
                }}
              >
                <ExternalLink size={12} />
              </Link>
            </Stack>
          </Stack>
          <Stack className="project-progress" sx={{ gap: 0.5 }}>
            <ProgressBar progress="94.2%" />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography sx={progressStyle}>
                Bank Compliance Score: 94.2% Assured
              </Typography>
              <Link
                component="button"
                onClick={() => navigate("/bank-checklist")}
                sx={{
                  "color": "#014576",
                  "textDecoration": "none",
                  "cursor": "pointer",
                  "display": "flex",
                  "alignItems": "center",
                  "ml": 0.5,
                }}
              >
                <ExternalLink size={12} />
              </Link>
            </Stack>
          </Stack>
      </Stack>
      {/* View Project Details Button */}
      <Stack direction="row" sx={{ mt: 0, mb: 0, justifyContent: "flex-end", gap: 1 }}>
        <ViewRelationshipsButton
          entityId={project.id}
          entityType="useCase"
          entityLabel={project.project_title}
        />
        <Tooltip title="View project details" sx={{ fontSize: 13 }}>
          <CustomizableButton
            variant="contained"
            onClick={() =>
              navigate("/project-view", {
                projectId: project.id.toString(),
              })
            }
            sx={{
              backgroundColor: "brand.primary",
              border: "1px solid brand.primary",
              mb: 0,
              mt: 0,
            }}
            startIcon={<EyeIcon size={16} />}
          >
            View project details
          </CustomizableButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
});
