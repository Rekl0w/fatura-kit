# Katkı Rehberi

`@rekl0w/fatura-kit` paketine katkı verdiğiniz için teşekkürler.

Bu depo hibrit bir pakettir:

- GİB e-Arşiv akışları için tipli bir TypeScript/Bun SDK’sı
- aynı çekirdeği kullanan stdio tabanlı bir MCP sunucusu

## Geliştirme

1. Bağımlılıkları `bun install` ile kurun
2. `bun run check` komutunu çalıştırın
3. `bun run build` komutunu çalıştırın
4. Net ve kısa bir özetle pull request açın

## Kapsam kuralları

- Bu depo hangi noktalarda `mlevent/fatura` davranışını takip ediyorsa parity’yi koruyun.
- Bilerek farklı davranıyorsanız nedenini hem PR açıklamasında hem de `CHANGELOG.md` içinde belirtin.
- Yeni MCP araçları eklerken istemci/kütüphane davranışının da aynı çizgide kaldığından emin olun.

## Notlar

- Model matematiği parity’sini bozmayın
- Toplam/hesap mantığını değiştirmeden önce test eklemeyi tercih edin
- Varsayılan CI akışında gerçek GİB servislerine istek atmayın
- MCP araç çıktıları deterministik ve JSON dostu olsun

## PR açmadan önce

- Genel kullanım değiştiyse `README.md` dosyasını güncelleyin
- Kullanıcıyı etkileyecek değişiklik varsa `CHANGELOG.md` dosyasını güncelleyin
- Varsayılan CI için fixture/mock tabanlı testleri tercih edin
