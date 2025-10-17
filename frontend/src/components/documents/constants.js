// Canonical required documents grouped into topics (16 total)
export const DOC_TOPICS = [
  {
    key: 'profile',
    title: 'Profile',
    docs: [
      { key: 'id_document', label: 'ID Document' },
      { key: 'marriage_certificate', label: 'Marriage Certificate' },
    ],
  },
  {
    key: 'children',
    title: 'Children',
    docs: [
      { key: 'child_birth_certificates', label: 'Birth Certificates (if applicable)' },
      { key: 'school_fees_proof', label: 'Proof of School Fees' },
    ],
  },
  {
    key: 'intake',
    title: 'Intake',
    docs: [
      { key: 'intake_form', label: 'Completed Intake Form' },
    ],
  },
  {
    key: 'financials',
    title: 'Financials',
    docs: [
      { key: 'payslips_3m', label: 'Payslips (last 3 months)' },
      { key: 'bank_statements_3m', label: 'Bank Statements (3 months)' },
      { key: 'assets_list', label: 'List of Assets' },
      { key: 'liabilities_list', label: 'List of Liabilities/Debts' },
      { key: 'anc_pnc', label: 'Ante/Postnuptial Agreement (if any)' },
    ],
  },
  {
    key: 'housing',
    title: 'Housing',
    docs: [
      { key: 'mortgage_or_lease', label: 'Mortgage/Lease Agreement' },
      { key: 'utility_bill', label: 'Latest Municipal/Utility Bill' },
    ],
  },
  {
  key: 'confirmation',
  title: 'Confirmed',
    docs: [
      { key: 'medical_aid', label: 'Medical Aid Membership & Premium' },
      { key: 'retirement_statement', label: 'Pension/Provident Statement' },
      { key: 'life_insurance', label: 'Life Insurance Policy (if any)' },
    ],
  },
];

export function getTotals(topics = DOC_TOPICS) {
  return topics.reduce((sum, t) => sum + (t.docs?.length || 0), 0);
}

export const TOTAL_DOCS = getTotals();
