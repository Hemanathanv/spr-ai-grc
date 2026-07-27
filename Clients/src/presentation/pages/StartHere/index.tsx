import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@emotion/react";
import { Stack, Box, Typography, useTheme, IconButton, Tooltip } from "@mui/material";
import {
  AlertTriangle,
  FileText,
  BarChart3,
  LayoutGrid,
  Building,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Settings,
  UserCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../../../application/hooks/useAuth";
import { useProjects } from "../../../application/hooks/useProjects";
import useUsers from "../../../application/hooks/useUsers";
import { getAllProjectRisks } from "../../../application/repository/projectRisk.repository";
import { getUserById } from "../../../application/repository/user.repository";
import { storageService, dynamicKeys } from "../../../infrastructure/storage";
import { getTimeBasedGreeting } from "../../../application/utils/greetings";
import { background, brand } from "../../themes/palette";

// ── Keyframe animations ──
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const progressFill = keyframes`
  from { stroke-dashoffset: 138.23; }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(19, 113, 91, 0.2); }
  50% { box-shadow: 0 0 0 8px rgba(19, 113, 91, 0); }
`;

const EXPLORE_CARDS = [
  {
    title: "AI governance",
    desc: "Manage models, track lifecycle, maintain documentation.",
    color: brand.primary,
    path: "/overview",
  },
  {
    title: "Compliance",
    desc: "EU AI Act, ISO 42001, NIST AI RMF frameworks and controls.",
    color: "#1E88E5",
    path: "/framework",
  },
  {
    title: "Risk management",
    desc: "Identify, assess, and mitigate risks across AI systems.",
    color: "#F4511E",
    path: "/risk-management",
  },
  {
    title: "LLM Evals",
    desc: "Evaluate and benchmark your LLM apps for quality and safety.",
    color: "#7B1FA2",
    path: "/evals",
  },
  {
    title: "AI detection",
    desc: "Scan repos for AI/ML libraries, containers, and shadow AI.",
    color: "#00796B",
    path: "/ai-detection",
  },
  {
    title: "Shadow AI",
    desc: "Monitor unauthorized AI tool usage across your organization.",
    color: "#D84315",
    path: "/shadow-ai",
  },
  {
    title: "Policies",
    desc: "Create, manage, and track AI governance policies.",
    color: "#283593",
    path: "/policies",
  },
  {
    title: "Reporting",
    desc: "Generate compliance reports with optional AI enhancement.",
    color: "#558B2F",
    path: "/reporting",
  },
  {
    title: "Training",
    desc: "Track employee AI training and compliance certifications.",
    color: "#C2185B",
    path: "/training",
  },
  {
    title: "Plugins",
    desc: "Extend with SOC 2, GDPR, HIPAA, Jira, Slack, and more.",
    color: "#1565C0",
    path: "/plugins",
  },
] as const;

const SHORTCUTS = [
  {
    label: "Use cases",
    tooltip: "Manage AI use cases, projects, and their lifecycle stages.",
    icon: LayoutGrid,
    path: "/overview",
    color: brand.primaryHover,
    bg: `linear-gradient(135deg, ${brand.primaryLight}, #C8E6D0)`,
  },
  {
    label: "Risks",
    tooltip: "Identify, assess, and track risks across all AI systems.",
    icon: AlertTriangle,
    path: "/risk-management",
    color: "#1565C0",
    bg: "linear-gradient(135deg, #E3F2FD, #BBDEFB)",
  },
  {
    label: "Models",
    tooltip: "Track AI/ML models, their versions, and deployment status.",
    icon: Brain,
    path: "/model-inventory",
    color: "#E65100",
    bg: "linear-gradient(135deg, #FFF8E1, #FFECB3)",
  },
  {
    label: "Vendors",
    tooltip: "Manage third-party AI vendors and their risk profiles.",
    icon: Building,
    path: "/vendors",
    color: "#C2185B",
    bg: "linear-gradient(135deg, #FCE4EC, #F8BBD0)",
  },
  {
    label: "Tasks",
    tooltip: "View and manage compliance tasks assigned to your team.",
    icon: Calendar,
    path: "/tasks",
    color: "#7B1FA2",
    bg: "linear-gradient(135deg, #F3E5F5, #E1BEE7)",
  },
  {
    label: "Reporting",
    tooltip: "Generate compliance and governance reports for stakeholders.",
    icon: BarChart3,
    path: "/reporting",
    color: "#283593",
    bg: "linear-gradient(135deg, #E8EAF6, #C5CAE9)",
  },
  {
    label: "Policies",
    tooltip: "Create and manage AI governance policies for your organization.",
    icon: FileText,
    path: "/policies",
    color: "#00796B",
    bg: "linear-gradient(135deg, #E0F2F1, #B2DFDB)",
  },
  {
    label: "Settings",
    tooltip: "Configure organization settings, users, and preferences.",
    icon: Settings,
    path: "/settings",
    color: "#E65100",
    bg: "linear-gradient(135deg, #FFF3E0, #FFE0B2)",
  },
] as const;

const RESOURCES = [
  {
    label: "User guide",
    sub: "SPR-AI-GRC User Documentation",
    icon: BookOpen,
    path: "/user-guide",
  },
] as const;

interface ProgressStep {
  label: string;
  path?: string;
  state?: Record<string, unknown>;
}

const PROGRESS_STEPS: ProgressStep[] = [
  { label: "Create your account" },
  { label: "Set up your organization" },
  { label: "Invite a team member", path: "/settings", state: { activeTab: "team" } },
  { label: "Create your first use case", path: "/overview" },
  { label: "Complete a risk assessment", path: "/risk-management" },
];

const getCachedProgress = (): boolean[] => {
  const parsed = storageService.get("startHereProgress", []);
  if (Array.isArray(parsed) && parsed.length === PROGRESS_STEPS.length) {
    return parsed;
  }
  return [true, true, false, false, false];
};

const StartHere = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const exploreScrollRef = useRef<HTMLDivElement>(null);
  const { userToken, userId } = useAuth();
  const { users } = useUsers();
  const { data: projects } = useProjects();
  const [hasRisks, setHasRisks] = useState(() => getCachedProgress()[4]);
  const [progressDismissed, setProgressDismissed] = useState(
    () =>
      storageService.getRaw<string>(dynamicKeys.startHereDismissed("progress"), "false", {
        raw: true,
      }) === "true",
  );
  const [expertsDismissed, setExpertsDismissed] = useState(
    () =>
      storageService.getRaw<string>(dynamicKeys.startHereDismissed("experts"), "false", {
        raw: true,
      }) === "true",
  );

  useEffect(() => {
    let cancelled = false;
    getAllProjectRisks({})
      .then((res) => {
        if (!cancelled) {
          const risks = res?.data || [];
          setHasRisks(Array.isArray(risks) && risks.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setHasRisks(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [userName, setUserName] = useState(userToken?.name || "");
  useEffect(() => {
    if (!userId) return;
    getUserById({ userId })
      .then((res) => {
        const data = res?.data || res;
        if (data?.name) setUserName(data.name);
      })
      .catch(() => setUserName(userToken?.name || ""));
  }, [userId, userToken?.name]);
  const greeting = useMemo(() => getTimeBasedGreeting(userName, userToken), [userName, userToken]);

  const progressDone = useMemo(() => {
    const accountCreated = true;
    const orgSetUp = true;
    const hasTeamMember = (users?.length || 0) > 1;
    const hasUseCase = (projects?.length || 0) > 0;
    return [accountCreated, orgSetUp, hasTeamMember, hasUseCase, hasRisks];
  }, [users, projects, hasRisks]);

  useEffect(() => {
    storageService.set("startHereProgress", progressDone);
  }, [progressDone]);

  const doneCount = progressDone.filter(Boolean).length;
  const progressPct = Math.round((doneCount / PROGRESS_STEPS.length) * 100);
  const progressOffset = 138.23 * (1 - progressPct / 100);

  useEffect(() => {
    if (progressPct < 100 || progressDismissed) return;
    if (storageService.get("startHereConfettiFired", false)) {
      dismissProgress();
      return;
    }
    storageService.set("startHereConfettiFired", true);

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };
    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 },
        colors: [brand.primary, "#10B981", "#D1FAE5", "#34D399", "#6EE7B7"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 },
        colors: [brand.primary, "#10B981", "#D1FAE5", "#34D399", "#6EE7B7"],
      });
    }, 250);

    const dismissTimer = setTimeout(() => dismissProgress(), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(dismissTimer);
    };
  }, [progressPct, progressDismissed]);

  const dismissProgress = useCallback(() => {
    storageService.setRaw(dynamicKeys.startHereDismissed("progress"), "true", { raw: true });
    setProgressDismissed(true);
  }, []);

  const scrollExplore = useCallback((dir: number) => {
    exploreScrollRef.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  }, []);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        gap: "24px",
        p: "24px",
        minHeight: "100%",
      }}
    >
      {/* ── Main content ── */}
      <Stack sx={{ gap: "32px", minWidth: 0 }}>
        {/* Greeting */}
        <Box sx={{ animation: `${fadeInUp} 0.5s ease-out` }}>
          <Typography variant="h5" sx={{ fontWeight: 400, fontSize: "20px" }}>
            <Box component="span" sx={{ color: brand.primary }}>
              {greeting.greetingText}
            </Box>
            <Box component="span" sx={{ color: theme.palette.text.primary }}>
              , {greeting.text.split(", ")[1]}
            </Box>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: 13,
              fontWeight: 400,
              mt: 0.5,
            }}
          >
            Here is an overview of your AI governance journey with SPR-AI-GRC
          </Typography>
        </Box>

        {/* Row 1: Explore SPR-AI-GRC */}
        <Box sx={{ animation: `${fadeInUp} 0.5s ease-out 0.15s both` }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, mb: "12px" }}>
            Explore SPR-AI-GRC
          </Typography>
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={() => scrollExplore(-1)}
              sx={{
                position: "absolute",
                left: -16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                width: 32,
                height: 32,
                background: "background.main",
                border: `1px solid ${theme.palette.border.dark}`,
                transition: "all 0.2s ease",
                "&:hover": {
                  background: theme.palette.background.alt,
                  transform: "translateY(-50%) scale(1.1)",
                },
              }}
            >
              <ChevronLeft size={16} />
            </IconButton>
            <Box
              ref={exploreScrollRef}
              sx={{
                display: "flex",
                gap: "12px",
                overflowX: "auto",
                pb: "8px",
                scrollBehavior: "smooth",
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {EXPLORE_CARDS.map((card, i) => (
                <Box
                  key={card.title}
                  onClick={() => navigate(card.path)}
                  sx={{
                    minWidth: 196,
                    maxWidth: 196,
                    borderRadius: "8px",
                    overflow: "hidden",
                    background: theme.palette.background.main,
                    border: `1px solid ${theme.palette.border.light}`,
                    cursor: "pointer",
                    flexShrink: 0,
                    animation: `${fadeInUp} 0.4s ease-out ${0.2 + i * 0.05}s both`,
                    transition:
                      "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: `${card.color}55`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 60,
                      background: `${card.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at 30% 50%, ${card.color}25, transparent 70%)`,
                      }}
                    />
                  </Box>
                  <Box sx={{ p: "12px" }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: "4px" }}>
                      {card.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: theme.palette.text.secondary,
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {card.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <IconButton
              onClick={() => scrollExplore(1)}
              sx={{
                position: "absolute",
                right: -16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                width: 32,
                height: 32,
                background: "background.main",
                border: `1px solid ${theme.palette.border.dark}`,
                transition: "all 0.2s ease",
                "&:hover": {
                  background: theme.palette.background.alt,
                  transform: "translateY(-50%) scale(1.1)",
                },
              }}
            >
              <ChevronRight size={16} />
            </IconButton>
          </Box>
        </Box>

        {/* Row 2: Shortcuts */}
        <Box sx={{ animation: `${fadeInUp} 0.5s ease-out 0.25s both` }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, mb: "12px" }}>Shortcuts</Typography>
          <Stack direction="row" sx={{ gap: "16px", flexWrap: "wrap" }}>
            {SHORTCUTS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Tooltip
                  key={s.label}
                  title={s.tooltip}
                  placement="bottom"
                  arrow
                  enterDelay={300}
                  slotProps={{
                    tooltip: {
                      sx: {
                        maxWidth: 200,
                        textAlign: "center",
                      },
                    },
                  }}
                >
                  <Box
                    onClick={() => navigate(s.path)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      width: 72,
                      animation: `${fadeInUp} 0.3s ease-out ${0.3 + i * 0.04}s both`,
                      transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        "& .shortcut-icon-box": {
                          transform: "scale(1.08)",
                        },
                      },
                    }}
                  >
                    <Box
                      className="shortcut-icon-box"
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "12px",
                        background: s.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    >
                      <Icon size={22} color={s.color} strokeWidth={1.5} />
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: theme.palette.text.secondary,
                        textAlign: "center",
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {s.label}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
        </Box>

        {/* Row 3: Your experts */}
        {!expertsDismissed && (
          <Box sx={{ animation: `${fadeInUp} 0.5s ease-out 0.35s both` }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, mb: "12px" }}>Your experts</Typography>
            <Stack
              direction="row"
              alignItems="flex-start"
              sx={{ gap: "12px", position: "relative", width: "fit-content" }}
            >
              {[
                {
                  name: "Karthik Jeganathan",
                  role: "AI Governance Expert",
                },
                {
                  name: "Adithya",
                  role: "AI Governance Expert",
                },
              ].map((expert) => (
                <Stack
                  key={expert.name}
                  alignItems="center"
                  sx={{
                    gap: "8px",
                    p: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${theme.palette.border.light}`,
                    minWidth: 220,
                    transition:
                      "border-color 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    "&:hover": {
                      borderColor: theme.palette.border.dark,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      backgroundColor: brand.primaryLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: brand.primary,
                    }}
                  >
                    <UserCheck size={24} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                    {expert.name}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11, color: theme.palette.text.secondary, textAlign: "center" }}
                  >
                    {expert.role}
                  </Typography>
                </Stack>
              ))}
              <Typography
                onClick={(e) => {
                  e.stopPropagation();
                  setExpertsDismissed(true);
                  storageService.setRaw(dynamicKeys.startHereDismissed("experts"), "true", {
                    raw: true,
                  });
                }}
                sx={{
                  position: "absolute",
                  top: -24,
                  right: 0,
                  fontSize: 11,
                  color: theme.palette.text.accent,
                  cursor: "pointer",
                  "&:hover": { color: theme.palette.text.secondary },
                }}
              >
                Dismiss
              </Typography>
            </Stack>
          </Box>
        )}
      </Stack>

      {/* ── Right sidebar ── */}
      <Stack sx={{ gap: "20px", animation: `${fadeInUp} 0.5s ease-out 0.2s both` }}>
        {/* Progress card */}
        {!progressDismissed && (
          <Box
            sx={{
              background: `linear-gradient(135deg, ${brand.primaryHover}, ${brand.primary})`,
              borderRadius: "8px",
              p: "16px",
              color: "background.main",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 90% 10%, rgba(255,255,255,0.08) 0%, transparent 50%)",
                pointerEvents: "none",
              },
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: "background.main",
                mb: "12px",
                position: "relative",
              }}
            >
              Your progress
            </Typography>
            <Stack
              direction="row"
              alignItems="center"
              sx={{ gap: "16px", mb: "12px", position: "relative" }}
            >
              <Box sx={{ width: 56, height: 56, position: "relative", flexShrink: 0 }}>
                <svg
                  viewBox="0 0 56 56"
                  style={{ transform: "rotate(-90deg)", width: 56, height: 56 }}
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="22"
                    fill="none"
                    stroke={background.main}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="138.23"
                    strokeDashoffset={progressOffset}
                    style={{
                      animation: `${progressFill} 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
                    }}
                  />
                </svg>
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "background.main",
                  }}
                >
                  {progressPct}%
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "background.main" }}>
                  {progressPct === 100 ? "All done!" : "Getting started"}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                  {progressPct === 100
                    ? "You've completed all steps"
                    : `${doneCount} of ${PROGRESS_STEPS.length} steps complete`}
                </Typography>
              </Box>
            </Stack>
            <Stack sx={{ gap: "8px", position: "relative" }}>
              {PROGRESS_STEPS.map((step, i) => {
                const done = progressDone[i];
                return (
                  <Stack
                    key={step.label}
                    direction="row"
                    alignItems="center"
                    onClick={() => {
                      if (!done && step.path)
                        navigate(step.path, step.state ? { state: step.state } : undefined);
                    }}
                    sx={{
                      gap: "8px",
                      animation: `${fadeInUp} 0.3s ease-out ${0.6 + i * 0.08}s both`,
                      cursor: !done && step.path ? "pointer" : "default",
                      borderRadius: "4px",
                      p: "2px 4px",
                      mx: "-4px",
                      transition: "background 0.2s",
                      "&:hover": !done && step.path ? { background: "rgba(255,255,255,0.08)" } : {},
                    }}
                  >
                    {done ? (
                      <CheckCircle2 size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                    ) : (
                      <Box
                        sx={{
                          animation: `${pulseGlow} 2.5s ease-in-out infinite`,
                          borderRadius: "50%",
                          display: "flex",
                        }}
                      >
                        <Circle size={16} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
                      </Box>
                    )}
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)",
                        textDecoration: done ? "line-through" : "none",
                        fontWeight: done ? 400 : 500,
                      }}
                    >
                      {step.label}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Resources */}
        <Box
          sx={{
            background: theme.palette.background.main,
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: "8px",
            p: "16px",
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: "12px" }}>Resources</Typography>
          <Stack sx={{ gap: "4px" }}>
            {RESOURCES.map((r) => {
              const Icon = r.icon;
              return (
                <Stack
                  key={r.label}
                  direction="row"
                  alignItems="center"
                  onClick={() => navigate(r.path)}
                  sx={{
                    gap: "8px",
                    p: "8px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    color: "inherit",
                    "&:hover": {
                      background: "#F9F9F9",
                      "& .resource-icon svg": {
                        stroke: brand.primary,
                      },
                    },
                  }}
                >
                  <Box
                    className="resource-icon"
                    sx={{
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={14} color={theme.palette.text.secondary} strokeWidth={1.5} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, color: theme.palette.text.primary }}>
                      {r.label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.accent }}>
                      {r.sub}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default StartHere;
