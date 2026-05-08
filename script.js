$(document).ready(function() {
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b';
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];

    // Başlangıç Ayarları
    applyThemeByTime();
    renderFavorites();

    // 1. TEMA AYARI (Sude)
    function applyThemeByTime() {
        const hour = new Date().getHours();
        const $body = $('body');
        if (hour >= 6 && hour < 18) {
            $body.removeClass('dark-theme').addClass('light-theme');
        } else {
            $body.removeClass('light-theme').addClass('dark-theme');
        }
    }

    // 2. VERİ ÇEKME (Zeynep)
    function getFiveDayForecast(city) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
        
        // Yükleniyor ibaresi
        $('#get-weather-btn').text('Aranıyor...').prop('disabled', true);

        $.ajax({
            url: url,
            method: 'GET',
            success: function(data) {
                const temizVeri = processForecastData(data.list);
                displayForecastToHTML(temizVeri, data.city.name);
                
                createWeatherEffects(data.list[0].weather[0].main); // Kübra'nın efektleri çalışır
                $('#add-to-fav-btn').fadeIn(); // Favori butonunu göster
            },
            error: function() { 
                alert("Şehir bulunamadı! Lütfen geçerli bir şehir adı girin."); 
            },
            complete: function() {
                $('#get-weather-btn').text('Getir').prop('disabled', false);
            }
        });
    }

    function processForecastData(list) {
        const daily = {};
        list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!daily[date]) daily[date] = { temps: [], icons: [], desc: [] };
            daily[date].temps.push(item.main.temp);
            daily[date].icons.push(item.weather[0].icon);
            daily[date].desc.push(item.weather[0].description);
        });
        
        return Object.keys(daily).slice(0, 5).map(date => ({
            tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
            enYuksek: Math.round(Math.max(...daily[date].temps)),
            enDusuk: Math.round(Math.min(...daily[date].temps)),
            durum: daily[date].desc[Math.floor(daily[date].desc.length / 2)], 
            ikon: daily[date].icons[Math.floor(daily[date].icons.length / 2)]
        }));
    }

    function displayForecastToHTML(dailyForecasts, cityName) {
        const $container = $('#forecast-cards-container');
        $('#forecast-city-name').text(cityName + " İçin 5 Günlük Hava Tahmini").show();
        $container.empty();
        
        dailyForecasts.forEach(day => {
            $container.append(`
                <div class="col">
                    <div class="card weather-card text-center p-3 h-100 shadow-sm">
                        <h5>${day.tarih}</h5>
                        <img src="https://openweathermap.org/img/wn/${day.ikon}@2x.png" class="mx-auto" style="width:70px">
                        <div class="temp-display" style="font-size: 1.5rem; font-weight:bold;">${day.enYuksek}° <span style="font-size:1rem; opacity:0.6">/ ${day.enDusuk}°</span></div>
                        <p class="text-capitalize mb-0">${day.durum}</p>
                    </div>
                </div>
            `);
        });
    }

   // 3. FAVORİLER (Kübra, Beyza & Zeynep)
    function renderFavorites() {
        const $container = $('#favorite-cities-container');
        $container.empty();
        if (favorites.length === 0) {
            $container.html('<p class="text-center w-100">Henüz favori eklenmedi.</p>');
            return;
        }

        favorites.forEach(city => {
            const cardId = `fav-card-${city.replace(/\s+/g, '-')}`;

            $container.append(`
                <div class="col">
                    <div class="card p-3 shadow-sm fav-card" data-city="${city}" style="cursor:pointer; border-left: 5px solid #0d6efd; transition: transform 0.2s;">
                        <div class="d-flex justify-content-between align-items-start">
                            <span style="font-weight:bold; font-size:1.1rem;">${city}</span>
                            <button class="btn btn-danger btn-sm remove-fav" data-city="${city}">Sil</button>
                        </div>
                        <div id="${cardId}" class="mt-2 text-center">
                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                        </div>
                    </div>
                </div>
            `);

            getCurrentWeatherForFavorite(city, `#${cardId}`);
        });
    }

    function getCurrentWeatherForFavorite(city, targetElementId) {
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;

        $.ajax({
            url: currentUrl,
            method: 'GET',
            success: function(data) {
                const temp = Math.round(data.main.temp);
                const desc = data.weather[0].description;
                const icon = data.weather[0].icon;
                
                $(targetElementId).html(`
                    <div class="d-flex align-items-center mt-1">
                        <img src="https://openweathermap.org/img/wn/${icon}.png" style="width:50px; margin-left:-10px;">
                        <div class="ms-1 text-start">
                            <span style="font-size:1.5rem; font-weight:bold; line-height:1;">${temp}°</span>
                            <div class="text-capitalize text-muted" style="font-size:0.85rem;">${desc}</div>
                        </div>
                    </div>
                `);
            },
            error: function() {
                $(targetElementId).html('<small class="text-danger">Veri alınamadı</small>');
            }
        });
    }

    $(document).on('click', '.remove-fav', function(e) {
        e.stopPropagation(); 
        const city = $(this).data('city');
        favorites = favorites.filter(c => c !== city);
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        renderFavorites();
    });

    $(document).on('click', '.fav-card', function() {
        const city = $(this).data('city'); 
        getFiveDayForecast(city);          
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    });

    $('#add-to-fav-btn').on('click', function() {
        const city = $('#forecast-city-name').text().split(" İçin")[0];
        
        if (city && !favorites.includes(city)) {
            if (favorites.length >= 6) {
                alert("Maksimum 6 favori şehir ekleyebilirsiniz.");
                return;
            }
            favorites.push(city);
            localStorage.setItem('favoriteCities', JSON.stringify(favorites));
            renderFavorites();
            alert(`${city} favorilere eklendi!`);
        } else if (favorites.includes(city)) {
            alert(`${city} zaten favorilerinizde ekli.`);
        }
    });

    // 4. BUTONLAR VE ARAMA
    $('#get-weather-btn').on('click', function() {
        const city = $('#city-input').val().trim();
        if (city) getFiveDayForecast(city);
    });

    $('#city-input').keypress(function(event) {
        if (event.which === 13) { 
            event.preventDefault(); 
            $('#get-weather-btn').click(); 
        }
    });

    // ==========================================
    // KÜBRA'NIN EFEKTLERİ
    // ==========================================
    if($('#weather-effects-container').length === 0) {
        $('body').prepend('<div id="weather-effects-container" style="position:fixed; top:0; left:0; width:100%; height:100%; z-index:-1; pointer-events:none;"></div>');
    }

    function createWeatherEffects(condition) {
        const $container = $('#weather-effects-container');
        $container.empty(); 
        const weather = condition.toLowerCase();
        
        const hour = new Date().getHours();
        const isNight = (hour >= 18 || hour < 6);

        if (weather.includes('thunder') || weather.includes('storm')) {
            $container.append('<div class="lightning-flash"></div>');
            for (let i = 0; i < 40; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 0.8 + 0.2;
                $container.append(`<div class="rain-drop" style="left:${left}vw; animation-duration:${duration}s"></div>`);
            }
        }
        else if (weather.includes('rain')) {
            for (let i = 0; i < 30; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 1 + 0.5;
                $container.append(`<div class="rain-drop" style="left:${left}vw; animation-duration:${duration}s"></div>`);
            }
        } 
        else if (weather.includes('snow')) {
            for (let i = 0; i < 40; i++) {
                let left = Math.random() * 100;
                let duration = Math.random() * 3 + 2;
                $container.append(`<div class="snow-flake" style="left:${left}vw; animation-duration:${duration}s">❄</div>`);
            }
        }
        else if (weather.includes('cloud')) {
            for (let i = 0; i < 5; i++) {
                let top = Math.random() * 50;
                let size = Math.random() * 200 + 100;
                let duration = Math.random() * 20 + 10;
                $container.append(`<div class="cloud-particle" style="top:${top}%; width:${size}px; height:${size/2}px; animation-duration:${duration}s"></div>`);
            }
        }
        else if (weather.includes('clear')) {
            if (isNight) {
                for (let i = 0; i < 50; i++) {
                    let left = Math.random() * 100;
                    let top = Math.random() * 60; 
                    let delay = Math.random() * 2;
                    $container.append(`<div class="night-star" style="left:${left}vw; top:${top}vh; animation-delay:${delay}s"></div>`);
                }
            } else {
                $container.append('<div class="sun-glow"></div>');
            }
        }
    }// TEMA DEĞİŞTİRME BUTONU (Sude - Manuel Kontrol)
    $('#theme-toggle-btn, #manual-theme-btn').on('click', function() {
        const $body = $('body');
        
        if ($body.hasClass('light-theme')) {
            $body.removeClass('light-theme').addClass('dark-theme');
            $(this).html('<i class="bi bi-sun-fill text-warning"></i> Aydınlık');
        } else {
            $body.removeClass('dark-theme').addClass('light-theme');
            $(this).html('<i class="bi bi-moon-stars-fill"></i> Karanlık');
        }
        
        // Kullanıcının seçimini hafızaya atalım (Sayfa yenilenince bozulmasın)
        const currentTheme = $body.hasClass('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('user-preference', currentTheme);
    });

    // Sayfa açıldığında hafızadaki temayı kontrol et
    const savedTheme = localStorage.getItem('user-preference');
    if (savedTheme === 'dark') {
        $('body').addClass('dark-theme').removeClass('light-theme');
    } else if (savedTheme === 'light') {
        $('body').addClass('light-theme').removeClass('dark-theme');
    }
});