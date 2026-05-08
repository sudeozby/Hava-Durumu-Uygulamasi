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
                
                // İLERİDE BURADA KÜBRA'NIN EFEKTİNİ TETİKLEYECEĞİZ
                // Örn: createWeatherEffects(data.list[0].weather[0].main);
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

    // Sistemin test kodu
    getFiveDayForecastForCity('Ankara');

    // ==========================================
    // KÜBRA'NIN GÖREVİ: Dinamik Hava Durumu Efektleri
    // ==========================================
    function createWeatherEffects(condition) {
        const $container = $('#weather-effects-container');
        
        // Yeni bir şehre tıklandığında önceki şehrin efektlerini temizle
        $container.empty(); 

        // API'den gelen durumu küçük harfe çevir
        const weather = condition.toLowerCase();

        if (weather.includes('rain')) {
            // Yağmurlu
            for (let i = 0; i < 30; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 1 + 0.5;
                $container.append(`<div class="rain-drop" style="left:${left}vw; animation-duration:${duration}s"></div>`);
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
            // Güneşli
            $container.append('<div class="sun-glow"></div>');
        }
        else if (weather.includes('snow')) {
            // Karlı
            for (let i = 0; i < 40; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 3 + 2;
                $container.append(`<div class="snow-flake" style="left:${left}vw; animation-duration:${duration}s">❄</div>`);
            }
        }
        else if (weather.includes('wind') || weather.includes('breeze')) {
            // Rüzgarlı
            for (let i = 0; i < 20; i++) {
                let top = Math.random() * 100;
                let duration = Math.random() * 0.5 + 0.5;
                let delay = Math.random() * 2;
                $container.append(`<div class="wind-line" style="top:${top}vh; animation-duration:${duration}s; animation-delay:${delay}s"></div>`);
            }
        } 
        else if (weather.includes('hail')) {
            // Dolu
            for (let i = 0; i < 40; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 0.3 + 0.2; 
                $container.append(`<div class="hail-stone" style="left:${left}vw; animation-duration:${duration}s"></div>`);
            }
        }
        else if (weather.includes('mist') || weather.includes('fog')) {
            // Sisli
            $container.append('<div class="fog-layer"></div>');
        }
    }

});