const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const SOURCE_DIR = 'austroads-power-pages';
const TARGET_DIRS = [
  'austroads-power-pages-verify2/datahub---datahub'
];

const MAPPING = {
  'home': 'home',
  'nevdis': 'nevdis',
  'tca': 'tca',
  'detail-aec': 'aec-data-provisioning',
  'detail-bitre': 'bitre-motor-vehicle-census',
  'detail-driver': 'driver-licences',
  'detail-ems': 'vehicle-enrolment-data-(ems)',
  'detail-gold': 'vehicles-gold-data',
  'detail-hpfr': 'high-productivity-freight-routes',
  'detail-natvin': 'national-vin-database',
  'detail-nz': 'new-zealand-—-tca',
  'detail-p2v': 'plate-to-vin-(p2v)',
  'detail-rav': 'enabling-rav',
  'detail-recall': 'safety-recalls',
  'detail-road-analytics': 'road-analytics-services',
  'detail-smart-obm': 'smart-obm-data-services',
  'detail-spatial': 'spatial-data-services-(iac---b2b)',
  'detail-spatiotemporal': 'spatiotemporal-data',
  'detail-stolen': 'stolen-&-write-off-restrictions',
  'detail-vehicles-reg': 'vehicles-&-registrations-data'
};

async function syncAndInline(targetBaseDir) {
  console.log(`--- Syncing and Inlining to ${targetBaseDir} ---`);
  
  // 1. Read source CSS and JS
  const cssContent = await fs.readFile(path.join(SOURCE_DIR, 'shared', 'austroads.css'), 'utf8');
  const homeJsContent = await fs.readFile(path.join(SOURCE_DIR, 'home', 'home.js'), 'utf8');
  const homeCssContent = await fs.readFile(path.join(SOURCE_DIR, 'home', 'home.css'), 'utf8');

  // 2. Update Layout Template (Inline CSS)
  const templatePath = path.join(targetBaseDir, 'web-templates', 'austroads-layout', 'Austroads-Layout.webtemplate.source.html');
  let templateContent = await fs.readFile(templatePath, 'utf8');
  const styleStart = templateContent.indexOf('<style>');
  const styleEnd = templateContent.indexOf('</style>', styleStart);
  if (styleStart !== -1 && styleEnd !== -1) {
    templateContent = templateContent.substring(0, styleStart + 7) + '\n' + cssContent + '\n' + templateContent.substring(styleEnd);
    await fs.writeFile(templatePath, templateContent);
    console.log('SUCCESS: Inlined Shared CSS.');
  }

  // 3. Update Home Page (Inline Home CSS/JS)
  const homePath = path.join(targetBaseDir, 'web-pages', 'home', 'Home.webpage.copy.html');
  let homeHtml = await fs.readFile(path.join(SOURCE_DIR, 'home', 'page-body.html'), 'utf8');
  // Add inline style and script tags
  homeHtml = `<style>\n${homeCssContent}\n</style>\n${homeHtml}\n<script>\n${homeJsContent}\n</script>`;
  await fs.writeFile(homePath, homeHtml);
  
  // Also write to content-pages folder
  const homePath2 = path.join(targetBaseDir, 'web-pages', 'home', 'content-pages', 'Home.en-US.webpage.copy.html');
  if (fsSync.existsSync(path.dirname(homePath2))) {
    await fs.writeFile(homePath2, homeHtml);
  }
  console.log('SUCCESS: Inlined Home CSS and JS.');

  // 4. Sync other pages (HTML only)
  for (const [srcFolder, targetFolder] of Object.entries(MAPPING)) {
    if (srcFolder === 'home') continue;
    const srcPath = path.join(SOURCE_DIR, srcFolder);
    const targetPath = path.join(targetBaseDir, 'web-pages', targetFolder);
    
    if (!fsSync.existsSync(srcPath) || !fsSync.existsSync(targetPath)) continue;

    const targetFiles = await fs.readdir(targetPath);
    const ymlFile = targetFiles.find(f => f.toLowerCase().endsWith('.webpage.yml'));
    if (!ymlFile) continue;
    const baseName = ymlFile.split('.')[0];

    const srcFiles = await fs.readdir(srcPath);
    const htmlFile = srcFiles.find(f => f.endsWith('.html'));
    if (htmlFile) {
      const content = await fs.readFile(path.join(srcPath, htmlFile), 'utf8');
      await fs.writeFile(path.join(targetPath, `${baseName}.webpage.copy.html`), content);
      const cpPath = path.join(targetPath, 'content-pages', `${baseName}.en-US.webpage.copy.html`);
      if (fsSync.existsSync(path.dirname(cpPath))) {
        await fs.writeFile(cpPath, content);
      }
    }
  }
}

async function main() {
  for (const targetDir of TARGET_DIRS) {
    await syncAndInline(targetDir);
  }
  console.log('\n--- Emergency Sync Complete ---');
}

main().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
