import { getDashboardDataQuery } from "../utils/dashboard.utils";

async function run() {
  try {
    const data = await getDashboardDataQuery(13, 1, "admin");
    console.log("TASK RADAR BACKEND METRICS:", data?.task_radar);
  } catch(e) {
    console.error(e);
  }
}

run();
