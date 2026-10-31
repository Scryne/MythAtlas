/**
 * Efektten pencereye/depoya bağlı bir okuma ya da animasyon başlatmasını çalıştırır. State güncellemesi
 * efekt gövdesinde senkron değil, bir sonraki mikro görevde olur (React 19 `set-state-in-effect`).
 * Bu okumalar efektte kalmak zorunda: statik dışa aktarımda sunucu HTML'i `window`/`localStorage`
 * görmez, ilk render'da okumak hidrasyonu bozardı.
 */
export function startLoad(load: () => unknown): void {
  void Promise.resolve().then(load);
}
