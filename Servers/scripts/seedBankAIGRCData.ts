import { sequelize } from "../database/db";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

const ORG_NAME = "ABCBank-Enterprise";
const SALT_ROUNDS = 10;

async function seedBankAIGRCData() {
  console.log(`\n==================================================`);
  console.log(`Starting Seeding for Bank AI-GRC System: ${ORG_NAME}...`);
  console.log(`==================================================\n`);

  const transaction = await sequelize.transaction();

  try {
    await sequelize.query(`SET search_path TO verifywise, public;`, { transaction });

    // 0. Ensure controls and control_categories tables exist
    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS verifywise.control_categories (
         id SERIAL PRIMARY KEY,
         project_id INTEGER,
         title VARCHAR(255) NOT NULL,
         description TEXT,
         created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
       );`,
      { transaction }
    );

    await sequelize.query(
      `CREATE TABLE IF NOT EXISTS verifywise.controls (
         id SERIAL PRIMARY KEY,
         control_category_id INTEGER,
         title VARCHAR(500) NOT NULL,
         description TEXT,
         wp_ref VARCHAR(255),
         test_procedure TEXT,
         pass_fail_criteria TEXT,
         sample_size TEXT,
         control_nature VARCHAR(50),
         control_type VARCHAR(50),
         testing_periodicity VARCHAR(100),
         auditor_remarks TEXT,
         created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
         updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
       );`,
      { transaction }
    );

    // 1. Create or get Organization
    const [existingOrgs] = await sequelize.query(
      `SELECT id FROM verifywise.organizations WHERE name = :name LIMIT 1`,
      { replacements: { name: ORG_NAME }, transaction }
    );

    let orgId: number;
    if ((existingOrgs as any[]).length > 0) {
      orgId = (existingOrgs as any[])[0].id;
      console.log(`✓ Found existing Organization "${ORG_NAME}" with ID: ${orgId}`);
    } else {
      const [newOrg] = await sequelize.query(
        `INSERT INTO verifywise.organizations (name, onboarding_status, created_at, updated_at)
         VALUES (:name, 'completed', NOW(), NOW())
         RETURNING id`,
        { replacements: { name: ORG_NAME }, transaction }
      );
      orgId = (newOrg as any[])[0].id;
      console.log(`✓ Created Organization "${ORG_NAME}" with ID: ${orgId}`);
    }

    // 2. Configure Users
    const hashedPassword = await bcrypt.hash("ChangeMe!Str0ng", SALT_ROUNDS);
    const usersData = [
      { name: "VerifyWise", surname: "Admin", email: "admin@verifywise.com", roleId: 1 },
      { name: "CISO", surname: "ChiefInfoSecOfficer", email: "ciso@abcbank.com", roleId: 1 },
      { name: "CRO", surname: "ChiefRiskOfficer", email: "cro@abcbank.com", roleId: 1 },
    ];

    let primaryUserId = 1;
    for (const u of usersData) {
      const [userRes] = await sequelize.query(
        `INSERT INTO verifywise.users (name, surname, email, password_hash, role_id, organization_id, created_at, updated_at)
         VALUES (:name, :surname, :email, :password, :roleId, :orgId, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET organization_id = :orgId, password_hash = :password
         RETURNING id`,
        {
          replacements: {
            name: u.name,
            surname: u.surname,
            email: u.email,
            password: hashedPassword,
            roleId: u.roleId,
            orgId,
          },
          transaction,
        }
      );
      if (u.email === "admin@verifywise.com" && (userRes as any[])[0]) {
        primaryUserId = (userRes as any[])[0].id;
      }
    }
    console.log(`✓ Configured Users for ${ORG_NAME} (Primary Admin User ID: ${primaryUserId})`);

    // 3. Configure Frameworks
    const bankFrameworks = [
      { id: 10, name: "RBI FREE-AI & ITGRC", isOrg: true },
      { id: 11, name: "CERT-In AI Guidelines", isOrg: true },
      { id: 12, name: "SEBI CSCRF", isOrg: true },
      { id: 13, name: "DPDP Act 2023 & IT Act", isOrg: true },
      { id: 14, name: "India AI Vision 2030", isOrg: true },
      { id: 15, name: "OWASP LLM Top 10 (2025)", isOrg: false },
    ];

    for (const fw of bankFrameworks) {
      await sequelize.query(
        `INSERT INTO verifywise.frameworks (id, name, description, is_organizational, is_active, created_at, updated_at)
         VALUES (:id, :name, :name, :isOrg, true, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET name = :name, is_organizational = :isOrg`,
        { replacements: { id: fw.id, name: fw.name, isOrg: fw.isOrg }, transaction }
      );
    }
    console.log(`✓ Configured 6 Banking Frameworks`);

    // 4. Create Use Cases / Projects
    const projectsData = [
      {
        ucId: "UC-BANK-001",
        title: "AI Credit Scoring & Automated Underwriting System",
        classification: "High risk",
        goal: "Automate retail credit underwriting, applicant scoring, and credit risk limit assignment.",
        industry: "Banking & Financial Services",
        status: "In progress",
        isOrg: false,
      },
      {
        ucId: "UC-BANK-002",
        title: "Real-Time AML & Financial Fraud Detection Model",
        classification: "High risk",
        goal: "Monitor transactions in real time to detect money laundering, fraud patterns, and anomaly spikes.",
        industry: "Banking & Financial Services",
        status: "In progress",
        isOrg: false,
      },
      {
        ucId: "UC-BANK-003",
        title: "Customer Support Conversational AI Bot",
        classification: "Limited risk",
        goal: "Assist retail banking customers with balance inquiries, statement generation, and support queries.",
        industry: "Banking & Financial Services",
        status: "In progress",
        isOrg: false,
      },
      {
        ucId: "UC-BANK-004",
        title: "SOC Cyber Threat Intelligence & Log AI Analyzer",
        classification: "High risk",
        goal: "AI-driven log analysis and SIEM threat correlation for real-time cyber defense.",
        industry: "Banking & Financial Services",
        status: "In progress",
        isOrg: false,
      },
      {
        ucId: "UC-BANK-ORG",
        title: "ABCBank Enterprise Compliance & Governance",
        classification: "General Risk",
        goal: "Enterprise-wide AI Risk Management System, RBI FREE-AI, CERT-In, and SEBI CSCRF Governance.",
        industry: "Banking & Financial Services",
        status: "In progress",
        isOrg: true,
      },
    ];

    const projectMap: Record<string, number> = {};
    for (const proj of projectsData) {
      const [pRes] = await sequelize.query(
        `INSERT INTO verifywise.projects (
           organization_id, uc_id, project_title, owner, start_date, ai_risk_classification,
           goal, target_industry, status, is_demo, is_organizational, created_at, last_updated
         )
         VALUES (
           :orgId, :ucId, :title, :userId, NOW(), :classification::verifywise.enum_projects_ai_risk_classification,
           :goal, :industry, :status::verifywise.projects_status_enum, false, :isOrg, NOW(), NOW()
         )
         ON CONFLICT (organization_id, uc_id) DO UPDATE SET project_title = :title
         RETURNING id`,
        {
          replacements: {
            orgId,
            ucId: proj.ucId,
            title: proj.title,
            userId: primaryUserId,
            classification: proj.classification,
            goal: proj.goal,
            industry: proj.industry,
            status: proj.status,
            isOrg: proj.isOrg,
          },
          transaction,
        }
      );
      projectMap[proj.ucId] = (pRes as any[])[0].id;
    }
    console.log(`✓ Configured 5 In-Scope Banking Projects/Use Cases`);

    // 5. Link Frameworks to Projects
    for (const [ucId, pId] of Object.entries(projectMap)) {
      const fwIds = ucId === "UC-BANK-ORG" ? [10, 11, 12, 13, 14, 2, 3, 4] : [15, 1];
      for (const fwId of fwIds) {
        await sequelize.query(
          `INSERT INTO verifywise.projects_frameworks (framework_id, project_id, is_demo)
           VALUES (:fwId, :pId, false)
           ON CONFLICT DO NOTHING`,
          { replacements: { fwId, pId }, transaction }
        );
      }
    }
    console.log(`✓ Linked Frameworks to Bank Projects`);

    // 6. Ingest 145+ Controls from extracted JSON
    const jsonPath = path.join(__dirname, "../../shared/bank_controls_extracted.json");
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Controls extracted file not found at ${jsonPath}`);
    }

    const rawControls = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    console.log(`Found ${rawControls.length} controls extracted from Excel sheets.`);

    const categoriesSet = new Set<string>();
    rawControls.forEach((c: any) => categoriesSet.add(c.domain || "General Governance"));

    const categoryMap: Record<string, number> = {};
    for (const catName of Array.from(categoriesSet)) {
      const [cRes] = await sequelize.query(
        `INSERT INTO verifywise.control_categories (title, description, created_at, updated_at)
         VALUES (:title, :description, NOW(), NOW())
         RETURNING id`,
        { replacements: { title: catName, description: `Category: ${catName}` }, transaction }
      );
      categoryMap[catName] = (cRes as any[])[0].id;
    }

    let insertedCount = 0;
    for (const c of rawControls) {
      const catId = categoryMap[c.domain] || 1;
      const titleStr = `${c.ctrl_ref}: ${c.sec_ref} ${c.objective || c.domain}`;
      const descStr = c.description || c.objective;

      await sequelize.query(
        `INSERT INTO verifywise.controls (
           control_category_id, title, description, wp_ref, test_procedure, pass_fail_criteria,
           sample_size, control_nature, control_type, testing_periodicity, auditor_remarks, created_at, updated_at
         )
         VALUES (
           :catId, :title, :desc, :wpRef, :testProc, :passFail,
           :sampleSize, :nature, :type, :periodicity, :remarks, NOW(), NOW()
         )`,
        {
          replacements: {
            catId,
            title: titleStr.substring(0, 490),
            desc: descStr,
            wpRef: c.wp_ref || `WP-${c.ctrl_ref}-2026`,
            testProc: c.test_procedure || "",
            passFail: c.pass_fail || "",
            sampleSize: c.sample_size || "",
            nature: c.control_nature || "Preventive",
            type: c.control_type || "Manual",
            periodicity: c.periodicity || "Annual",
            remarks: c.remarks || "",
          },
          transaction,
        }
      );
      insertedCount++;
    }
    console.log(`✓ Ingested ${insertedCount} Controls with Audit Working Paper fields into Database`);

    // 7. Insert Model Inventories
    const modelsData = [
      { name: "CreditRisk-XGBoost-v2.1", tier: "1", provider: "Internal Banking ML Engine", model: "XGBoost Classifier" },
      { name: "FraudNet-BERT-v1.4", tier: "1", provider: "Internal Fraud Intelligence", model: "BERT Transformer" },
      { name: "CustomerBot-LLM-v3.0", tier: "2", provider: "Azure OpenAI Service", model: "GPT-4o Fine-Tuned" },
      { name: "SOC-AnomalyDetector-v4.0", tier: "2", provider: "AWS SageMaker", model: "Isolation Forest / Autoencoder" },
    ];

    for (const m of modelsData) {
      await sequelize.query(
        `INSERT INTO verifywise.model_inventories (
           organization_id, provider_model, version, provider, model, mrm_tier, status, is_demo, created_at, updated_at
         )
         VALUES (
           :orgId, :name, '1.0.0', :provider, :model, :tier::verifywise.enum_mrm_tier, 'Approved'::verifywise.enum_model_inventories_status, false, NOW(), NOW()
         )
         ON CONFLICT DO NOTHING`,
        { replacements: { orgId, name: m.name, provider: m.provider, model: m.model, tier: m.tier }, transaction }
      );
    }
    console.log(`✓ Ingested ${modelsData.length} Model Inventory entries`);

    // 8. Insert Vendors
    const vendorsData = [
      { name: "Microsoft Azure AI Services", sensitivity: "Financial data", criticality: "High (critical to core services or products)" },
      { name: "OpenAI Enterprise", sensitivity: "Personally identifiable information (PII)", criticality: "High (critical to core services or products)" },
      { name: "AWS SageMaker Infrastructure", sensitivity: "Financial data", criticality: "High (critical to core services or products)" },
      { name: "Databricks Analytics", sensitivity: "Internal only", criticality: "Medium (affects operations but is replaceable)" },
    ];

    for (const v of vendorsData) {
      await sequelize.query(
        `INSERT INTO verifywise.vendors (
           organization_id, vendor_name, website, vendor_contact_person, vendor_provides, data_sensitivity, business_criticality,
           risk_score, is_demo, created_at, updated_at
         )
         VALUES (
           :orgId, :name, 'https://vendor.com', 'Enterprise Account Mgr', 'Cloud AI & ML Engine',
           :sensitivity::verifywise.enum_vendors_data_sensitivity, :criticality::verifywise.enum_vendors_business_criticality,
           85, false, NOW(), NOW()
         )
         ON CONFLICT DO NOTHING`,
        { replacements: { orgId, name: v.name, sensitivity: v.sensitivity, criticality: v.criticality }, transaction }
      );
    }
    console.log(`✓ Ingested ${vendorsData.length} Vendors`);

    await transaction.commit();
    console.log(`\n==================================================`);
    console.log(`🎉 SUCCESS: All 145+ Bank AI-GRC controls & frameworks seeded into PostgreSQL!`);
    console.log(`==================================================\n`);
  } catch (err) {
    await transaction.rollback();
    console.error(`❌ Seeding failed:`, err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedBankAIGRCData();
