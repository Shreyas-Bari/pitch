import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- RUNNING STAGE 6 VERIFICATION CHECKS ---');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✔ ${message}`);
}

// 1. Verify Admin Components exist
const adminComponents = [
  'StatsCard.jsx',
  'UserTable.jsx',
  'CompanyTable.jsx',
  'CommitteeTable.jsx',
  'EventTable.jsx',
  'DealTable.jsx',
  'ReportTable.jsx',
  'AuditLogTable.jsx',
  'AnalyticsChart.jsx',
];

for (const comp of adminComponents) {
  const p = path.join(__dirname, 'src', 'components', 'admin', comp);
  assert(fs.existsSync(p), `Admin component ${comp} exists`);
}

// 2. Verify Admin Layout exists
const adminLayoutPath = path.join(__dirname, 'src', 'layouts', 'AdminLayout.jsx');
assert(fs.existsSync(adminLayoutPath), 'AdminLayout.jsx exists');
const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
const expectedNavPaths = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/companies',
  '/admin/committees',
  '/admin/events',
  '/admin/deals',
  '/admin/reports',
  '/admin/analytics',
];
for (const navPath of expectedNavPaths) {
  assert(adminLayoutContent.includes(navPath), `AdminLayout contains link to ${navPath}`);
}

// 3. Verify Admin Pages exist and are NOT placeholders
const adminPages = [
  'Dashboard.jsx',
  'Users.jsx',
  'Companies.jsx',
  'Committees.jsx',
  'Events.jsx',
  'Deals.jsx',
  'Reports.jsx',
  'Analytics.jsx',
];

for (const page of adminPages) {
  const p = path.join(__dirname, 'src', 'pages', 'admin', page);
  assert(fs.existsSync(p), `Admin page ${page} exists`);
  const content = fs.readFileSync(p, 'utf8');
  assert(!content.includes('StagePlaceholder'), `Admin page ${page} is not a placeholder`);
  assert(content.length > 200, `Admin page ${page} has functional implementation`);
}

// 4. Verify Route Registration and Guards in AppRoutes.jsx
const appRoutesPath = path.join(__dirname, 'src', 'routes', 'AppRoutes.jsx');
const appRoutesContent = fs.readFileSync(appRoutesPath, 'utf8');
for (const navPath of expectedNavPaths) {
  assert(appRoutesContent.includes(`path="${navPath}"`), `Route ${navPath} is registered in AppRoutes.jsx`);
}
assert(
  appRoutesContent.includes('allowedRoles={[ROLES.ADMIN]}'),
  'Admin routes are protected with allowedRoles={[ROLES.ADMIN]}'
);

// 5. Verify Constants: Authoritative ADMIN role and NO unauthorized roles
const constantsPath = path.join(__dirname, 'src', 'utils', 'constants.js');
const constantsContent = fs.readFileSync(constantsPath, 'utf8');
assert(constantsContent.includes("ADMIN: 'ADMIN'"), 'ROLES includes ADMIN');

const unauthorizedRoles = ['SUPER_ADMIN', 'MODERATOR', 'STAFF', 'MANAGER', 'VERIFIER'];
for (const role of unauthorizedRoles) {
  assert(!constantsContent.includes(`${role}:`), `No unauthorized role ${role} introduced`);
}

// 6. Verify RESOLVED is NOT in DEAL_STATUS
const dealStatusBlockMatch = constantsContent.match(/export const DEAL_STATUS = {([^}]+)}/s);
assert(dealStatusBlockMatch, 'DEAL_STATUS is defined');
assert(!dealStatusBlockMatch[1].includes('RESOLVED'), 'RESOLVED is NOT in DEAL_STATUS (per specification)');

// 7. Verify adminService exists with required API operations
const adminServicePath = path.join(__dirname, 'src', 'services', 'adminService.js');
assert(fs.existsSync(adminServicePath), 'adminService.js exists');
const adminServiceContent = fs.readFileSync(adminServicePath, 'utf8');
const expectedAdminMethods = [
  'getUsers',
  'updateUserStatus',
  'getEvents',
  'updateEventStatus',
  'getDeals',
  'getReports',
  'getAnalyticsOverview',
  'getAnalyticsEvents',
  'getAnalyticsDeals',
  'getAnalyticsUsers',
  'getAuditLogs',
];
for (const method of expectedAdminMethods) {
  assert(adminServiceContent.includes(method), `adminService implements ${method}`);
}

console.log('============================================');
console.log('ALL STAGE 6 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
console.log('============================================');
