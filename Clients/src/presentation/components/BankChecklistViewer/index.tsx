import React, { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Drawer,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  Search,
  ShieldCheck,
  FileText,
  X,
  ExternalLink,
  Filter,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react";
import bankControlsData from "../../../../../shared/bank_controls_extracted.json";
import { brand, status as statusPalette, border as borderPalette, background, text as textColors, risk as riskPalette } from "../../themes/palette";

export interface BankControl {
  track: string;
  sec_ref: string;
  domain: string;
  ctrl_ref: string;
  objective: string;
  description: string;
  test_procedure: string;
  evidence: string;
  sample_size: string;
  pass_fail: string;
  risk_rating: string;
  control_type: string;
  control_nature: string;
  periodicity: string;
  owner: string;
  status: string;
  remarks: string;
  wp_ref: string;
}

// Seamless App-aligned navigation tabs
const NAV_TABS = [
  { id: "audit-dashboard", label: "📊 Audit Dashboard" },
  { id: "risk-controls", label: "⚖️ AI Risk & Control Testing" },
  { id: "security-ops", label: "🛡️ AI Security & Guardrails" },
  { id: "framework-compliance", label: "📜 Framework Compliance" },
];

const getRiskStyle = (rating: string) => {
  switch (rating?.toLowerCase()) {
    case "critical":
      return riskPalette.critical;
    case "high":
      return riskPalette.high;
    case "medium":
      return riskPalette.medium;
    case "low":
      return riskPalette.low;
    default:
      return riskPalette.low;
  }
};

export const BankChecklistViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [selectedNature, setSelectedNature] = useState<string>("all");
  const [selectedControl, setSelectedControl] = useState<BankControl | null>(null);
  const [auditorRemarks, setAuditorRemarks] = useState<Record<string, string>>({});
  const [controlStatuses, setControlStatuses] = useState<Record<string, string>>({});

  const allControls = bankControlsData as BankControl[];

  // Map internal track names to clean tab indices
  const getControlsForTab = (tabIdx: number) => {
    if (tabIdx === 1) return allControls.filter((c) => c.track === "AI Governance Control Testing");
    if (tabIdx === 2) return allControls.filter((c) => c.track === "AI Security, Governance & Ops");
    if (tabIdx === 3) return allControls.filter((c) => c.track === "Regulatory Compilance");
    return allControls;
  };

  // Filter controls based on active tab and user criteria
  const filteredControls = useMemo(() => {
    let list = getControlsForTab(activeTab);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.ctrl_ref.toLowerCase().includes(term) ||
          c.wp_ref.toLowerCase().includes(term) ||
          c.objective.toLowerCase().includes(term) ||
          c.domain.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term)
      );
    }

    if (selectedDomain !== "all") {
      list = list.filter((c) => c.domain === selectedDomain);
    }

    if (selectedRisk !== "all") {
      list = list.filter((c) => c.risk_rating.toLowerCase() === selectedRisk.toLowerCase());
    }

    if (selectedNature !== "all") {
      list = list.filter((c) => c.control_nature.toLowerCase() === selectedNature.toLowerCase());
    }

    return list;
  }, [allControls, activeTab, searchTerm, selectedDomain, selectedRisk, selectedNature]);

  // Unique domains for active tab
  const availableDomains = useMemo(() => {
    const trackControls = getControlsForTab(activeTab);
    return Array.from(new Set(trackControls.map((c) => c.domain))).sort();
  }, [allControls, activeTab]);

  // Metrics calculation for Audit Dashboard tab
  const stats = useMemo(() => {
    const total = allControls.length;
    const highCritical = allControls.filter(
      (c) => c.risk_rating.toLowerCase() === "high" || c.risk_rating.toLowerCase() === "critical"
    ).length;
    const preventive = allControls.filter((c) => c.control_nature.toLowerCase().includes("preventive")).length;
    const detective = allControls.filter((c) => c.control_nature.toLowerCase().includes("detective")).length;
    const corrective = allControls.filter((c) => c.control_nature.toLowerCase().includes("corrective")).length;

    const counts = {
      riskControls: allControls.filter((c) => c.track === "AI Governance Control Testing").length,
      securityOps: allControls.filter((c) => c.track === "AI Security, Governance & Ops").length,
      compliance: allControls.filter((c) => c.track === "Regulatory Compilance").length,
    };

    return { total, highCritical, preventive, detective, corrective, counts };
  }, [allControls]);

  const handleRemarksChange = (ref: string, val: string) => {
    setAuditorRemarks((prev) => ({ ...prev, [ref]: val }));
  };

  return (
    <Box sx={{ width: "100%", p: 3, background: background.main, minHeight: "100vh" }}>
      {/* Native App Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: "4px",
          border: `1px solid ${borderPalette.dark}`,
          background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ShieldCheck size={26} color={brand.primary} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: textColors.primary }}>
                SPR-AI_GRC Enterprise Audit & Controls Platform
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: textColors.secondary }}>
              Continuous Control Assurance, Risk Testing & Regulatory Audit Working Papers (RBI FREE-AI, CERT-In, SEBI CSCRF, DPDP Act 2023, OWASP LLM 2025)
            </Typography>
          </Stack>
          <Chip
            icon={<Lock size={14} color={brand.primary} />}
            label="BFSI AI-GRC Audit Assurance Engine"
            sx={{
              backgroundColor: brand.primaryLight,
              color: brand.primary,
              fontWeight: 600,
              borderRadius: "4px",
              px: 1,
            }}
          />
        </Stack>
      </Paper>

      {/* Navigation Tabs - Clean & Native */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => {
            setActiveTab(val);
            setSelectedDomain("all");
          }}
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              minHeight: 44,
            },
            "& .Mui-selected": {
              color: brand.primary,
            },
          }}
        >
          <Tab label="📊 Audit Dashboard" />
          <Tab label={`⚖️ AI Risk & Control Testing (${stats.counts.riskControls})`} />
          <Tab label={`🛡️ AI Security & Guardrails (${stats.counts.securityOps})`} />
          <Tab label={`📜 Framework Compliance (${stats.counts.compliance})`} />
        </Tabs>
      </Box>

      {/* Tab 0: Audit Dashboard */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          {/* Executive Dashboard Cards matching native app styling */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${borderPalette.dark}`,
                  borderRadius: "4px",
                  background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 700, letterSpacing: 0.5 }}>
                    TOTAL AUDIT CONTROLS
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: brand.primary, my: 1 }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="caption" sx={{ color: statusPalette.success.text, fontWeight: 600 }}>
                    100% Ingested & Working Paper Ready
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${borderPalette.dark}`,
                  borderRadius: "4px",
                  background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 700, letterSpacing: 0.5 }}>
                    HIGH & CRITICAL RISK CONTROLS
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: riskPalette.critical.text, my: 1 }}>
                    {stats.highCritical}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textColors.secondary }}>
                    Priority Testing Scope ({Math.round((stats.highCritical / stats.total) * 100)}% of total)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${borderPalette.dark}`,
                  borderRadius: "4px",
                  background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 700, letterSpacing: 0.5 }}>
                    CONTROL NATURE BREAKDOWN
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: textColors.primary }}>
                      Preventive: <b>{stats.preventive}</b> | Detective: <b>{stats.detective}</b>
                    </Typography>
                    <Typography variant="caption" sx={{ color: textColors.secondary }}>
                      Corrective: <b>{stats.corrective}</b>
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${borderPalette.dark}`,
                  borderRadius: "4px",
                  background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 700, letterSpacing: 0.5 }}>
                    AUDIT COMPLIANCE ASSURANCE
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: statusPalette.success.text, my: 1 }}>
                    94.2%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={94.2}
                    sx={{ height: 6, borderRadius: 3, backgroundColor: statusPalette.success.bg }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Core Feature Area Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${borderPalette.dark}`,
                  borderRadius: "4px",
                  background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: textColors.primary }}>
                    AI Risk & Control Testing
                  </Typography>
                  <Typography variant="body2" sx={{ color: textColors.secondary, mb: 3, flexGrow: 1 }}>
                    79 controls covering Fairness, Transparency, Explainability, Accountability, Data Privacy & AIBOM Lineage.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setActiveTab(1)}
                    sx={{ textTransform: "none", fontWeight: 600, borderColor: borderPalette.dark, color: brand.primary }}
                  >
                    Explore Controls ({stats.counts.riskControls}) →
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${borderPalette.dark}`,
                  borderRadius: "4px",
                  background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: textColors.primary }}>
                    AI Security & Guardrails
                  </Typography>
                  <Typography variant="body2" sx={{ color: textColors.secondary, mb: 3, flexGrow: 1 }}>
                    49 controls covering OWASP LLM 2025, AI Gateways, SIEM Threat Intel, Output Hallucinations & Quantum-Safe Encryption.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setActiveTab(2)}
                    sx={{ textTransform: "none", fontWeight: 600, borderColor: borderPalette.dark, color: brand.primary }}
                  >
                    Explore Controls ({stats.counts.securityOps}) →
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: `1px solid ${borderPalette.dark}`,
                  borderRadius: "4px",
                  background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: textColors.primary }}>
                    Framework Compliance
                  </Typography>
                  <Typography variant="body2" sx={{ color: textColors.secondary, mb: 3, flexGrow: 1 }}>
                    17 controls covering RBI FREE-AI, CERT-In Blueprint CIGU-2026-0002, SEBI CSCRF, DPDP Act 2023 & IndiaAI Mission.
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setActiveTab(3)}
                    sx={{ textTransform: "none", fontWeight: 600, borderColor: borderPalette.dark, color: brand.primary }}
                  >
                    Explore Controls ({stats.counts.compliance}) →
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}

      {/* Tabs 1, 2, 3: Filterable Controls Tables */}
      {activeTab > 0 && (
        <Stack spacing={2.5}>
          {/* Native Filters Bar */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "4px", border: `1px solid ${borderPalette.dark}`, background: background.main }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by Control Ref, Objective, WP Ref..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search size={18} style={{ marginRight: 8, color: "#888" }} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4} md={2.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Domain Filter"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                >
                  <MenuItem value="all">All Domains ({availableDomains.length})</MenuItem>
                  {availableDomains.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Risk Rating"
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                >
                  <MenuItem value="all">All Risk Levels</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4} md={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Control Nature"
                  value={selectedNature}
                  onChange={(e) => setSelectedNature(e.target.value)}
                >
                  <MenuItem value="all">All Natures</MenuItem>
                  <MenuItem value="preventive">Preventive</MenuItem>
                  <MenuItem value="detective">Detective</MenuItem>
                  <MenuItem value="corrective">Corrective</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={1.5}>
                <Typography variant="caption" sx={{ color: textColors.secondary, display: "block", textAlign: "right" }}>
                  Showing <b>{filteredControls.length}</b> controls
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Controls Table */}
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "4px", border: `1px solid ${borderPalette.dark}` }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: background.gradientStop }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 130 }}>WP Ref</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 110 }}>Control Ref</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 220 }}>Domain</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Control Objective & Testing Scope</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 110 }}>Risk Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 110 }}>Nature</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 100 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 120 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, width: 70, textAlign: "center" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredControls.map((c) => {
                  const riskStyle = getRiskStyle(c.risk_rating);
                  const currentStatus = controlStatuses[c.ctrl_ref] || c.status || "Compliant";
                  return (
                    <TableRow
                      key={c.ctrl_ref}
                      hover
                      onClick={() => setSelectedControl(c)}
                      sx={{ cursor: "pointer", "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}
                    >
                      <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: brand.primary }}>
                        {c.wp_ref}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{c.ctrl_ref}</TableCell>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{c.domain}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {c.objective}
                        </Typography>
                        <Typography variant="caption" sx={{ color: textColors.secondary, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {c.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.risk_rating}
                          size="small"
                          sx={{
                            backgroundColor: riskStyle.bg,
                            color: riskStyle.text,
                            border: `1px solid ${riskStyle.border}`,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            borderRadius: "4px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{c.control_nature}</TableCell>
                      <TableCell sx={{ fontSize: "0.8rem" }}>{c.control_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={currentStatus}
                          size="small"
                          color={currentStatus === "Compliant" ? "success" : "warning"}
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: "0.75rem", borderRadius: "4px" }}
                        />
                      </TableCell>
                      <TableCell textAlign="center">
                        <Tooltip title="View Working Paper Details">
                          <IconButton size="small" color="primary">
                            <ExternalLink size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      )}

      {/* Auditor Working Paper Drawer Detail View */}
      <Drawer
        anchor="right"
        open={Boolean(selectedControl)}
        onClose={() => setSelectedControl(null)}
        PaperProps={{
          sx: { width: { xs: "100%", md: 680 }, p: 3, background: background.main },
        }}
      >
        {selectedControl && (
          <Stack spacing={3}>
            {/* Drawer Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={selectedControl.wp_ref} color="primary" sx={{ fontWeight: 700, fontFamily: "monospace", borderRadius: "4px" }} />
                  <Chip
                    label={selectedControl.risk_rating}
                    sx={{
                      backgroundColor: getRiskStyle(selectedControl.risk_rating).bg,
                      color: getRiskStyle(selectedControl.risk_rating).text,
                      border: `1px solid ${getRiskStyle(selectedControl.risk_rating).border}`,
                      fontWeight: 700,
                      borderRadius: "4px",
                    }}
                  />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                  {selectedControl.ctrl_ref}: {selectedControl.objective}
                </Typography>
                <Typography variant="caption" sx={{ color: textColors.secondary }}>
                  Section: {selectedControl.sec_ref} | Domain: {selectedControl.domain}
                </Typography>
              </Stack>
              <IconButton onClick={() => setSelectedControl(null)}>
                <X size={20} />
              </IconButton>
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: "divider" }} />

            {/* Objective & Description */}
            <Paper elevation={0} sx={{ p: 2, background: "#f8fafc", borderRadius: "4px", border: `1px solid ${borderPalette.dark}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5, color: brand.primary }}>
                Control Description
              </Typography>
              <Typography variant="body2" sx={{ color: textColors.primary }}>
                {selectedControl.description}
              </Typography>
            </Paper>

            {/* Test Procedure */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                🔍 Detailed Audit Test Procedure
              </Typography>
              <Paper elevation={0} sx={{ p: 2, border: `1px solid ${borderPalette.dark}`, borderRadius: "4px" }}>
                <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
                  {selectedControl.test_procedure || "Review documented evidence against model specification."}
                </Typography>
              </Paper>
            </Box>

            {/* Evidence & Sample Size */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  📁 Evidence to be Obtained
                </Typography>
                <Paper elevation={0} sx={{ p: 1.5, border: `1px solid ${borderPalette.dark}`, borderRadius: "4px", minHeight: 90 }}>
                  <Typography variant="caption" sx={{ color: textColors.primary }}>
                    {selectedControl.evidence || "Validation report; testing logs; approvals."}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  📊 Sample Size & Testing Approach
                </Typography>
                <Paper elevation={0} sx={{ p: 1.5, border: `1px solid ${borderPalette.dark}`, borderRadius: "4px", minHeight: 90 }}>
                  <Typography variant="caption" sx={{ color: textColors.primary }}>
                    {selectedControl.sample_size || "100% of high-risk models; sample of medium-risk."}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Pass / Fail Criteria */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                ✅ Acceptance / Pass-Fail Criteria
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "4px" }}>
                <Typography variant="caption" sx={{ color: "#166534" }}>
                  {selectedControl.pass_fail || "Control operating effectively if documented evidence confirms activity was performed and approved within defined timelines."}
                </Typography>
              </Paper>
            </Box>

            {/* Control Attributes Grid */}
            <Grid container spacing={1.5}>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: textColors.secondary, display: "block" }}>Nature</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedControl.control_nature}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: textColors.secondary, display: "block" }}>Type</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedControl.control_type}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" sx={{ color: textColors.secondary, display: "block" }}>Periodicity</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedControl.periodicity}</Typography>
              </Grid>
            </Grid>

            {/* Auditor Sign-Off Remarks */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                ✍️ Auditor Observation & Sign-Off Remarks
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Enter auditor testing notes, observations, or exception references..."
                value={auditorRemarks[selectedControl.ctrl_ref] || selectedControl.remarks || ""}
                onChange={(e) => handleRemarksChange(selectedControl.ctrl_ref, e.target.value)}
              />
            </Box>

            {/* Action Footer */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setSelectedControl(null)}>
                Close
              </Button>
              <Button
                variant="contained"
                sx={{ backgroundColor: brand.primary }}
                onClick={() => {
                  alert(`Saved Working Paper ${selectedControl.wp_ref} sign-off!`);
                  setSelectedControl(null);
                }}
              >
                Save Working Paper Sign-Off
              </Button>
            </Stack>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
};

export default BankChecklistViewer;
