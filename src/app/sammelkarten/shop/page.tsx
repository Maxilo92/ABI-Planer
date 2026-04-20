import { redirect } from 'next/navigation'
import { getShopBaseUrl } from '@/lib/dashboard-url'

export default function ShopRedirect() {
  redirect(`${getShopBaseUrl()}/shop?category=sammelkarten`)
}
