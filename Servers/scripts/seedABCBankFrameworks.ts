import { sequelize } from "../database/db";
import { addFrameworkToProjectQuery } from "../utils/framework.utils";

const ORG_NAME = "ABCBank-Test";

async function seedABCBankFrameworks() {
  console.log(`Starting Framework linkage for ${ORG_NAME}...`);

  const transaction = await sequelize.transaction();

  try {
    await sequelize.query(`SET search_path TO verifywise, public;`, { transaction });

    // 1. Get organization ID
    const [orgRows] = await sequelize.query(
      `SELECT id FROM verifywise.organizations WHERE name = :name LIMIT 1`,
      { replacements: { name: ORG_NAME }, transaction }
    );
    if (!(orgRows as any[]).length) {
      throw new Error(`Organization ${ORG_NAME} not found`);
    }
    const orgId = (orgRows as any[])[0].id;
    console.log(`✓ Found organization ID: ${orgId}`);

    // Get admin user ID
    const [userRows] = await sequelize.query(
      `SELECT id FROM verifywise.users WHERE organization_id = :orgId LIMIT 1`,
      { replacements: { orgId }, transaction }
    );
    const userId = (userRows as any[])[0]?.id || 1;

    // 2. Ensure an Organizational Project exists (is_organizational = true)
    const [existingOrgProj] = await sequelize.query(
      `SELECT id FROM verifywise.projects WHERE organization_id = :orgId AND is_organizational = true LIMIT 1`,
      { replacements: { orgId }, transaction }
    );

    let orgProjectId: number;
    if ((existingOrgProj as any[]).length > 0) {
      orgProjectId = (existingOrgProj as any[])[0].id;
      console.log(`✓ Existing Organizational Project ID: ${orgProjectId}`);
    } else {
      const [newOrgProj] = await sequelize.query(
        `INSERT INTO verifywise.projects (
           organization_id, uc_id, project_title, owner, start_date, ai_risk_classification,
           goal, target_industry, status, is_demo, is_organizational, created_at, last_updated
         )
         VALUES (
           :orgId, 'UC-ORG-001', 'ABCBank-Test Enterprise Compliance & Governance', :userId, NOW(), 'General Risk'::enum_projects_ai_risk_classification,
           'Organization-wide AI Management System, Information Security, and NIST AI RMF governance.', 'Banking & Financial Services', 'In progress'::projects_status_enum, false, true, NOW(), NOW()
         )
         RETURNING id`,
        {
          replacements: { orgId, userId },
          transaction,
        }
      );
      orgProjectId = (newOrgProj as any[])[0].id;
      console.log(`✓ Created Organizational Project ID: ${orgProjectId}`);
    }

    // 3. Get all Use Case projects (is_organizational = false)
    const [useCaseProjs] = await sequelize.query(
      `SELECT id, project_title FROM verifywise.projects WHERE organization_id = :orgId AND (is_organizational = false OR is_organizational IS NULL)`,
      { replacements: { orgId }, transaction }
    );

    console.log(`Found ${(useCaseProjs as any[]).length} Use Case projects for EU AI Act linkage.`);

    // 4. Link Framework 1 (EU AI Act) to Use Case projects
    for (const proj of useCaseProjs as any[]) {
      console.log(`  Adding EU AI Act (ID: 1) to Use Case project #${proj.id} (${proj.project_title})...`);
      const added = await addFrameworkToProjectQuery(1, proj.id, orgId, transaction);
      if (added) {
        console.log(`  ✓ EU AI Act successfully linked to project #${proj.id}`);
      } else {
        console.log(`  ℹ EU AI Act already linked or skipped for project #${proj.id}`);
      }
    }

    // 5. Link Organizational Frameworks (ISO 42001 = 2, ISO 27001 = 3, NIST AI RMF = 4) to Organizational Project
    const orgFrameworkIds = [2, 3, 4];
    for (const fwId of orgFrameworkIds) {
      console.log(`  Adding Organizational Framework ID: ${fwId} to Organizational Project #${orgProjectId}...`);
      const added = await addFrameworkToProjectQuery(fwId, orgProjectId, orgId, transaction);
      if (added) {
        console.log(`  ✓ Framework #${fwId} successfully linked to Organizational Project #${orgProjectId}`);
      } else {
        console.log(`  ℹ Framework #${fwId} already linked or skipped for project #${orgProjectId}`);
      }
    }

    await transaction.commit();
    console.log(`\n==================================================`);
    console.log(`🎉 SUCCESS: All compliance frameworks linked to ABCBank-Test!`);
    console.log(`==================================================\n`);
  } catch (err) {
    await transaction.rollback();
    console.error(`❌ Framework linkage failed:`, err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedABCBankFrameworks();
