$(document).ready(function() {
    // SUDE'NİN GÖREVİ: Saate göre otomatik tema değişimi
    function applyThemeByTime() {
        const hour = new Date().getHours();
        const $body = $('body');

        // Sabah 06:00 ile Akşam 18:00 arası aydınlık mod
        if (hour >= 6 && hour < 18) {
            $body.removeClass('dark-theme').addClass('light-theme');
            console.log("Sistem: Aydınlık Mod uygulandı.");
        } else {
            $body.removeClass('light-theme').addClass('dark-theme');
            console.log("Sistem: Karanlık Mod uygulandı.");
        }
    }

    applyThemeByTime();

    // ZEYNEP VE KÜBRA BURADAN DEVAM EDECEK:
    // Zeynep: API istekleri için buraya fonksiyonlar yazacak.
    // Kübra: Favori ekleme butonları için buraya kodlar ekleyecek.
    // --- ZEYNEP'İN KODLARI BAŞLANGIÇ ---
    
    // ADIM 1: Gerekli API bilgileri
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b'; 
    const forecastApiUrlBase = 'https://api.openweathermap.org/data/2.5/forecast';
    
    // ADIM 2: Gelen 40 verilik karmaşık listeyi 5 günlük net özete çeviren algoritma
    function processForecastData(forecastList) {
        const dailyData = {};
        
        // Gelen listeyi tarihlere göre grupluyoruz
        forecastList.forEach(item => {
            const date = item.dt_txt.split(' ')[0]; // Sadece tarihi alır (örn: "2025-05-18")
            if (!dailyData[date]) {
                dailyData[date] = { temps: [], weatherDescriptions: [] };
            }
            dailyData[date].temps.push(item.main.temp); // O günkü tüm 3 saatlik sıcaklıkları biriktir
            dailyData[date].weatherDescriptions.push(item.weather[0].description);
        });

        const processedDailyArray = [];
        
        // Her gün için en düşük ve en yüksek sıcaklığı hesaplıyoruz
        for (const date in dailyData) {
            const day = dailyData[date];
            const minTemp = Math.min(...day.temps); // O günün en düşük sıcaklığı
            const maxTemp = Math.max(...day.temps); // O günün en yüksek sıcaklığı
            const description = day.weatherDescriptions[Math.floor(day.weatherDescriptions.length / 2)]; 

            processedDailyArray.push({
                tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
                enDusuk: Math.round(minTemp),
                enYuksek: Math.round(maxTemp),
                durum: description
            });
        }
        
        // İlk 5 günü geri döndür
        return processedDailyArray.slice(0, 5);
    }

    // ADIM 3: Belirli bir şehir için API'den veriyi çeken fonksiyon
    function getFiveDayForecastForCity(city) {
        console.log(`Motor Çalışıyor: ${city} için hava durumu aranıyor...`);
        
        const requestUrl = `${forecastApiUrlBase}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;

        // jQuery AJAX ile API'ye bağlanıyoruz
        $.ajax({
            url: requestUrl,
            method: 'GET',
            success: function(data) {
                console.log("Ham Veri Geldi! İçinde 40 tane 3 saatlik tahmin var:", data);
                
                // Gelen karmaşık veriyi kendi fonksiyonumuzla temizliyoruz
                const temizlenmisVeri = processForecastData(data.list);
                
                console.log(`İşte ${city} için temizlenmiş 5 GÜNLÜK ÖZET:`);
                console.table(temizlenmisVeri); // Konsolda tablo şeklinde güzelce göster
            },
            error: function(jqXHR) {
                if (jqXHR.status === 404) {
                    console.error("HATA: Şehir bulunamadı! Lütfen geçerli bir şehir yazın.");
                } else {
                    console.error("HATA: API bağlantı sorunu oluştu.");
                }
            }
        });
    }

    // ADIM 4: Sistemi test etmek için fonksiyonu manuel çalıştırıyoruz
    // İleride burayı HTML'deki "Getir" butonuna tıklanınca çalışacak şekilde değiştireceğiz.
    getFiveDayForecastForCity('Ankara');

    // --- ZEYNEP'İN KODLARI BİTİŞ ---
});