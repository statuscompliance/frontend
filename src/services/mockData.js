export const datasourceTypes = [
  {
    id: 'microsoft-graph',
    name: 'Microsoft Graph',
    description: 'Connect to Microsoft Graph API for accessing Office 365, Azure AD, and other Microsoft services',
    icon: 'microsoft',
    category: 'cloud',
    authType: 'oauth2',
    authFields: [
      { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'scopes', label: 'Scopes', type: 'array', default: ['https://graph.microsoft.com/.default'] }
    ],
    configFields: [
      { name: 'endpoint', label: 'API Endpoint', type: 'text', default: 'https://graph.microsoft.com/v1.0' }
    ],
    complianceStandards: ['GDPR', 'ISO 27001', 'SOC 2']
  },
  {
    id: 'github-api',
    name: 'GitHub API',
    description: 'Access GitHub repositories, issues, and other data',
    icon: 'github',
    category: 'devops',
    authType: 'token',
    authFields: [
      { name: 'personalAccessToken', label: 'Personal Access Token', type: 'password', required: true }
    ],
    configFields: [
      { name: 'defaultOrg', label: 'Default Organization', type: 'text', required: false },
      { name: 'defaultRepo', label: 'Default Repository', type: 'text', required: false },
      { name: 'apiVersion', label: 'API Version', type: 'select', options: ['v3', 'v4'], default: 'v3' }
    ],
    complianceStandards: ['GDPR', 'ISO 27001']
  },
  {
    id: 'azure-security-center',
    name: 'Azure Security Center',
    description: 'Monitor security posture and compliance across Azure resources',
    icon: 'azure',
    category: 'security',
    authType: 'oauth2',
    authFields: [
      { name: 'tenantId', label: 'Tenant ID', type: 'text', required: true },
      { name: 'clientId', label: 'Client ID', type: 'text', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
      { name: 'subscriptionId', label: 'Subscription ID', type: 'text', required: true }
    ],
    configFields: [
      { name: 'endpoint', label: 'API Endpoint', type: 'text', default: 'https://management.azure.com' }
    ],
    complianceStandards: ['ISO 27001', 'NIST 800-53', 'PCI DSS']
  },
  {
    id: 'aws-security-hub',
    name: 'AWS Security Hub',
    description: 'Centralized view of security alerts and compliance status across AWS accounts',
    icon: 'aws',
    category: 'security',
    authType: 'key',
    authFields: [
      { name: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { name: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
      { name: 'region', label: 'Region', type: 'text', required: true }
    ],
    configFields: [
      { name: 'includeFindingTypes', label: 'Finding Types', type: 'multiselect', options: ['Software and Configuration Checks', 'TTPs', 'Effects'], default: ['Software and Configuration Checks'] }
    ],
    complianceStandards: ['GDPR', 'ISO 27001', 'HIPAA', 'PCI DSS']
  },
  {
    id: 'gdpr-assessment-tool',
    name: 'GDPR Assessment Tool',
    description: 'Tool for assessing GDPR compliance status and generating reports',
    icon: 'shield',
    category: 'compliance',
    authType: 'basic',
    authFields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true }
    ],
    configFields: [
      { name: 'baseUrl', label: 'API Base URL', type: 'text', required: true },
      { name: 'assessmentFrequency', label: 'Assessment Frequency', type: 'select', options: ['weekly', 'monthly', 'quarterly'], default: 'monthly' }
    ],
    complianceStandards: ['GDPR']
  },
  {
    id: 'iso27001-tracker',
    name: 'ISO 27001 Tracker',
    description: 'Track and manage ISO 27001 compliance requirements',
    icon: 'compliance',
    category: 'compliance',
    authType: 'apikey',
    authFields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true }
    ],
    configFields: [
      { name: 'endpoint', label: 'API Endpoint', type: 'text', required: true },
      { name: 'includeControls', label: 'Include Controls', type: 'multiselect', options: ['A.5', 'A.6', 'A.7', 'A.8', 'A.9', 'A.10', 'A.11', 'A.12', 'A.13', 'A.14', 'A.15', 'A.16', 'A.17', 'A.18'], default: ['A.5', 'A.6', 'A.7'] }
    ],
    complianceStandards: ['ISO 27001']
  }
];

