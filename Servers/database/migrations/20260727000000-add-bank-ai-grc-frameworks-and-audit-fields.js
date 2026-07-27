'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`, { transaction });

      // 1. Add Working Paper & Audit Testing columns safely to controls/subcontrols tables if they exist
      const addColsScript = `
        DO $$
        DECLARE
            tbl TEXT;
            col TEXT;
            col_type TEXT;
            target_tables TEXT[] := ARRAY['controls', 'subcontrols', 'controls_struct_eu', 'subcontrols_struct_eu'];
            col_names TEXT[] := ARRAY['wp_ref', 'test_procedure', 'pass_fail_criteria', 'sample_size', 'control_nature', 'control_type', 'testing_periodicity', 'auditor_remarks'];
            col_types TEXT[] := ARRAY['VARCHAR(255)', 'TEXT', 'TEXT', 'TEXT', 'VARCHAR(50)', 'VARCHAR(50)', 'VARCHAR(100)', 'TEXT'];
        BEGIN
            FOREACH tbl IN ARRAY target_tables LOOP
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'verifywise' AND table_name = tbl
                ) THEN
                    FOR i IN 1..array_length(col_names, 1) LOOP
                        col := col_names[i];
                        col_type := col_types[i];
                        EXECUTE 'ALTER TABLE verifywise.' || tbl || ' ADD COLUMN IF NOT EXISTS ' || col || ' ' || col_type || ';';
                    END LOOP;
                END IF;
            END LOOP;
        END $$;
      `;

      await queryInterface.sequelize.query(addColsScript, { transaction });

      // 2. Insert Bank AI-GRC Framework records into frameworks table
      const bankFrameworks = [
        {
          name: 'RBI FREE-AI & ITGRC',
          description: 'RBI Master Direction on IT Governance, Risk, Controls (2023) and RBI FREE-AI Responsible AI Framework for Indian Banks.',
          is_organizational: true,
        },
        {
          name: 'CERT-In AI Guidelines',
          description: 'CERT-In AI Cybersecurity Audit Guidelines (v2.0, July 2025) and CERT-In Blueprint (CIGU-2026-0002) with mandatory AIBOM requirements.',
          is_organizational: true,
        },
        {
          name: 'SEBI CSCRF',
          description: 'SEBI Cyber Security and Cyber Resilience Framework for Financial Entities and AI/Cyber Systems.',
          is_organizational: true,
        },
        {
          name: 'DPDP Act 2023 & IT Act',
          description: 'Digital Personal Data Protection Act 2023 & IT Act 2000 Data Processing Compliance for Banking Data.',
          is_organizational: true,
        },
        {
          name: 'India AI Vision 2030',
          description: 'IndiaAI Mission Safe & Trusted AI Pillar and National AI Governance Guidelines (2025).',
          is_organizational: true,
        },
        {
          name: 'OWASP LLM Top 10 (2025)',
          description: 'OWASP Top 10 Security Vulnerabilities and Firewall Controls for Large Language Models (2025 Edition).',
          is_organizational: false,
        },
      ];

      for (const fw of bankFrameworks) {
        await queryInterface.sequelize.query(
          `INSERT INTO verifywise.frameworks (name, description, is_organizational, created_at, updated_at)
           VALUES (:name, :description, :is_organizational, NOW(), NOW())
           ON CONFLICT DO NOTHING;`,
          {
            replacements: {
              name: fw.name,
              description: fw.description,
              is_organizational: fw.is_organizational,
            },
            transaction,
          }
        );
      }

      await transaction.commit();
      console.log('✓ Migration 20260727000000-add-bank-ai-grc-frameworks-and-audit-fields executed successfully.');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`SET search_path TO verifywise, public;`, { transaction });

      const removeColsScript = `
        DO $$
        DECLARE
            tbl TEXT;
            col TEXT;
            target_tables TEXT[] := ARRAY['controls', 'subcontrols', 'controls_struct_eu', 'subcontrols_struct_eu'];
            col_names TEXT[] := ARRAY['wp_ref', 'test_procedure', 'pass_fail_criteria', 'sample_size', 'control_nature', 'control_type', 'testing_periodicity', 'auditor_remarks'];
        BEGIN
            FOREACH tbl IN ARRAY target_tables LOOP
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_schema = 'verifywise' AND table_name = tbl
                ) THEN
                    FOREACH col IN ARRAY col_names LOOP
                        EXECUTE 'ALTER TABLE verifywise.' || tbl || ' DROP COLUMN IF EXISTS ' || col || ';';
                    END LOOP;
                END IF;
            END LOOP;
        END $$;
      `;

      await queryInterface.sequelize.query(removeColsScript, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
