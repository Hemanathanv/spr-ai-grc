import React, { useState, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
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
import bankControlsData from "../../assets/bank_controls_extracted.json";
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

interface FrameworkControlsViewerProps {
  frameworkName: string;
}

export const FrameworkControlsViewer: React.FC<FrameworkControlsViewerProps> = ({ frameworkName }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [selectedNature, setSelectedNature] = useState<string>("all");
  const [selectedControl, setSelectedControl] = useState<BankControl | null>(null);
  const [auditorRemarks, setAuditorRemarks] = useState<Record<string, string>>({});
  const [controlStatuses, setControlStatuses] = useState<Record<string, string>>({});

  const allControls = bankControlsData as BankControl[];

  // Filter controls specific to the selected framework
  const frameworkControls = useMemo(() => {
    if (!Array.isArray(allControls)) return [];
    const fname = (frameworkName || "").toLowerCase();

    if (fname.includes("cert-in") || fname.includes("cigu")) {
      return allControls.filter(
        (c) =>
          (c.track || "").includes("Security") ||
          (c.domain || "").includes("Firewall") ||
          (c.domain || "").includes("Threat") ||
          (c.ctrl_ref || "").startsWith("GATE") ||
          (c.ctrl_ref || "").startsWith("OWSP") ||
          (c.ctrl_ref || "").startsWith("QNTM")
      );
    }

    if (fname.includes("sebi") || fname.includes("cscrf")) {
      return allControls.filter(
        (c) =>
          (c.track || "").includes("Compliance") ||
          (c.domain || "").includes("Governance") ||
          (c.ctrl_ref || "").startsWith("REGF") ||
          (c.ctrl_ref || "").startsWith("EXPL")
      );
    }

    if (fname.includes("dpdp") || fname.includes("privacy") || fname.includes("it act")) {
      return allControls.filter(
        (c) =>
          (c.domain || "").includes("Privacy") ||
          (c.ctrl_ref || "").startsWith("PRIV") ||
          (c.description || "").toLowerCase().includes("pii")
      );
    }

    if (fname.includes("india ai") || fname.includes("vision")) {
      return allControls.filter(
        (c) =>
          (c.domain || "").includes("Supply-Chain") ||
          (c.ctrl_ref || "").startsWith("AIBOM") ||
          (c.ctrl_ref || "").startsWith("HALU")
      );
    }

    if (fname.includes("rbi") || fname.includes("free-ai") || fname.includes("itgrc")) {
      return allControls;
    }

    return allControls;
  }, [allControls, frameworkName]);

  // Filter controls based on user criteria
  const filteredControls = useMemo(() => {
    let list = frameworkControls;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          (c.ctrl_ref || "").toLowerCase().includes(term) ||
          (c.wp_ref || "").toLowerCase().includes(term) ||
          (c.objective || "").toLowerCase().includes(term) ||
          (c.domain || "").toLowerCase().includes(term) ||
          (c.description || "").toLowerCase().includes(term)
      );
    }

    if (selectedDomain !== "all") {
      list = list.filter((c) => (c.domain || "") === selectedDomain);
    }

    if (selectedRisk !== "all") {
      list = list.filter((c) => (c.risk_rating || "").toLowerCase() === selectedRisk.toLowerCase());
    }

    if (selectedNature !== "all") {
      list = list.filter((c) => (c.control_nature || "").toLowerCase() === selectedNature.toLowerCase());
    }

    return list;
  }, [frameworkControls, searchTerm, selectedDomain, selectedRisk, selectedNature]);

  // Available domains for dropdown
  const availableDomains = useMemo(() => {
    return Array.from(new Set(frameworkControls.map((c) => c.domain || "General").filter(Boolean))).sort();
  }, [frameworkControls]);

  const handleRemarksChange = (ref: string, val: string) => {
    setAuditorRemarks((prev) => ({ ...prev, [ref]: val }));
  };

  return (
    <Stack spacing={3} sx={{ mt: 1 }}>
      {/* Header Info Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: "4px",
          border: `1px solid ${borderPalette.dark}`,
          background: `linear-gradient(135deg, ${background.main} 0%, ${background.gradientStop} 100%)`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={0.5}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: textColors.primary }}>
              {frameworkName} Requirements & Controls
            </Typography>
            <Typography variant="body2" sx={{ color: textColors.secondary }}>
              Loaded {frameworkControls.length} active regulatory controls from enterprise audit baseline.
            </Typography>
          </Stack>
          <Chip
            icon={<ShieldCheck size={14} color={brand.primary} />}
            label={`${frameworkControls.length} Controls Ingested`}
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

      {/* Filter Toolbar */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: "4px", border: `1px solid ${borderPalette.dark}` }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search controls, WP reference, objective..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search size={18} style={{ marginRight: 8, color: textColors.secondary }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="Control Domain"
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
                    <Typography
                      variant="caption"
                      sx={{
                        color: textColors.secondary,
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
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

      {/* Working Paper Drawer */}
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
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={selectedControl.wp_ref} color="primary" sx={{ fontWeight: 700, fontFamily: "monospace", borderRadius: "4px" }} />
                  <Chip
                    label={selectedControl.risk_rating}
                    sx={{
                      backgroundColor: getRiskStyle(selectedControl.risk_rating).bg,
                      color: getRiskStyle(selectedControl.risk_rating).text,
                      fontWeight: 700,
                      borderRadius: "4px",
                    }}
                  />
                  <Chip label={selectedControl.control_nature} variant="outlined" sx={{ borderRadius: "4px" }} />
                </Stack>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                  {selectedControl.ctrl_ref}: {selectedControl.objective}
                </Typography>
                <Typography variant="caption" sx={{ color: textColors.secondary }}>
                  Domain: <b>{selectedControl.domain}</b> | Track: <b>{selectedControl.track}</b>
                </Typography>
              </Stack>
              <IconButton onClick={() => setSelectedControl(null)}>
                <X size={20} />
              </IconButton>
            </Stack>

            {/* Content Sections */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "4px", border: `1px solid ${borderPalette.dark}`, backgroundColor: "#f9fafb" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: brand.primary, mb: 1 }}>
                📋 Detailed Audit Description & Scope
              </Typography>
              <Typography variant="body2" sx={{ color: textColors.primary, lineHeight: 1.6 }}>
                {selectedControl.description}
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "4px", border: `1px solid ${borderPalette.dark}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: brand.primary, mb: 1 }}>
                🔬 Auditor Test Procedure
              </Typography>
              <Typography variant="body2" sx={{ color: textColors.primary, lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {selectedControl.test_procedure}
              </Typography>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: "4px", border: `1px solid ${borderPalette.dark}` }}>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 700 }}>
                    EVIDENCE REQUIRED
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {selectedControl.evidence}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: "4px", border: `1px solid ${borderPalette.dark}` }}>
                  <Typography variant="caption" sx={{ color: textColors.secondary, fontWeight: 700 }}>
                    PASS / FAIL CRITERIA
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: statusPalette.success.text }}>
                    {selectedControl.pass_fail}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Status & Remarks Form */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: "4px", border: `1px solid ${borderPalette.dark}`, backgroundColor: "#ffffff" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                ✍️ Auditor Sign-Off & Remarks
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Audit Working Paper Status"
                  value={controlStatuses[selectedControl.ctrl_ref] || selectedControl.status || "Compliant"}
                  onChange={(e) => setControlStatuses((prev) => ({ ...prev, [selectedControl.ctrl_ref]: e.target.value }))}
                >
                  <MenuItem value="Compliant">✅ Compliant / Pass</MenuItem>
                  <MenuItem value="Needs Attention">⚠️ Needs Attention / Deficiency</MenuItem>
                  <MenuItem value="Non-Compliant">❌ Non-Compliant / Fail</MenuItem>
                  <MenuItem value="Under Review">🔍 Under Review</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Auditor Observations & Testing Remarks"
                  placeholder="Record testing evidence, sample size verification notes..."
                  value={auditorRemarks[selectedControl.ctrl_ref] || selectedControl.remarks || ""}
                  onChange={(e) => handleRemarksChange(selectedControl.ctrl_ref, e.target.value)}
                />

                <Button variant="contained" color="primary" onClick={() => setSelectedControl(null)}>
                  Save Working Paper Sign-Off
                </Button>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
};

export default FrameworkControlsViewer;