export const mockDatasources = [
  {
    id: '1',
    name: 'Corporate Microsoft Graph',
    type: 'microsoft-graph',
    description: 'Microsoft Graph connection for corporate Office 365 data',
    createdAt: '2023-01-15T10:30:00Z',
    updatedAt: '2023-06-20T14:45:00Z',
    status: 'active',
    configuration: {
      tenantId: 'corporate-tenant-id',
      clientId: 'graph-client-id',
      endpoint: 'https://graph.microsoft.com/v1.0'
    },
    lastSyncTime: '2023-06-20T14:45:00Z',
    connectionStatus: 'connected'
  },
  {
    id: '2',
    name: 'Development GitHub',
    type: 'github-api',
    description: 'GitHub API connection for our development repositories',
    createdAt: '2023-02-10T09:15:00Z',
    updatedAt: '2023-06-15T11:20:00Z',
    status: 'active',
    configuration: {
      defaultOrg: 'our-organization',
      defaultRepo: '',
      apiVersion: 'v3'
    },
    lastSyncTime: '2023-06-15T11:20:00Z',
    connectionStatus: 'connected'
  },
  {
    id: '3',
    name: 'Cloud Security Hub',
    type: 'azure-security-center',
    description: 'Azure Security Center connection for monitoring cloud security compliance',
    createdAt: '2023-03-05T14:20:00Z',
    updatedAt: '2023-06-18T08:30:00Z',
    status: 'active',
    configuration: {
      tenantId: 'security-tenant-id',
      subscriptionId: 'subscription-id-1',
      endpoint: 'https://management.azure.com'
    },
    lastSyncTime: '2023-06-18T08:30:00Z',
    connectionStatus: 'connected'
  },
  {
    id: '4',
    name: 'AWS Compliance Monitor',
    type: 'aws-security-hub',
    description: 'AWS Security Hub for compliance monitoring in our cloud infrastructure',
    createdAt: '2023-04-12T16:45:00Z',
    updatedAt: '2023-06-16T13:10:00Z',
    status: 'inactive',
    configuration: {
      region: 'eu-west-1',
      includeFindingTypes: ['Software and Configuration Checks', 'TTPs']
    },
    lastSyncTime: '2023-06-10T09:15:00Z',
    connectionStatus: 'error'
  },
  {
    id: '5',
    name: 'GDPR Assessment Tool',
    type: 'gdpr-assessment-tool',
    description: 'Tool for tracking and documenting GDPR compliance',
    createdAt: '2023-03-15T11:30:00Z',
    updatedAt: '2023-06-14T10:25:00Z',
    status: 'active',
    configuration: {
      baseUrl: 'https://gdpr-assessment.example.com/api',
      assessmentFrequency: 'monthly'
    },
    lastSyncTime: '2023-06-14T10:25:00Z',
    connectionStatus: 'connected'
  },
  {
    id: '6',
    name: 'ISO 27001 Compliance Tracker',
    type: 'iso27001-tracker',
    description: 'ISO 27001 compliance tracking and documentation system',
    createdAt: '2023-02-28T09:45:00Z',
    updatedAt: '2023-06-19T15:50:00Z',
    status: 'active',
    configuration: {
      endpoint: 'https://iso27001-tracker.example.com/api/v1',
      includeControls: ['A.5', 'A.6', 'A.7', 'A.8', 'A.9']
    },
    lastSyncTime: '2023-06-19T15:50:00Z',
    connectionStatus: 'connected'
  }
];

export const mockLinkers = [
  {
    id: '1',
    name: 'SharePoint Linker',
    description: 'Links data sources for GDPR compliance monitoring',
    createdAt: '2023-03-20T13:45:00Z',
    updatedAt: '2023-06-15T10:30:00Z',
    status: 'active',
    datasources: ['1', '5'],
    config: {
      refreshInterval: 'daily',
      notifyOnChange: true,
      mappings: [
        {
          source: 'microsoft-graph',
          target: 'gdpr-assessment-tool',
          fieldMappings: [
            { sourceField: 'users', targetField: 'dataSubjects' },
            { sourceField: 'groups', targetField: 'dataCategories' }
          ]
        }
      ]
    }
  },
  {
    id: '2',
    name: 'GLPI Linker',
    description: 'Links GitHub with security monitoring tools',
    createdAt: '2023-04-05T09:20:00Z',
    updatedAt: '2023-06-18T14:15:00Z',
    status: 'active',
    datasources: ['2', '3', '4'],
    config: {
      refreshInterval: 'hourly',
      notifyOnChange: true,
      mappings: [
        {
          source: 'github-api',
          target: 'azure-security-center',
          fieldMappings: [
            { sourceField: 'repositories', targetField: 'resources' },
            { sourceField: 'securityAlerts', targetField: 'recommendations' }
          ]
        },
        {
          source: 'github-api',
          target: 'aws-security-hub',
          fieldMappings: [
            { sourceField: 'repositories', targetField: 'resources' },
            { sourceField: 'securityAlerts', targetField: 'findings' }
          ]
        }
      ]
    }
  },
  {
    id: '3',
    name: 'Odoo Linker',
    description: 'Links cloud security tools with ISO 27001 tracker',
    createdAt: '2023-03-10T11:30:00Z',
    updatedAt: '2023-06-10T16:45:00Z',
    status: 'inactive',
    datasources: ['3', '4', '6'],
    config: {
      refreshInterval: 'daily',
      notifyOnChange: false,
      mappings: [
        {
          source: 'azure-security-center',
          target: 'iso27001-tracker',
          fieldMappings: [
            { sourceField: 'securityControls', targetField: 'controls' },
            { sourceField: 'complianceState', targetField: 'implementationStatus' }
          ]
        },
        {
          source: 'aws-security-hub',
          target: 'iso27001-tracker',
          fieldMappings: [
            { sourceField: 'securityControls', targetField: 'controls' },
            { sourceField: 'findings', targetField: 'issues' }
          ]
        }
      ]
    }
  }
];
