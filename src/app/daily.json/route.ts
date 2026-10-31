import { buildDailyCatalog } from '@/lib/daily-catalog';

// Statik dışa aktarımda /daily.json dosyası olarak yazılır; keşfet sayfası bugünün seçimini buradan alır.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(buildDailyCatalog());
}
