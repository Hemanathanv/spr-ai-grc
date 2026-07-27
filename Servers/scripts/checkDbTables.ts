import { sequelize } from "../database/db";

async function checkTables() {
  try {
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'verifywise'
      ORDER BY table_name;
    `);
    console.log("Verifywise Schema Tables:", (tables as any[]).map(t => t.table_name));

    const [riskCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'verifywise' AND table_name = 'risks';
    `);
    console.log("Risks columns:", riskCols);

    const [taskCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'verifywise' AND table_name = 'tasks';
    `);
    console.log("Tasks columns:", taskCols);

    const [evidCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'verifywise' AND table_name = 'file_uploads';
    `);
    console.log("FileUploads columns:", evidCols);

  } catch(err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

checkTables();
