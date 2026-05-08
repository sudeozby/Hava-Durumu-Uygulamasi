$(document).ready(function() {
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b';
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];

    // BAŞLANGIÇ AYARLARI
    applyThemeByTime();
    renderFavorites();

    // 1. TEMA AYARI (Sude)
    function applyThemeByTime() {
        const hour = new Date().getHours();
        const savedTheme = localStorage.getItem('user-preference');
        
        if (savedTheme) {
            $('body').addClass(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
        } else {
            const theme = (hour >= 6 && hour < 18) ? 'light-theme' : 'dark-theme';
            $('body').addClass(theme);
        }
    }

    $('#theme-toggle-btn').on('click', function() {
        const $body = $('body');
        $body.toggleClass('light-theme dark-theme');
        const currentTheme = $body.hasClass('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('user-preference', currentTheme);
        $(this).html(currentTheme === 'dark' ? '<i class="bi bi-sun-fill text-warning"></i> Aydınlık' : '<i class="bi bi-moon-stars-fill"></i> Karanlık');
    });

    // 2. VERİ ÇEKME VE İŞLEME (Zeynep)
    function getFiveDayForecast(city) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
        $('#get-weather-btn').text('Aranıyor...').prop('disabled', true);

        $.ajax({
            url: url,
            method: 'GET',
            success: function(data) {
                const temizVeri = processForecastData(data.list);
                displayForecastToHTML(temizVeri, data.city.name);
                createWeatherEffects(data.list[0].weather[0].main); 
                $('#add-to-fav-btn').fadeIn();
            },
            error: function() { 
                alert("Şehir bulunamadı!"); 
            },
            complete: function() {
                $('#get-weather-btn').text('Göster').prop('disabled', false);
            }
        });
    }

    function processForecastData(list) {
        const daily = {};
        list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!daily[date]) daily[date] = { temps: [], icons: [], desc: [], mainCond: [] };
            daily[date].temps.push(item.main.temp);
            daily[date].icons.push(item.weather[0].icon);
            daily[date].desc.push(item.weather[0].description);
            daily[date].mainCond.push(item.weather[0].main);
        });
        
        return Object.keys(daily).slice(0, 5).map(date => ({
            tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
            enYuksek: Math.round(Math.max(...daily[date].temps)),
            durum: daily[date].desc[0],
            ikon: daily[date].icons[0],
            mainCond: daily[date].mainCond[0]
        }));
    }

    function displayForecastToHTML(dailyForecasts, cityName) {
        const $container = $('#forecast-cards-container').empty();
        $('#forecast-city-name').text(cityName).show();
        
        dailyForecasts.forEach(day => {
            $container.append(`
                <div class="col">
                    <div class="card weather-card text-center p-3 h-100 glass-card border-0" data-cond="${day.mainCond}">
                        <h6>${day.tarih}</h6>
                        <img src="https://openweathermap.org/img/wn/${day.ikon}@2x.png" class="mx-auto" width="70">
                        <div class="fw-bold">${day.enYuksek}°</div>
                        <p class="small text-capitalize mb-0">${day.durum}</p>
                    </div>
                </div>
            `);
        });
    }

    // 3. EFEKT MOTORU (Kübra)
    function createWeatherEffects(condition) {
        const $c = $('#weather-effects-container').empty();
        const w = condition.toLowerCase();
        const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;

        $('body').removeClass('rainy-bg sunny-bg cloudy-bg');

        if (w.includes('rain')) {
            $('body').addClass('rainy-bg');
            for(let i=0; i<50; i++) {
                $c.append(`<div class="rain-drop" style="left:${Math.random()*100}vw; animation-duration:${Math.random()+0.5}s"></div>`);
            }
        } else if (w.includes('clear')) {
            if (isNight) {
                for(let i=0; i<50; i++) $c.append(`<div class="night-star" style="left:${Math.random()*100}vw; top:${Math.random()*60}vh"></div>`);
            } else {
                $('body').addClass('sunny-bg');
                $c.append('<div class="sun-glow"></div>');
            }
        } else if (w.includes('cloud')) {
            $('body').addClass('cloudy-bg');
        }
    }

   // ==========================================
    // 4. FAVORİLER VE BUTONLAR (GÜNCEL)
    // ==========================================

    function renderFavorites() {
        const $container = $('#favorite-cities-container').empty();
        if (favorites.length === 0) {
            $container.html('<p class="text-center w-100">Henüz favori eklenmedi.</p>');
            return;
        }
        favorites.forEach(fav => {
            // Sude, burada artık sadece isim değil, temp ve desc (hava durumu) da basıyoruz
            $container.append(`
                <div class="col">
                    <div class="card p-3 glass-card fav-card text-center" data-city="${fav.name}">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="fw-bold"><i class="bi bi-geo-alt-fill me-1"></i>${fav.name}</span>
                            <button class="btn btn-link text-danger p-0 remove-fav" data-city="${fav.name}">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </div>
                        <div class="small text-muted">${fav.temp} - ${fav.desc}</div>
                    </div>
                </div>
            `);
        });
    }

    // Favori kartına tıklayınca o şehri tekrar ara
    $(document).on('click', '.fav-card', function() {
        getFiveDayForecast($(this).data('city'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Favoriden Silme (Mavi Etiket Çıkartır)
    $(document).on('click', '.remove-fav', function(e) {
        e.stopPropagation();
        const city = $(this).data('city');
        favorites = favorites.filter(c => c.name !== city);
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        renderFavorites();
        showNotification("Şehir listeden kaldırıldı.", "info"); // MAVİ ETİKET
    });

    // Favoriye Ekleme (Yeşil Etiket Çıkartır)
    $('#add-to-fav-btn').on('click', function() {
        const city = $('#forecast-city-name').text();
        const temp = $('#forecast-cards-container .fw-bold').first().text();
        const desc = $('#forecast-cards-container .small').first().text();

        if (city && !favorites.some(f => f.name === city)) {
            favorites.push({ name: city, temp: temp, desc: desc });
            localStorage.setItem('favoriteCities', JSON.stringify(favorites));
            renderFavorites();
            showNotification(`${city} favorilere eklendi!`, 'success'); // YEŞİL ETİKET
        } else {
            showNotification("Zaten favorilerinizde!", "info"); // MAVİ ETİKET
        }
    });

    $('#get-weather-btn').on('click', function() {
        const city = $('#city-input').val().trim();
        if (city) getFiveDayForecast(city);
    });
function showNotification(message, type = 'success') {
    const $toast = $('#notification-toast');
    
    // Mesajı ve rengi ayarla
    $toast.text(message)
          .removeClass('success info')
          .addClass(type)
          .addClass('show');

    // 3 saniye sonra gizle
    setTimeout(() => {
        $toast.removeClass('show');
    }, 3000);
}
});
// Favori butonuna tıklandığında kullanımı:
// showNotification("Şehir favorilere eklendi!", "success"); // Yeşil çıkar
// showNotification("Zaten favorilerde!", "info");          // Mavi çıkar