import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()

const checks = [
  {
    name: 'Login has dashboard back link',
    file: 'src/app/login/page.tsx',
    patterns: [/href=\"\/\"/, /Zur\u00fcck zum Dashboard/],
  },
  {
    name: 'Register has dashboard back link',
    file: 'src/app/register/page.tsx',
    patterns: [/href=\"\/\"/, /Zur\u00fcck zum Dashboard/],
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
    name: 'Register keeps 3-step flow and validation gate',
    file: 'src/app/register/page.tsx',
    patterns: [/useState<1 \| 2 \| 3>\(1\)/, /validateCurrentStep\(/, /if \(!validateCurrentStep\(\)\) return/],
  },
  {
    name: 'Dashboard keeps expense-driven funding goal logic',
    file: 'src/app/page.tsx',
    patterns: [/const \[expenseGoal, setExpenseGoal\]/, /todo\.status !== 'done'/, /goal=\{expenseGoal > 0 \? expenseGoal : \(settings\?\.funding_goal \|\| 10000\)\}/],
  },
  {
    name: 'Dashboard persists expected ticket sales',
    file: 'src/app/page.tsx',
    patterns: [/expected_ticket_sales/, /onTicketSalesChange=\{handleTicketSalesChange\}/],
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
    name: 'Finance page keeps effective goal from expenses',
    file: 'src/app/finanzen/page.tsx',
    patterns: [/const expenseGoal =/, /const effectiveGoal =/, /goal=\{effectiveGoal\}/],
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
