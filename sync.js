const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const SOURCE_DIR = 'austroads-power-pages';
const TARGET_DIRS = [
  'austroads-power-pages-verify2/datahub---datahub',
  'austroads-power-pages-poc/datahub---datahub'
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

async function syncSharedCss(targetBaseDir) {
  console.log(`--- Syncing Shared CSS to ${targetBaseDir} ---`);
  const cssPath = path.join(SOURCE_DIR, 'shared', 'austroads.css');
  const templatePath = path.join(targetBaseDir, 'web-templates', 'austroads-layout', 'Austroads-Layout.webtemplate.source.html');

  if (!fsSync.existsSync(cssPath)) {
    console.error(`Source CSS not found: ${cssPath}`);
    return;
  }
  if (!fsSync.existsSync(templatePath)) {
    console.error(`Target template not found: ${templatePath}`);
    return;
  }

  const cssContent = await fs.readFile(cssPath, 'utf8');
  let templateContent = await fs.readFile(templatePath, 'utf8');

  const styleStart = templateContent.indexOf('<style>');
  const styleEnd = templateContent.indexOf('</style>', styleStart);

  if (styleStart !== -1 && styleEnd !== -1) {
    const newContent = templateContent.substring(0, styleStart + 7) + 
                       '\n' + cssContent + '\n' + 
                       templateContent.substring(styleEnd);
    await fs.writeFile(templatePath, newContent);
    console.log('SUCCESS: Injected austroads.css into web template.');
  } else {
    console.error('ERROR: Could not find <style> block in web template.');
  }
}

async function syncPages(targetBaseDir) {
  console.log(`--- Syncing Pages to ${targetBaseDir} ---`);
  await Promise.all(Object.entries(MAPPING).map(async ([srcFolder, targetFolder]) => {
    const srcPath = path.join(SOURCE_DIR, srcFolder);
    const targetPath = path.join(targetBaseDir, 'web-pages', targetFolder);

    if (!fsSync.existsSync(srcPath)) {
      console.warn(`SKIP: Source folder not found: ${srcPath}`);
      return;
    }
    if (!fsSync.existsSync(targetPath)) {
      console.warn(`SKIP: Target folder not found: ${targetPath}`);
      return;
    }

    const targetFiles = await fs.readdir(targetPath);
    // Find the .webpage.yml file case-insensitively
    const ymlFile = targetFiles.find(f => f.toLowerCase().endsWith('.webpage.yml'));
    
    if (!ymlFile) {
      console.warn(`SKIP: No .webpage.yml found in ${targetPath}`);
      return;
    }
    
    // Split by dots and take the first part as baseName (e.g., "Home.webpage.yml" -> "Home")
    const baseName = ymlFile.split('.')[0];
    
    console.log(`Processing: ${srcFolder} -> ${targetFolder} (BaseName: ${baseName})`);

    const srcFiles = await fs.readdir(srcPath);
    
    // Sync HTML
    const htmlFile = srcFiles.find(f => f.endsWith('.html'));
    if (htmlFile) {
      const content = await fs.readFile(path.join(srcPath, htmlFile), 'utf8');
      const targetHtml1 = path.join(targetPath, `${baseName}.webpage.copy.html`);
      const targetHtml2 = path.join(targetPath, 'content-pages', `${baseName}.en-US.webpage.copy.html`);
      
      console.log(`  Writing HTML to: ${targetHtml1}`);
      await fs.writeFile(targetHtml1, content);
      
      if (fsSync.existsSync(path.dirname(targetHtml2))) {
        console.log(`  Writing HTML to: ${targetHtml2}`);
        await fs.writeFile(targetHtml2, content);
      }
    }

    // Sync CSS
    const cssFile = srcFiles.find(f => f.endsWith('.css'));
    if (cssFile) {
      const content = await fs.readFile(path.join(srcPath, cssFile), 'utf8');
      const targetCss1 = path.join(targetPath, `${baseName}.webpage.custom_css.css`);
      const targetCss2 = path.join(targetPath, 'content-pages', `${baseName}.en-US.webpage.custom_css.css`);
      
      console.log(`  Writing CSS to: ${targetCss1}`);
      await fs.writeFile(targetCss1, content);
      
      if (fsSync.existsSync(path.dirname(targetCss2))) {
        console.log(`  Writing CSS to: ${targetCss2}`);
        await fs.writeFile(targetCss2, content);
      }
    }

    // Sync JS
    const jsFile = srcFiles.find(f => f.endsWith('.js'));
    if (jsFile) {
      const content = await fs.readFile(path.join(srcPath, jsFile), 'utf8');
      const targetJs1 = path.join(targetPath, `${baseName}.webpage.custom_javascript.js`);
      const targetJs2 = path.join(targetPath, 'content-pages', `${baseName}.en-US.webpage.custom_javascript.js`);
      
      console.log(`  Writing JS to: ${targetJs1}`);
      await fs.writeFile(targetJs1, content);
      
      if (fsSync.existsSync(path.dirname(targetJs2))) {
        console.log(`  Writing JS to: ${targetJs2}`);
        await fs.writeFile(targetJs2, content);
      }
    }
  }));
}

async function main() {
  for (const targetDir of TARGET_DIRS) {
    await syncSharedCss(targetDir);
    await syncPages(targetDir);
  }
  console.log('\n--- Sync Complete for all targets ---');
}

if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error during sync:', err);
    process.exit(1);
  });
}

module.exports = {
  syncSharedCss,
  syncPages
};
