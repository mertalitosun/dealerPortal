# Dealer Portal v3

Dealer Portal, bayilerin satış süreçlerini yönetmelerini ve komisyon hesaplamalarını optimize etmelerini sağlayan bir web uygulamasıdır. Bu platform, bayi yönetim süreçlerini dijitalleştirerek işletmelerin daha etkin ve verimli çalışmalarını destekler.

## Özellikler

- **Bayiler:** Bayileri kaydedebilir, düzenleyebilir ve satış performanslarını takip edebilirsiniz.
- **Müşteriler:** Bayiler, müşterilerini ekleyebilir, düzenleyebilir ve satışlarını yönetebilir.
- **Komisyon Hesaplama:** Her ayın başında cron job ile otomatik olarak bayilerin komisyon hak edişleri hesaplanır ve raporlanır.
- **Komisyon Yönetimi:** Bayilerin hak edişleri filtrelenebilir ve komisyon oranları gerektiğinde değiştirilebilir.
- **Ürün Yönetimi:** Sisteme yeni ürünler ekleyebilir, bu ürünleri bayilere tanımlayabilir ve ürün bazında satış takibi yapabilirsiniz.
- **Güvenlik:** Kullanıcı verileri güçlü şifreleme ve güvenli oturum yönetimi ile korunur.

## Kurulum ve Kullanım

Projenin çalıştırılması için aşağıdaki adımları izleyin.

### 1. Projeyi İndirin

Öncelikle, projeyi bilgisayarınıza klonlayın veya zip dosyasını indirip çıkartın.

```bash
git clone https://github.com/kullanıcı_adı/dealerPortal.git
```
### 2. Gerekli Bağımlılıkları Yükleyin

Proje dizinine gidin ve npm kullanarak bağımlılıkları yükleyin.

```bash
npm install
```
### 2. Veritabanı Bağlantısını Yapılandırın
- ```bash 
data/db/config.js 
``` dosyasında yer alan url değişkenini kendi MongoDB bağlantı URL'inizle değiştirin.

```javascript
const url = "mongodb://localhost:27017/dealerPortal";
const url = "mongodb://<kendi-mongodb-url'iniz>";
```

### 2. Uygulamayı Başlatın
```bash
npm start
```

