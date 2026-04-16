import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

const checks = [
  {
    name: 'Login has Startseite back link',
    file: 'src/app/login/page.tsx',
    patterns: [/href=\"\/\"/, /Zur\u00fcck zur Startseite/],
  },
  {
    name: 'Register has Startseite back link',
    file: 'src/app/register/page.tsx',
    patterns: [/href=\"\/\"/, /Zur\u00fcck zur Startseite/],
  },
  {
    name: 'Dashboard news cards link to detail page',
    file: 'src/app/page.tsx',
    patterns: [/href=\{`\/news\/\$\{item\.id\}`\}/, /Zum Beitrag/],
  },
  {
    name: 'Countdown keeps themed highlight styles',
    file: 'src/components/dashboard/Countdown.tsx',
    patterns: [/bg-primary\/10/, /text-primary\/80/, /bg-card border-border/],
  },
  {
    name: 'Register keeps 5-step flow and validation gate',
    file: 'src/app/register/page.tsx',
    patterns: [/useState<1 \| 2 \| 3 \| 4 \| 5>\(1\)/, /validateCurrentStep\(/, /if \(!validateCurrentStep\(\)\)/],
  },
  {
    name: 'Dashboard keeps expense-driven funding goal logic',
    file: 'src/app/page.tsx',
    patterns: [
      /const \[expenseGoal, setExpenseGoal\]/,
      /(?:todo|t)\.status !== 'done'/,
      /goal=\{settings\?\.funding_goal (?:\|\||\?\?|\?\?) 10000\}/,
    ],
  },
  {
    name: 'Dashboard persists expected ticket sales',
    file: 'src/app/page.tsx',
    patterns: [/expected_ticket_sales/, /onTicketSalesChange=\{canEditTicketSales \? handleTicketSalesChange : undefined\}/],
  },
  {
    name: 'Funding status keeps ticket price estimator controls',
    file: 'src/components/dashboard/FundingStatus.tsx',
    patterns: [/initialTicketSales\?/, /onTicketSalesChange\?/, /Geschätzter Ticketpreis/, /remaining \/ ticketSales/],
  },
  {
    name: 'Poll creation keeps vote-change control',
    file: 'src/components/modals/AddPollDialog.tsx',
    patterns: [/allowVoteChange/, /allow_vote_change: allowVoteChange/, /allow-vote-change/],
  },
  {
    name: 'Poll voting refresh and feedback stays active',
    file: 'src/components/dashboard/PollList.tsx',
    patterns: [/refreshVotesForPoll/, /toast\.success\('Deine Stimme wurde gespeichert\.'/, /toast\.error\('Abstimmung fehlgeschlagen/],
  },
  {
    name: 'Finance page keeps goal logic',
    file: 'src/app/finanzen/page.tsx',
    patterns: [/const fundingGoal =/, /current=\{currentBalance\}/, /goal=\{fundingGoal\}/],
  },
  {
    name: 'Dashboard uses dynamic sorting',
    file: 'src/app/page.tsx',
    patterns: [/useDashboardSorting/, /sortedComponents\.map/],
  },
  {
    name: 'Navbar uses notifications and indicators',
    file: 'src/components/layout/Navbar.tsx',
    patterns: [/useNotifications/, /notify: notifications/, /rounded-full bg-red-500/],
  },
  {
    name: 'Navbar keeps nested Einstellungen submenu path',
    file: 'src/components/layout/Navbar.tsx',
    patterns: [
      /href: '\/konto-root'/,
      /\{ href: resolveHref\('\/einstellungen'\), label: 'Einstellungen', icon: Settings, isExternalLink: !isDashboardDomain \}/,
      /renderNavSection\('Konto & Hilfe', accountHelpItems, isMobile\)/,
      /if \(href === '\/konto-root'\) return pathname\.startsWith\('\/profil'\) \|\| pathname\.startsWith\('\/einstellungen'\)/,
    ],
  },
  {
    name: 'Dashboard scoring logic is correct',
    file: 'src/hooks/useDashboardSorting.ts',
    patterns: [
      /scores\.todos = 100/,
      /scores\.events = 80/,
      /scores\.polls = 70/,
      /scores\.funding = 50/,
      /scores\.news = 30/,
      /leaderboard: 40/
    ],
  },
]

function read(relativePath) {
  const fullPath = path.join(projectRoot, relativePath)
  return fs.readFileSync(fullPath, 'utf8')
}

const failures = []

for (const check of checks) {
  const content = read(check.file)
  const missing = check.patterns.filter((pattern) => !pattern.test(content))

  if (missing.length > 0) {
    failures.push({
      name: check.name,
      file: check.file,
      missingPatterns: missing.map((pattern) => pattern.toString()),
    })
  }
}

if (failures.length > 0) {
  console.error('Regression guard failed. Missing expected UI behaviors/styles:')
  for (const failure of failures) {
    console.error(`- ${failure.name} (${failure.file})`)
    for (const pattern of failure.missingPatterns) {
      console.error(`  missing: ${pattern}`)
    }
  }
  process.exit(1)
}

console.log('Regression guard passed.')
