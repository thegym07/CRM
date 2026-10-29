// « (Bilan Forme) » à côté du nom : la commerciale sait d'où vient le prospect.
export const BILAN_LABEL = 'Bilan Forme'

export default function SourceTag({ source }: { source: string | null }) {
  if (source !== 'Bilan Forme') return null
  return <span className="ml-1 whitespace-nowrap text-xs font-normal text-gray-500">({BILAN_LABEL})</span>
}
