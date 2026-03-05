const fs = require('fs');
const path = require('path');

const SOURCE_DIR = 'austroads-power-pages';
const TARGET_BASE_DIR = 'austroads-power-pages-verify2/datahub---datahub';

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

function syncSharedCss() {
  console.log('Syncing shared CSS...');
  const cssPath = path.join(SOURCE_DIR, 'shared', 'austroads.css');
  const templatePath = path.join(TARGET_BASE_DIR, 'web-templates', 'austroads-layout', 'Austroads-Layout.webtemplate.source.html');

  if (!fs.existsSync(cssPath)) {
    console.error(`Source CSS not found: ${cssPath}`);
    return;
  }
  if (!fs.existsSync(templatePath)) {
    console.error(`Target template not found: ${templatePath}`);
    return;
  }

  const cssContent = fs.readFileSync(cssPath, 'utf8');
  let templateContent = fs.readFileSync(templatePath, 'utf8');

  // Replace content between <style> and </style> (first occurrence)
  const styleStart = templateContent.indexOf('<style>');
  const styleEnd = templateContent.indexOf('</style>', styleStart);

  if (styleStart !== -1 && styleEnd !== -1) {
    const newContent = templateContent.substring(0, styleStart + 7) + 
                       '\n' + cssContent + '\n' + 
                       templateContent.substring(styleEnd);
    fs.writeFileSync(templatePath, newContent);
    console.log('Successfully injected shared CSS into web template.');
  } else {
    console.error('Could not find <style> block in web template.');
  }
}

function syncPages() {
  console.log('Syncing pages...');
  for (const [srcFolder, targetFolder] of Object.entries(MAPPING)) {
    const srcPath = path.join(SOURCE_DIR, srcFolder);
    const targetPath = path.join(TARGET_BASE_DIR, 'web-pages', targetFolder);

    if (!fs.existsSync(srcPath)) {
      console.warn(`Source folder not found: ${srcPath}`);
      continue;
    }
    if (!fs.existsSync(targetPath)) {
      console.warn(`Target folder not found: ${targetPath}`);
      continue;
    }

    // Find the base filename in target folder (e.g., "Home" in "home" folder)
    const targetFiles = fs.readdirSync(targetPath);
    const ymlFile = targetFiles.find(f => f.endsWith('.webpage.yml'));
    if (!ymlFile) {
      console.warn(`No .webpage.yml found in ${targetPath}`);
      continue;
    }
    const baseName = ymlFile.replace('.webpage.yml', '');

    // Source files
    const srcFiles = fs.readdirSync(srcPath);
    
    // Sync HTML (could be index.html or page-body.html)
    const htmlFile = srcFiles.find(f => f.endsWith('.html'));
    if (htmlFile) {
      const content = fs.readFileSync(path.join(srcPath, htmlFile), 'utf8');
      const targetHtml1 = path.join(targetPath, `${baseName}.webpage.copy.html`);
      const targetHtml2 = path.join(targetPath, 'content-pages', `${baseName}.en-US.webpage.copy.html`);
      
      fs.writeFileSync(targetHtml1, content);
      if (fs.existsSync(path.dirname(targetHtml2))) {
        fs.writeFileSync(targetHtml2, content);
      }
      console.log(`  Synced HTML for ${targetFolder}`);
    }

    // Sync CSS
    const cssFile = srcFiles.find(f => f.endsWith('.css'));
    if (cssFile) {
      const content = fs.readFileSync(path.join(srcPath, cssFile), 'utf8');
      const targetCss1 = path.join(targetPath, `${baseName}.webpage.custom_css.css`);
      const targetCss2 = path.join(targetPath, 'content-pages', `${baseName}.en-US.webpage.custom_css.css`);
      
      fs.writeFileSync(targetCss1, content);
      if (fs.existsSync(path.dirname(targetCss2))) {
        fs.writeFileSync(targetCss2, content);
      }
      console.log(`  Synced CSS for ${targetFolder}`);
    }

    // Sync JS
    const jsFile = srcFiles.find(f => f.endsWith('.js'));
    if (jsFile) {
      const content = fs.readFileSync(path.join(srcPath, jsFile), 'utf8');
      const targetJs1 = path.join(targetPath, `${baseName}.webpage.custom_javascript.js`);
      const targetJs2 = path.join(targetPath, 'content-pages', `${baseName}.en-US.webpage.custom_javascript.js`);
      
      fs.writeFileSync(targetJs1, content);
      if (fs.existsSync(path.dirname(targetJs2))) {
        fs.writeFileSync(targetJs2, content);
      }
      console.log(`  Synced JS for ${targetFolder}`);
    }
  }
}

syncSharedCss();
syncPages();
console.log('Sync complete!');
