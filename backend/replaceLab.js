const fs = require('fs');
const path = require('path');

const files = [
  'backend/services/vetService.js',
  'backend/services/movementService.js',
  'backend/services/caseService.js',
  'backend/services/analyticsService.js',
  'backend/seeders/seedAdmin.js',
  'backend/routes/movementRoutes.js',
  'backend/routes/caseRoutes.js',
  'backend/routes/authRoutes.js',
  'backend/routes/analyticsRoutes.js',
  'frontend/src/features/users/pages/UserManagement.jsx',
  'frontend/src/components/ui/FilterDropdown.jsx',
  'frontend/src/pages/Landing.jsx',
  'frontend/src/components/layout/DashboardLayout.jsx'
];

const basePath = 'C:\\Users\\PC\\.gemini\\antigravity-ide\\scratch\\LivestockTrackingSystem';

files.forEach(file => {
  const fullPath = path.join(basePath, file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/'LAB'/g, "'RAB'");
    content = content.replace(/\bLAB\b/g, "RAB");
    content = content.replace(/admin@lab\.gov\.rw/g, "admin@rab.gov.rw");
    content = content.replace(/LabAdmin/g, "RabAdmin");
    content = content.replace(/john@lab\.gov\.rw/g, "john@rab.gov.rw");
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Updated ' + file);
  }
});

const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(basePath, 'backend', 'database.sqlite'),
  logging: false
});

async function updateDb() {
  await sequelize.query("UPDATE Users SET role = 'RAB', name = 'Super Admin (RAB)', email = 'admin@rab.gov.rw' WHERE role = 'LAB'");
  console.log("DB updated");
}
updateDb();
