import { redirect } from 'next/navigation'

interface ReferralPageProps {
  params: Promise<{ id: string }>
}

export default async function ReferralRedirectPage({ params }: ReferralPageProps) {
  const { id } = await params
  
  // Simple redirect to register with ref param
  redirect(`/register?ref=${id}`)
}
