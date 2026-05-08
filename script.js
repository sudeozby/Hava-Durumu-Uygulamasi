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
                // İkonları biriktirmek için 'icons: []' eklendi
                dailyData[date] = { temps: [], weatherDescriptions: [], icons: [] };
            }
            dailyData[date].temps.push(item.main.temp); 
            dailyData[date].weatherDescriptions.push(item.weather[0].description);
            dailyData[date].icons.push(item.weather[0].icon); // İkonu torbaya at
        });

        const processedDailyArray = [];
        
        for (const date in dailyData) {
            const day = dailyData[date];
            const minTemp = Math.min(...day.temps); 
            const maxTemp = Math.max(...day.temps); 
            const description = day.weatherDescriptions[Math.floor(day.weatherDescriptions.length / 2)]; 
            const icon = day.icons[Math.floor(day.icons.length / 2)]; // Günün ikonunu seç

            processedDailyArray.push({
                tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
                enDusuk: Math.round(minTemp),
                enYuksek: Math.round(maxTemp),
                durum: description,
                ikon: icon // Pakete ikonu da ekle
            });
        }
        
        return processedDailyArray.slice(0, 5);
    }
    // Temizlenen Veriyi HTML Kartlarına Çevirme
    function displayForecastToHTML(dailyForecasts, cityName) {
        const $container = $('#forecast-cards-container');
        const $title = $('#forecast-city-name');
        
        $container.empty(); // Önceki şehirden kalan kartları temizle
        $title.text(`${cityName} İçin 5 Günlük Hava Tahmini`).show(); // Başlığı göster

        // 5 günlük veriyi dönüp kart oluşturuyoruz
        dailyForecasts.forEach(day => {
            const iconUrl = `https://openweathermap.org/img/w/${day.ikon}.png`; 
            
            const cardHTML = `
                <div class="col">
                    <div class="metric-card">
                        <h5 class="card-title">${day.tarih}</h5>
                        <img src="${iconUrl}" alt="${day.durum}" style="width: 80px; height: 80px;">
                        <p class="metric-value mb-1">${day.enYuksek}° <span style="font-size:1rem; color:#888;">/ ${day.enDusuk}°</span></p>
                        <p class="metric-label text-capitalize">${day.durum}</p>
                    </div>
                </div>
            `;
            $container.append(cardHTML);
        });
    }

    function getFiveDayForecastForCity(city) {
        console.log(`Motor Çalışıyor: ${city} için hava durumu aranıyor...`);
        
        const requestUrl = `${forecastApiUrlBase}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;

        $.ajax({
            url: requestUrl,
            method: 'GET',
           success: function(data) {
                const temizlenmisVeri = processForecastData(data.list);
                
                // Konsola yazmayı bıraktık, artık HTML'e fırlatıyoruz!
                displayForecastToHTML(temizlenmisVeri, data.city.name); 
                
                // Kübra'nın Efektlerini Tetikliyoruz
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

   // Arama Butonuna Tıklanınca Çalışacak Kodlar
    $('#get-weather-btn').on('click', function() {
        const city = $('#city-input').val().trim(); // Inputtaki yazıyı al
        if (city !== "") {
            getFiveDayForecastForCity(city);
        } else {
            alert("Lütfen bir şehir adı girin.");
        }
    });

    // Arama kutusundayken Enter tuşuna basınca da çalışsın
    $('#city-input').keypress(function(event) {
        if (event.which === 13) { 
            event.preventDefault(); 
            $('#get-weather-btn').click(); 
        }
    });

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