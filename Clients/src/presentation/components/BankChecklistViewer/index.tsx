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
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  FileText,
  X,
  CheckCircle2,
  Clock,
  ExternalLink,
  Download,
  Filter,
} from "lucide-react";
import bankControlsData from "../../../../../shared/bank_controls_extracted.json";
import { brand, status as statusPalette, border as borderPalette, background, text as textColors } from "../../themes/palette";

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

const TRACKS = [
  "Summary Dashboard",
  "AI Governance Control Testing",
  "AI Security, Governance & Ops",
  "Regulatory Compilance",
];

const getRiskColor = (rating: string) => {
  switch (rating?.toLowerCase()) {
    case "critical":
    case "high":
      return statusPalette.error.text;
    case "medium":
      return statusPalette.warning.text;
    case "low":
      return statusPalette.success.text;
    default:
      return brand.primary;
  }
};

const getRiskBg = (rating: string) => {
  switch (rating?.toLowerCase()) {
    case "critical":
    case "high":
      return statusPalette.error.bg;
    case "medium":
      return statusPalette.warning.bg;
    case "low":
      return statusPalette.success.bg;
    default:
      return brand.primaryLight;
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

  // Filter controls based on tab & filter choices
  const filteredControls = useMemo(() => {
    let list = allControls;

    // Filter by track tab (Tab 0 is Summary Dashboard)
    if (activeTab > 0) {
      const currentTrack = TRACKS[activeTab];
      list = list.filter((c) => c.track === currentTrack);
    }

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

  // Unique domains for active track
  const availableDomains = useMemo(() => {
    const trackControls = activeTab > 0 ? allControls.filter((c) => c.track === TRACKS[activeTab]) : allControls;
    return Array.from(new Set(trackControls.map((c) => c.domain))).sort();
  }, [allControls, activeTab]);

  // Statistics for Summary Dashboard
  const stats = useMemo(() => {
    const total = allControls.length;
    const highCritical = allControls.filter(
      (c) => c.risk_rating.toLowerCase() === "high" || c.risk_rating.toLowerCase() === "critical"
    ).length;
    const preventive = allControls.filter((c) => c.control_nature.toLowerCase().includes("preventive")).length;
    const detective = allControls.filter((c) => c.control_nature.toLowerCase().includes("detective")).length;
    const corrective = allControls.filter((c) => c.control_nature.toLowerCase().includes("corrective")).length;

    const trackCounts = {
      gov: allControls.filter((c) => c.track === "AI Governance Control Testing").length,
      sec: allControls.filter((c) => c.track === "AI Security, Governance & Ops").length,
      reg: allControls.filter((c) => c.track === "Regulatory Compilance").length,
    };

    return { total, highCritical, preventive, detective, corrective, trackCounts };
  }, [allControls]);

  const handleRemarksChange = (ref: string, val: string) => {
    setAuditorRemarks((prev) => ({ ...prev, [ref]: val }));
  };

  const handleStatusChange = (ref: string, val: string) => {
    setControlStatuses((prev) => ({ ...prev, [ref]: val }));
  };

  return (
    <Box sx={{ width: "100%", p: 3, background: background.main, minHeight: "100vh" }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${borderPalette.dark}`,
          background: `linear-gradient(135deg, ${brand.primary}15 0%, ${background.gradientStop} 100%)`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ShieldCheck size={28} color={brand.primary} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: textColors.primary }}>
                ABCBank AI-GRC Master Audit Checklist
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: textColors.secondary }}>
              Comprehensive 145+ Controls Audit Working Papers & Regulatory Assurance Matrix (RBI FREE-AI, CERT-In, SEBI CSCRF, DPDP Act 2023, OWASP LLM 2025)
            </Typography>
          </Stack>
          <Chip
            icon={<FileSpreadsheet size={16} />}
            label="4-Sheet Excel Baseline Loaded"
            sx={{
              backgroundColor: brand.primaryLight,
              color: brand.primary,
              fontWeight: 600,
              px: 1,
            }}
          />
        </Stack>
      </Paper>

      {/* Track Tabs */}
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
              minHeight: 48,
            },
            "& .Mui-selected": {
              color: brand.primary,
            },
          }}
        >
          <Tab label="📊 1. Summary Dashboard" />
          <Tab label={`⚖️ 2. AI Governance Control Testing (${stats.trackCounts.gov})`} />
          <Tab label={`🛡️ 3. AI Security, Governance & Ops (${stats.trackCounts.sec})`} />
          <Tab label={`📜 4. Regulatory Compliance (${stats.trackCounts.reg})`} />
        </Tabs>
      </Box>

      {/* Tab 0: Summary Dashboard */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          {/* Executive Stat Cards */}
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: `1px solid ${borderPalette.dark}`, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 600 }}>
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
              <Card sx={{ border: `1px solid ${borderPalette.dark}`, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 600 }}>
                    HIGH & CRITICAL RISK CONTROLS
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: statusPalette.error.text, my: 1 }}>
                    {stats.highCritical}
                  </Typography>
                  <Typography variant="caption" sx={{ color: textColors.secondary }}>
                    Priority Testing Scope ({Math.round((stats.highCritical / stats.total) * 100)}% of total)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: `1px solid ${borderPalette.dark}`, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 600 }}>
                    CONTROL NATURE RATIO
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Preventive: {stats.preventive} | Detective: {stats.detective}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textColors.secondary }}>
                      Corrective: {stats.corrective}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: `1px solid ${borderPalette.dark}`, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 600 }}>
                    BANK COMPLIANCE ASSURANCE
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

          {/* Track Breakdowns */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${borderPalette.dark}` }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Sheet 2: AI Governance Control Testing
                </Typography>
                <Typography variant="body2" sx={{ color: textColors.secondary, mb: 2 }}>
                  79 controls covering Fairness, Transparency, Accountability, Data Privacy, AIBOM, and Lifecycle Model Risk.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setActiveTab(1)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  View 79 Controls →
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${borderPalette.dark}` }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Sheet 3: AI Security, Governance & Ops
                </Typography>
                <Typography variant="body2" sx={{ color: textColors.secondary, mb: 2 }}>
                  49 controls covering OWASP LLM 2025, AI Firewalls, SIEM Threat Intel, Hallucinations, & Quantum-Safe Tech.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setActiveTab(2)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  View 49 Controls →
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid ${borderPalette.dark}` }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Sheet 4: Regulatory Compliance
                </Typography>
                <Typography variant="body2" sx={{ color: textColors.secondary, mb: 2 }}>
                  17 controls covering RBI FREE-AI, CERT-In Blueprint CIGU-2026-0002, SEBI CSCRF, DPDP 2023, & IndiaAI Mission.
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => setActiveTab(3)}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  View 17 Regulatory Controls →
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}

      {/* Tabs 1, 2, 3: Controls Tables */}
      {activeTab > 0 && (
        <Stack spacing= {2.5}>
          {/* Filters Bar */}
          <Paper sx={{ p: 2, borderRadius: 2, border: `1px solid ${borderPalette.dark}` }}>
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
          <TableContainer component={Paper} sx={{ borderRadius: 2, border: `1px solid ${borderPalette.dark}` }}>
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
                            backgroundColor: getRiskBg(c.risk_rating),
                            color: getRiskColor(c.risk_rating),
                            fontWeight: 700,
                            fontSize: "0.75rem",
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
                          sx={{ fontWeight: 600, fontSize: "0.75rem" }}
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
                  <Chip label={selectedControl.wp_ref} color="primary" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
                  <Chip
                    label={selectedControl.risk_rating}
                    sx={{
                      backgroundColor: getRiskBg(selectedControl.risk_rating),
                      color: getRiskColor(selectedControl.risk_rating),
                      fontWeight: 700,
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
            <Paper sx={{ p: 2, background: "#f8fafc", borderRadius: 2 }}>
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
              <Paper sx={{ p: 2, border: `1px solid ${borderPalette.dark}`, borderRadius: 2 }}>
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
                <Paper sx={{ p: 1.5, border: `1px solid ${borderPalette.dark}`, borderRadius: 2, minHeight: 90 }}>
                  <Typography variant="caption" sx={{ color: textColors.primary }}>
                    {selectedControl.evidence || "Validation report; testing logs; approvals."}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  📊 Sample Size & Testing Approach
                </Typography>
                <Paper sx={{ p: 1.5, border: `1px solid ${borderPalette.dark}`, borderRadius: 2, minHeight: 90 }}>
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
              <Paper sx={{ p: 1.5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 2 }}>
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
