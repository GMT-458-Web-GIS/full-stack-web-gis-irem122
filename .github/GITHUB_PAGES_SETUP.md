# GitHub Pages Kurulum Adımları

## ✅ Tamamlanan İşlemler:

1. ✅ GitHub Actions workflow oluşturuldu (`.github/workflows/deploy.yml`)
2. ✅ `_config.yml` ve `.nojekyll` dosyaları eklendi
3. ✅ Değişiklikler GitHub'a push edildi

## 🔧 Seni Gereken Adımlar (GitHub Web Arayüzünde):

### 1. Repository Settings'e Git
- GitHub'da projenin sayfasına git: https://github.com/GMT-458-Web-GIS/full-stack-web-gis-irem122
- "Settings" sekmesini tıkla

### 2. Pages Ayarlarını Aç
Solda "Code and automation" > "Pages" tıkla

### 3. Deploy Kaynağını Ayarla
**Source** section'ında:
- **Deploy from a branch** seçeneğini seç
- **Branch**: `main` seç
- **Folder**: `/ (root)` seç
- **Save** butonuna tıkla

### 4. GitHub Actions'dan Deploy Yap (Alternatif)
Eğer yukarıda hata alırsan:
- **Source** section'ında: **GitHub Actions** seçeneğini seç
- Otomatik olarak workflow'u bulup tetikleyecektir

## 🚀 Sonra Ne Olur?

1. GitHub Actions otomatik olarak çalışacak
2. Projeyi build edecek (`npm run build`)
3. `dist/` klasörünü GitHub Pages'e deploy edecek
4. Site şurada yayımlanacak: 
   - `https://GMT-458-Web-GIS.github.io/full-stack-web-gis-irem122/`

## ✨ Tamamlandıktan Sonra:

Site açıldığında:
- ✅ Ana sayfa (index.html) görünecek
- ✅ Sign In / Sign Up linklerine tıklanabilir
- ✅ 404 hatası almayacaksın

## 📝 Deployment Status

GitHub Actions'ı kontrol etmek için:
1. Repository > "Actions" sekmesi
2. "Deploy to GitHub Pages" workflow'u göreceksin
3. Her push'ta otomatik çalışacak

## ⚠️ Dikkat

- Site ilk yayımlanması 1-2 dakika sürebilir
- Browser cache'ini temizle (Cmd+Shift+Delete)
- İlk deploy'dan sonra sayfayı yenile

---

Ayarları yaptıktan sonra çıktısını bana göster, ben kontrol edeceğim!
