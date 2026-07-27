import { sequelize } from "../database/db";

async function checkLlmEvalsTables() {
  try {
    const [rows] = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'verifywise' AND table_name LIKE 'llm_evals_%';`
    );
    console.log("LLM EVALS TABLES IN POSTGRES:", (rows as any[]).map((r) => r.table_name));
  } catch (err) {
    console.error("Error checking tables:", err);
  } finally {
    await sequelize.close();
  }
}

checkLlmEvalsTables();
