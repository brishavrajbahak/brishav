export function createCommandRegistry(deps) {
  const helpLines = [
    'help              - List available commands',
    'clear             - Reset the terminal output',
    'version           - Show build and branch information',
    'whoami --deep     - Expanded candidate summary',
    'projects --detail - Detailed project impact notes',
    'mandala           - Render the Brishav signal map',
    'insights          - Jump to the Insight Logs section',
    'playground        - Open the demo analysis playground',
    'analyze <dataset> - Run a built-in dataset demo',
    'echo <text>       - Reflect a message back with a glitch hint',
    'github            - Open the GitHub profile',
    'contact           - Show direct contact channels',
  ];

  return {
    commandNames: ['help', 'clear', 'version', 'whoami', 'projects', 'mandala', 'insights', 'playground', 'analyze', 'echo', 'github', 'contact'],
    helpLines,
    execute(rawInput) {
      const input = rawInput.trim();
      if (!input) return { type: 'noop' };

      const [command, ...args] = input.split(/\s+/);
      const base = command.toLowerCase();
      const joinedArgs = args.join(' ');

      switch (base) {
        case 'help':
          return { type: 'text', lines: helpLines };
        case 'clear':
          return { type: 'clear' };
        case 'version':
          return {
            type: 'text',
            lines: [
              `Branch: ${deps.buildMeta.branch || 'unknown'}`,
              `Version: ${deps.buildMeta.version || 'advanced-v1'}`,
              `Built: ${deps.buildMeta.builtAt || 'unknown'}`,
            ],
          };
        case 'whoami':
          if (args.includes('--deep')) {
            return {
              type: 'text',
              lines: [
                'Brishav Rajbahak',
                'Signal: aspiring data analyst based in Kathmandu, Nepal.',
                'Focus: SQL, Python, Power BI, reporting, and insight delivery.',
                'Current arc: translating portfolio projects into business-facing analysis stories.',
              ],
            };
          }
          return { type: 'text', lines: ['Brishav Rajbahak | Data Analyst Aspirant | Kathmandu, Nepal.'] };
        case 'projects':
          if (args.includes('--detail')) {
            return {
              type: 'text',
              lines: [
                'Loan Default Analysis',
                '  Delivered: borrower segmentation, default-rate reporting, dashboard-ready outputs.',
                '  Business impact: surfaced the 19.98% final-outcome default rate and key repayment pressure patterns.',
                'Financial Inclusion Gap Analysis',
                '  Delivered: access-gap framing, reporting workflow, and underserved segment mapping.',
                '  Business impact: clarified where inclusion improvement should be prioritized first.',
              ],
            };
          }
          return {
            type: 'text',
            lines: [
              'Loan Default Analysis',
              'Financial Inclusion Gap Analysis',
              "Use 'projects --detail' for the impact layer.",
            ],
          };
        case 'mandala':
          return {
            type: 'mandala',
            lines: ['Rendering the Brishav signal map...'],
            focusIds: ['brishav', 'analytics', 'reporting', 'loan-risk'],
          };
        case 'insights':
          return {
            type: 'action',
            lines: ['Routing you to the field notes layer...'],
            action: () => deps.scrollToSection('insight-logs'),
          };
        case 'playground':
          return {
            type: 'action',
            lines: ['Opening the curated demo playground...'],
            action: () => deps.openPlayground(),
          };
        case 'analyze': {
          const dataset = normalizeDatasetId(joinedArgs);
          if (!dataset) {
            return { type: 'text', lines: ["Try: analyze tourism, analyze loan-risk, or analyze remittance."] };
          }

          return {
            type: 'action',
            lines: [`Queueing ${dataset} for a focused demo run...`],
            action: () => deps.openAndAnalyze(dataset),
          };
        }
        case 'echo':
          return { type: 'text', lines: [joinedArgs ? `echo:: ${joinedArgs}` : 'echo:: no payload supplied.'] };
        case 'github':
          return {
            type: 'action',
            lines: ['Opening github.com/brishavrajbahak ...'],
            action: () => window.open('https://github.com/brishavrajbahak', '_blank', 'noopener'),
          };
        case 'contact':
          return {
            type: 'text',
            lines: [
              'Email: contact@brishavrajbahak.com.np',
              'GitHub: github.com/brishavrajbahak',
              'LinkedIn: linkedin.com/in/brishav-rajbahak-854a30342',
            ],
          };
        default:
          return {
            type: 'text',
            lines: [`Command not found: ${base}. Type 'help' for available commands.`],
          };
      }
    },
  };
}

export function suggestCommands(input, commandNames) {
  const [command, ...rest] = input.trim().toLowerCase().split(/\s+/);
  if (command === 'analyze' && rest.length <= 1) {
    const target = rest[0] || '';
    return ['tourism', 'loan-risk', 'remittance'].filter(item => item.startsWith(target));
  }
  return commandNames.filter(item => item.startsWith(command));
}

function normalizeDatasetId(value) {
  const normalized = value.toLowerCase().trim();
  if (!normalized) return '';
  if (['tourism', 'travel'].includes(normalized)) return 'tourism';
  if (['loan-risk', 'loan', 'risk', 'loanrisk'].includes(normalized)) return 'loan-risk';
  if (['remittance', 'remit', 'transfer'].includes(normalized)) return 'remittance';
  return '';
}
