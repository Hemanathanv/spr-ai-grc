import { sequelize } from "../database/db";
import bcrypt from "bcrypt";

const ORG_NAME = "ABCBank-Test";
const SALT_ROUNDS = 10;

function formatPgArray(arr: string[]): string {
  const escaped = arr.map((s) => `"${s.replace(/"/g, '\\"')}"`);
  return `{${escaped.join(",")}}`;
}

async function seedABCBankData() {
  console.log(`Starting ingestion of mock data for organization: ${ORG_NAME}...`);

  const transaction = await sequelize.transaction();

  try {
    await sequelize.query(`SET search_path TO verifywise, public;`, { transaction });

    // 1. Create or get ABCBank-Test organization
    const [existingOrgs] = await sequelize.query(
      `SELECT id FROM verifywise.organizations WHERE name = :name LIMIT 1`,
      { replacements: { name: ORG_NAME }, transaction }
    );

    let orgId: number;
    if ((existingOrgs as any[]).length > 0) {
      orgId = (existingOrgs as any[])[0].id;
      console.log(`✓ Organization "${ORG_NAME}" exists with ID: ${orgId}`);
    } else {
      const [newOrgResult] = await sequelize.query(
        `INSERT INTO verifywise.organizations (name, onboarding_status, created_at, updated_at)
         VALUES (:name, 'completed', NOW(), NOW())
         RETURNING id`,
        { replacements: { name: ORG_NAME }, transaction }
      );
      orgId = (newOrgResult as any[])[0].id;
      console.log(`✓ Created organization "${ORG_NAME}" with ID: ${orgId}`);
    }

    // 2. Ensure admin users belong to ABCBank-Test
    const hashedPassword = await bcrypt.hash("ChangeMe!Str0ng", SALT_ROUNDS);

    await sequelize.query(
      `INSERT INTO verifywise.users (name, surname, email, password_hash, role_id, organization_id, created_at, updated_at)
       VALUES ('ABCBank', 'Admin', 'admin@verifywise.com', :password, 1, :orgId, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET organization_id = :orgId, password_hash = :password`,
      { replacements: { password: hashedPassword, orgId }, transaction }
    );

    await sequelize.query(
      `INSERT INTO verifywise.users (name, surname, email, password_hash, role_id, organization_id, created_at, updated_at)
       VALUES ('Karthik', 'Jeganathan', 'karthik@abcbank-test.com', :password, 1, :orgId, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET organization_id = :orgId, password_hash = :password`,
      { replacements: { password: hashedPassword, orgId }, transaction }
    );

    await sequelize.query(
      `INSERT INTO verifywise.users (name, surname, email, password_hash, role_id, organization_id, created_at, updated_at)
       VALUES ('Adithya', 'RiskLead', 'adithya@abcbank-test.com', :password, 1, :orgId, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET organization_id = :orgId, password_hash = :password`,
      { replacements: { password: hashedPassword, orgId }, transaction }
    );

    // Get admin user id
    const [userRows] = await sequelize.query(
      `SELECT id FROM verifywise.users WHERE email = 'admin@verifywise.com' LIMIT 1`,
      { transaction }
    );
    const userId = (userRows as any[])[0]?.id || 1;
    console.log(`✓ Configured Users for ${ORG_NAME} (Admin User ID: ${userId})`);

    // 3. Insert Policies from IS Audit & Model Risk Frameworks
    const policies = [
      {
        title: "IT & AI Governance Framework Policy (RBI-ITGRC & OSFI E-23)",
        status: "published",
        tags: ["IT Governance", "RBI-ITGRC", "OSFI E-23", "AI Governance"],
        content: `
          <h2>1. Objective</h2>
          <p>This policy defines the Information Technology and Artificial Intelligence (AI) Governance Framework for <strong>ABCBank-Test</strong>. It establishes Board-level oversight, strategic alignment, risk management, and compliance with RBI-ITGRC and OSFI Guideline E-23.</p>
          <h2>2. Scope & Control Objectives</h2>
          <ul>
            <li><strong>ITG-001 (Control Objective):</strong> Establish and document an IT Governance Framework covering strategic alignment, risk management, resource management, performance management, and BCP/DR.</li>
            <li><strong>ITG-002 (Board Review):</strong> The Board of Directors shall review and approve at least annually the IT Strategy, Information Security Policy, Cyber Security Policy, and AI Model Risk Management Policy.</li>
            <li><strong>AI Governance Committee:</strong> Maintain an independent AI Ethics & Risk Oversight Committee to review high-risk AI deployments.</li>
          </ul>
          <h2>3. Periodicity & Review</h2>
          <p>Reviewed annually by the Board of Directors and the Information Technology Steering Committee (ITSC).</p>
        `,
      },
      {
        title: "AI Model Risk Management & Validation Policy",
        status: "published",
        tags: ["AI Governance", "Model Validation", "OSFI E-23", "NIST AI RMF"],
        content: `
          <h2>1. Purpose</h2>
          <p>Establishes mandatory controls for developing, validating, monitoring, and retiring AI/ML models across ABCBank-Test financial operations.</p>
          <h2>2. Model Tiering & Classification</h2>
          <ul>
            <li><strong>Tier 1 (High Risk):</strong> Credit scoring models, automated loan underwriting, AML fraud detection models. Requires independent 3rd-party validation prior to deployment.</li>
            <li><strong>Tier 2 (Medium Risk):</strong> Algorithmic customer segmentation, churn prediction, conversational AI bots. Requires annual internal review.</li>
            <li><strong>Tier 3 (Low Risk):</strong> Internal productivity and log summary utilities.</li>
          </ul>
          <h2>3. Model Monitoring & Bias Auditing</h2>
          <p>Continuous monitoring of model drift, GRS scores, and demographic parity/disparity ratios is mandatory for all Tier 1 models.</p>
        `,
      },
      {
        title: "Information Security & Access Control Policy (ISO 27001 / Cyber Defense)",
        status: "published",
        tags: ["ISO 27001", "Access Control", "Cyber Security", "MFA"],
        content: `
          <h2>1. Policy Statement</h2>
          <p>Ensures confidentiality, integrity, and availability of ABCBank-Test customer financial data and core infrastructure.</p>
          <h2>2. Key Mandates</h2>
          <ul>
            <li>Multi-Factor Authentication (MFA) mandatory for all administrative access and production databases.</li>
            <li>Zero Trust Network Architecture for internal microservices and API gateways.</li>
            <li>Database encryption at rest (AES-256) and TLS 1.3 in transit.</li>
          </ul>
        `,
      },
      {
        title: "Third-Party & Vendor AI Risk Management Policy",
        status: "published",
        tags: ["Vendor Risk", "Third-Party AI", "Shadow AI", "GDPR"],
        content: `
          <h2>1. Scope</h2>
          <p>Governs all cloud service providers, API vendors (OpenAI, Azure, AWS), and external AI model providers used by ABCBank-Test.</p>
          <h2>2. Vendor Onboarding Requirements</h2>
          <ul>
            <li>Mandatory SOC 2 Type II and ISO 27001 certification.</li>
            <li>Zero data retention guarantee for customer PII submitted to external LLM APIs.</li>
            <li>Quarterly vendor risk assessment and SLA performance audits.</li>
          </ul>
        `,
      },
      {
        title: "Business Continuity & Disaster Recovery (BCP/DR) Policy",
        status: "published",
        tags: ["BCP/DR", "Resilience", "RBI-ITGRC"],
        content: `
          <h2>1. Purpose</h2>
          <p>Guarantees business continuity for critical banking services and AI underwriting systems during cyber incidents or disasters.</p>
          <h2>2. Target Metrics</h2>
          <ul>
            <li><strong>Recovery Time Objective (RTO):</strong> &le; 2 hours for Core Banking & Credit Scoring.</li>
            <li><strong>Recovery Point Objective (RPO):</strong> &le; 5 minutes for transaction ledgers.</li>
            <li>Bi-annual DR failover drills and Board reporting.</li>
          </ul>
        `,
      },
    ];

    for (const p of policies) {
      await sequelize.query(
        `INSERT INTO verifywise.policy_manager (
           organization_id, title, content_html, status, tags, author_id, last_updated_by, is_demo, created_at, last_updated_at
         )
         VALUES (:orgId, :title, :content, :status, :tags::text[], :userId, :userId, false, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        {
          replacements: {
            orgId,
            title: p.title,
            content: p.content,
            status: p.status,
            tags: formatPgArray(p.tags),
            userId,
          },
          transaction,
        }
      );
    }
    console.log(`✓ Ingested ${policies.length} Policies for ${ORG_NAME}`);

    // 4. Insert Use Cases / Projects for ABCBank-Test
    const projectsData = [
      {
        ucId: "UC-ABC-001",
        title: "AI Credit Scoring & Automated Underwriting System",
        classification: "High risk",
        goal: "Automate retail credit underwriting, applicant scoring, and credit risk limit assignment.",
        purpose: "Credit Assessment & Retail Lending",
        industry: "Banking & Financial Services",
        status: "In progress",
      },
      {
        ucId: "UC-ABC-002",
        title: "Real-Time AML & Financial Fraud Detection Model",
        classification: "High risk",
        goal: "Monitor transactions in real time to detect money laundering, fraud patterns, and anomaly spikes.",
        purpose: "Financial Crime & AML Compliance",
        industry: "Banking & Financial Services",
        status: "In progress",
      },
      {
        ucId: "UC-ABC-003",
        title: "Customer Support Conversational AI Bot",
        classification: "Limited risk",
        goal: "Assist retail banking customers with balance inquiries, statement generation, and support queries.",
        purpose: "Customer Engagement",
        industry: "Banking & Financial Services",
        status: "In progress",
      },
      {
        ucId: "UC-ABC-004",
        title: "SOC Cyber Threat Intelligence & Log AI Analyzer",
        classification: "High risk",
        goal: "AI-driven log analysis and SIEM threat correlation for real-time cyber defense.",
        purpose: "Cyber Security Operations",
        industry: "Banking & Financial Services",
        status: "In progress",
      },
    ];

    const createdProjectIds: number[] = [];
    for (const proj of projectsData) {
      const [pRes] = await sequelize.query(
        `INSERT INTO verifywise.projects (
           organization_id, uc_id, project_title, owner, start_date, ai_risk_classification,
           goal, target_industry, status, is_demo, created_at, last_updated
         )
         VALUES (
           :orgId, :ucId, :title, :userId, NOW(), :classification::enum_projects_ai_risk_classification,
           :goal, :industry, :status::projects_status_enum, false, NOW(), NOW()
         )
         RETURNING id`,
        {
          replacements: {
            orgId,
            ucId: proj.ucId,
            title: proj.title,
            userId,
            classification: proj.classification,
            goal: proj.goal,
            industry: proj.industry,
            status: proj.status,
          },
          transaction,
        }
      );
      createdProjectIds.push((pRes as any[])[0].id);
    }
    console.log(`✓ Created ${projectsData.length} Use Cases / Projects for ${ORG_NAME}`);

    // 5. Insert Model Inventories
    const modelsData = [
      {
        name: "CreditRisk-XGBoost-v2.1",
        version: "2.1.0",
        provider: "Internal Banking ML Engine",
        model: "XGBoost Classifier",
        tier: "1",
        drivers: "High impact on consumer loan approval and financial eligibility.",
        capabilities: "Predicts 90-day delinquency probability and calculates recommended credit limits.",
      },
      {
        name: "FraudNet-BERT-v1.4",
        version: "1.4.0",
        provider: "Internal Fraud Intelligence",
        model: "BERT Transformer Architecture",
        tier: "1",
        drivers: "Real-time automated transaction blocking and AML regulatory reporting.",
        capabilities: "Analyzes transaction text, counterparty histories, and swift wire patterns.",
      },
      {
        name: "CustomerBot-LLM-v3.0",
        version: "3.0.0",
        provider: "Azure OpenAI Service",
        model: "GPT-4o Fine-Tuned",
        tier: "2",
        drivers: "Customer facing interaction and conversational banking queries.",
        capabilities: "Natural language banking assistant with strict guardrails.",
      },
      {
        name: "SOC-AnomalyDetector-v4.0",
        version: "4.0.0",
        provider: "AWS SageMaker",
        model: "Isolation Forest / Autoencoder",
        tier: "2",
        drivers: "Internal network traffic and SIEM alert anomaly detection.",
        capabilities: "Scans netflow logs and detects unauthorized access spikes.",
      },
    ];

    for (const m of modelsData) {
      await sequelize.query(
        `INSERT INTO verifywise.model_inventories (
           organization_id, provider_model, version, provider, model, mrm_tier, mrm_materiality_drivers,
           capabilities, status, is_demo, created_at, updated_at
         )
         VALUES (
           :orgId, :name, :version, :provider, :model, :tier::enum_mrm_tier, :drivers,
           :capabilities, 'Approved'::enum_model_inventories_status, false, NOW(), NOW()
         )`,
        {
          replacements: {
            orgId,
            name: m.name,
            version: m.version,
            provider: m.provider,
            model: m.model,
            tier: m.tier,
            drivers: m.drivers,
            capabilities: m.capabilities,
          },
          transaction,
        }
      );
    }
    console.log(`✓ Created ${modelsData.length} Model Inventory entries for ${ORG_NAME}`);

    // 6. Insert Vendors
    const vendorsData = [
      {
        name: "Microsoft Azure AI Services",
        website: "https://azure.microsoft.com",
        contactPerson: "Azure Enterprise Support",
        provides: "Cloud AI Infrastructure, Azure OpenAI Service, and Managed Endpoints",
        sensitivity: "Financial data",
        criticality: "High (critical to core services or products)",
        score: 88,
      },
      {
        name: "OpenAI Enterprise",
        website: "https://openai.com",
        contactPerson: "OpenAI Enterprise Account Team",
        provides: "LLM API Access for Customer Chatbot & Text Summarization",
        sensitivity: "Personally identifiable information (PII)",
        criticality: "High (critical to core services or products)",
        score: 82,
      },
      {
        name: "AWS SageMaker Infrastructure",
        website: "https://aws.amazon.com/sagemaker",
        contactPerson: "AWS Enterprise Support",
        provides: "Model Hosting, Pipeline Training, and Feature Store",
        sensitivity: "Financial data",
        criticality: "High (critical to core services or products)",
        score: 90,
      },
      {
        name: "Databricks Analytics",
        website: "https://databricks.com",
        contactPerson: "Databricks Technical Account Mgr",
        provides: "Data Warehousing and ML Pipeline Processing",
        sensitivity: "Internal only",
        criticality: "Medium (affects operations but is replaceable)",
        score: 85,
      },
    ];

    for (const v of vendorsData) {
      await sequelize.query(
        `INSERT INTO verifywise.vendors (
           organization_id, vendor_name, website, vendor_contact_person, vendor_provides, data_sensitivity, business_criticality,
           risk_score, is_demo, created_at, updated_at
         )
         VALUES (
           :orgId, :name, :website, :contactPerson, :provides, :sensitivity::enum_vendors_data_sensitivity, :criticality::enum_vendors_business_criticality,
           :score, false, NOW(), NOW()
         )`,
        {
          replacements: {
            orgId,
            name: v.name,
            website: v.website,
            contactPerson: v.contactPerson,
            provides: v.provides,
            sensitivity: v.sensitivity,
            criticality: v.criticality,
            score: v.score,
          },
          transaction,
        }
      );
    }
    console.log(`✓ Created ${vendorsData.length} Vendor records for ${ORG_NAME}`);

    // 7. Insert Tasks / Audit Tasks
    const tasksData = [
      {
        title: "ITG-001 Audit: Verify Board Approval of IT & AI Governance Framework",
        description: "Obtain and review Board meeting minutes for annual approval of IT Strategy, Cyber Security, and AI Risk Policy (RBI-ITGRC Clause 4 & 5).",
        priority: "High",
        status: "Open",
        dueDate: "2026-08-15",
      },
      {
        title: "Model Risk Audit: Perform Independent Validation for CreditRisk-XGBoost-v2.1",
        description: "Conduct independent quantitative review of credit scoring model drift, GRS metrics, and demographic disparity per OSFI E-23 rules.",
        priority: "High",
        status: "Open",
        dueDate: "2026-08-10",
      },
      {
        title: "Vendor Audit: Review SOC 2 Type II Report for OpenAI Enterprise",
        description: "Verify zero data retention guarantees and audit data handling protocols for customer conversational AI endpoints.",
        priority: "Medium",
        status: "Open",
        dueDate: "2026-08-20",
      },
      {
        title: "BCP/DR Drill: Execute Core Banking & AI Underwriting Failover Simulation",
        description: "Test recovery time objective (RTO <= 2 hrs) and verify database failover procedures.",
        priority: "High",
        status: "Open",
        dueDate: "2026-08-30",
      },
      {
        title: "Access Control Audit: Enforce MFA and Zero Trust on SOC Security Portal",
        description: "Inspect active user access lists and enforce mandatory MFA for all security analysts.",
        priority: "Medium",
        status: "Open",
        dueDate: "2026-08-25",
      },
    ];

    for (const t of tasksData) {
      await sequelize.query(
        `INSERT INTO verifywise.tasks (
           organization_id, title, description, creator_id, due_date, priority, status, is_demo, created_at, updated_at
         )
         VALUES (
           :orgId, :title, :description, :userId, :dueDate, :priority::enum_tasks_priority, :status::enum_tasks_status, false, NOW(), NOW()
         )`,
        {
          replacements: {
            orgId,
            title: t.title,
            description: t.description,
            userId,
            dueDate: t.dueDate,
            priority: t.priority,
            status: t.status,
          },
          transaction,
        }
      );
    }
    console.log(`✓ Ingested ${tasksData.length} Audit & Compliance Tasks for ${ORG_NAME}`);

    await transaction.commit();
    console.log(`\n==================================================`);
    console.log(`🎉 SUCCESS: All mock & audit policy data for "${ORG_NAME}" ingested!`);
    console.log(`==================================================\n`);
  } catch (err) {
    await transaction.rollback();
    console.error(`❌ Ingestion failed:`, err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedABCBankData();
