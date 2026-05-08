$(document).ready(function() {
    
    // ==========================================
    // SUDE'NİN GÖREVİ: Saate göre otomatik tema değişimi
    // ==========================================
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

    // ==========================================
    // ZEYNEP'İN GÖREVİ: API Veri Çekme ve Süzme Motoru
    // ==========================================
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b'; 
    const forecastApiUrlBase = 'https://api.openweathermap.org/data/2.5/forecast';
    
    function processForecastData(forecastList) {
        const dailyData = {};
        
        forecastList.forEach(item => {
            const date = item.dt_txt.split(' ')[0]; 
            if (!dailyData[date]) {
                dailyData[date] = { temps: [], weatherDescriptions: [] };
            }
            dailyData[date].temps.push(item.main.temp); 
            dailyData[date].weatherDescriptions.push(item.weather[0].description);
        });

        const processedDailyArray = [];
        
        for (const date in dailyData) {
            const day = dailyData[date];
            const minTemp = Math.min(...day.temps); 
            const maxTemp = Math.max(...day.temps); 
            const description = day.weatherDescriptions[Math.floor(day.weatherDescriptions.length / 2)]; 

            processedDailyArray.push({
                tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
                enDusuk: Math.round(minTemp),
                enYuksek: Math.round(maxTemp),
                durum: description
            });
        }
        
        return processedDailyArray.slice(0, 5);
    }

    function getFiveDayForecastForCity(city) {
        console.log(`Motor Çalışıyor: ${city} için hava durumu aranıyor...`);
        
        const requestUrl = `${forecastApiUrlBase}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;

        $.ajax({
            url: requestUrl,
            method: 'GET',
            success: function(data) {
                console.log("Ham Veri Geldi! İçinde 40 tane 3 saatlik tahmin var:", data);
                const temizlenmisVeri = processForecastData(data.list);
                
                console.log(`İşte ${city} için temizlenmiş 5 GÜNLÜK ÖZET:`);
                console.table(temizlenmisVeri); 
                
                // ZEYNEP BURADA KÜBRA'NIN EFEKTİNİ TETİKLİYOR:
                if (data.list && data.list[0]) {
                    createWeatherEffects(data.list[0].weather[0].main);
                }
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

    // Sistemin test kodu (Başlangıçta çalışır)
    getFiveDayForecastForCity('Ankara');

    // ==========================================
    // KÜBRA'NIN GÖREVİ: Dinamik Hava Durumu Efektleri
    // ==========================================
    function createWeatherEffects(condition) {
        const $container = $('#weather-effects-container');
        $container.empty(); // Eski efektleri temizle
        const weather = condition.toLowerCase();
        
        // Gece mi gündüz mü kontrolü (Yıldızlar veya Güneş için)
        const hour = new Date().getHours();
        const isNight = (hour >= 18 || hour < 6);

        if (weather.includes('thunder') || weather.includes('storm')) {
            // 1. ŞİMŞEK EFEKTİ (Gök Gürültülü Fırtına)
            $container.append('<div class="lightning-flash"></div>');
            // Fırtınada aynı zamanda yağmur da yağsın
            for (let i = 0; i < 40; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 0.8 + 0.2;
                $container.append(`<div class="rain-drop" style="left:${left}vw; animation-duration:${duration}s"></div>`);
            }
        }
        else if (weather.includes('rain')) {
            // Yağmur
            for (let i = 0; i < 30; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 1 + 0.5;
                $container.append(`<div class="rain-drop" style="left:${left}vw; animation-duration:${duration}s"></div>`);
            }
        } 
        else if (weather.includes('snow')) {
            // Kar
            for (let i = 0; i < 40; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 3 + 2;
                $container.append(`<div class="snow-flake" style="left:${left}vw; animation-duration:${duration}s">❄</div>`);
            }
        }
        else if (weather.includes('cloud')) {
            // Bulutlu
            for (let i = 0; i < 5; i++) {
                let top = Math.random() * 50;
                let size = Math.random() * 200 + 100;
                let duration = Math.random() * 20 + 10;
                $container.append(`<div class="cloud-particle" style="top:${top}%; width:${size}px; height:${size/2}px; animation-duration:${duration}s"></div>`);
            }
        }
        else if (weather.includes('clear')) {
            // 2. YILDIZLI GECE VEYA GÜNEŞLİ GÜNDÜZ EFEKTİ
            if (isNight) {
                // Geceyse 50 tane parlayan yıldız ekle
                for (let i = 0; i < 50; i++) {
                    let left = Math.random() * 100;
                    let top = Math.random() * 60; // Ekranın üst %60'lık kısmında çıksın
                    let delay = Math.random() * 2;
                    $container.append(`<div class="night-star" style="left:${left}vw; top:${top}vh; animation-delay:${delay}s"></div>`);
                }
            } else {
                // Gündüzse güneş parlaması ekle
                $container.append('<div class="sun-glow"></div>');
            }
        }
    }

}); // <--- EN ÖNEMLİ KISIM BURASI: document.ready KAPANIŞI