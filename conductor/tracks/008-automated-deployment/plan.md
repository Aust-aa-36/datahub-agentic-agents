# Track Plan — Automated Deployment (Power Platform Actions)

This track focuses on setting up a robust CI/CD pipeline using the official Power Platform GitHub Actions to automate the deployment of the Data Hub portal.

## Project Summary
- **Owner**: Aaron
- **Framework**: GitHub Actions / Power Platform Actions
- **Goal**: Eliminate local PAC CLI dependency and automate deployments.
- **Status**: Active

## Tasks List

### 1. Azure & Power Platform Setup
- [ ] **Verify Service Principal (SPN)**: Ensure the Azure App Registration has the `System Administrator` role in the Power Platform environment.
- [ ] **GitHub Secrets**: Add the following secrets to the repository:
  - `CLIENT_ID`: Azure App Client ID.
  - `TENANT_ID`: Azure AD Tenant ID.
  - `CLIENT_SECRET`: Azure App Client Secret.
  - `ENVIRONMENT_URL`: `https://org5223164a.crm6.dynamics.com/`

### 2. Workflow Implementation
- [x] **Create Production Workflow**: Define `.github/workflows/power-pages-deploy.yml` using `microsoft/powerplatform-actions`.
- [x] **Integrate Sync Script**: Ensure `node sync.js` runs before the upload step.
- [x] **Add Model Version**: Explicitly set `--modelVersion 2` in the upload action.

### 3. Validation
- [ ] **Retest Deployment**: Trigger the workflow via a small commit and monitor the GitHub Actions logs.
- [ ] **Verify Live Site**: Confirm changes are reflected on the Power Pages site.

## Implementation Details

### Workflow Template
```yaml
name: Power Pages Deploy
on:
  push:
    branches: [ master ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
      - run: node sync.js
      - name: Upload to Power Pages
        uses: microsoft/powerplatform-actions/upload-paportal@v1
        with:
          environment-url: ${{ secrets.ENVIRONMENT_URL }}
          app-id: ${{ secrets.CLIENT_ID }}
          client-secret: ${{ secrets.CLIENT_SECRET }}
          tenant-id: ${{ secrets.TENANT_ID }}
          upload-path: 'austroads-power-pages-verify2/datahub---datahub'
          model-version: 2
```

## Key Files
- `.github/workflows/power-pages-deploy.yml`
- `sync.js`
- `package.json`
