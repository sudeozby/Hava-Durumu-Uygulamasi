$(document).ready(function() {
    

    // =================================================================
    // GENEL DEĞİŞKENLER
    // =================================================================
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b'; 
    let rawDataList = []; 
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || []; 

    applyThemeByTime();
    renderFavorites();

    // 1. TEMA YÖNETİMİ
    // =================================================================
    function applyThemeByTime() {
        const hour = new Date().getHours();
        const savedTheme = localStorage.getItem('user-preference');
        
        // HTML'den gelen sabit temayı temizleyip çakışmayı önlüyoruz
        $('body').removeClass('light-theme dark-theme'); 
        
        if (savedTheme) {
            $('body').addClass(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
            $('#theme-toggle-btn').html(savedTheme === 'dark' ? '<i class="bi bi-sun-fill text-warning"></i> Aydınlık' : '<i class="bi bi-moon-stars-fill"></i> Mod Değiştir');
        } else {
            const theme = (hour >= 6 && hour < 18) ? 'light-theme' : 'dark-theme';
            $('body').addClass(theme);
            $('#theme-toggle-btn').html(theme === 'dark-theme' ? '<i class="bi bi-sun-fill text-warning"></i> Aydınlık' : '<i class="bi bi-moon-stars-fill"></i> Mod Değiştir');
        }
    }

    $('#theme-toggle-btn').on('click', function() {
        const $body = $('body');
        $body.toggleClass('light-theme dark-theme');
        const currentTheme = $body.hasClass('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('user-preference', currentTheme);
        $(this).html(currentTheme === 'dark' ? '<i class="bi bi-sun-fill text-warning"></i> Aydınlık' : '<i class="bi bi-moon-stars-fill"></i> Mod Değiştir');
    });
    // =================================================================
    // 2. VERİ ÇEKME VE İŞLEME
    // =================================================================
    function getFiveDayForecast(city) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
        $('#get-weather-btn').text('Aranıyor...').prop('disabled', true);

        $.ajax({
            url: url,
            method: 'GET',
            success: function(data) {
                rawDataList = data.list; // Hafızaya al
                const temizVeri = processForecastData(data.list);
                displayForecastToHTML(temizVeri, data.city.name);
                createWeatherEffects(data.list[0].weather[0].main, data.list[0].weather[0].description); 
                $('#add-to-fav-btn').fadeIn();
                $('#weather-details-container').hide(); 
            },
            error: function() { 
                showNotification("Şehir bulunamadı!", "info"); 
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

        return Object.keys(daily).slice(0, 5).map(date => {
            const rawIcon = daily[date].icons[0];
            const mainCond = daily[date].mainCond[0];
            let finalIconHtml = "";

            // AY KONTROLÜ: Gece ve Hava Açıksa Ay koy
            if (rawIcon.includes('n') && mainCond === 'Clear') {
                finalIconHtml = `<i class="bi bi-moon-stars-fill text-moon fs-1 mx-auto my-3 d-block"></i>`;
            } else {
                finalIconHtml = `<img src="https://openweathermap.org/img/wn/${rawIcon}@2x.png" class="mx-auto" width="70">`;
            }

            return {
                // MAYIS YAZDIRMA BURADA
                tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }),
                enYuksek: Math.round(Math.max(...daily[date].temps)),
                durum: daily[date].desc[0],
                ikonHtml: finalIconHtml,
                mainCond: mainCond
            };
        });
    }

    function displayForecastToHTML(dailyForecasts, cityName) {
        const $container = $('#forecast-cards-container').empty();
        $('#forecast-city-name').text(cityName).show();
        
        dailyForecasts.forEach(day => {
            $container.append(`
                <div class="col">
                    <div class="card weather-card text-center p-3 h-100 glass-card border-0" data-cond="${day.mainCond}" style="cursor:pointer;">
                        <h6>${day.tarih}</h6>
                        ${day.ikonHtml} 
                        <div class="fw-bold">${day.enYuksek}°</div>
                        <p class="small text-capitalize mb-0">${day.durum}</p>
                    </div>
                </div>
            `);
        });
    }

    // =================================================================
    // 3. EFEKT MOTORU
    // =================================================================
    function createWeatherEffects(condition, description = "") {
        const $c = $('#weather-effects-container').empty();
        const w = condition.toLowerCase();
        const d = description.toLowerCase(); // Türkçe açıklamayı da küçült
        $('body').removeClass('rainy-bg sunny-bg cloudy-bg');

        // Eğer İngilizce 'rain' veya 'drizzle' geçiyorsa YA DA Türkçe açıklama 'yağmur' içeriyorsa:
        if (w.includes('rain') || w.includes('drizzle') || d.includes('yağmur')) {
            $('body').addClass('rainy-bg');
            for(let i=0; i<50; i++) {
                $c.append(`<div class="rain-drop" style="left:${Math.random()*100}vw; animation-duration:${Math.random()+0.5}s"></div>`);
            }
        } else if (w.includes('clear') || d.includes('açık')) {
            $('body').addClass('sunny-bg');
        } else {
            $('body').addClass('cloudy-bg');
        }
    }

    // =================================================================
    // 4. FAVORİ YÖNETİMİ
    // =================================================================
    function renderFavorites() {
        const $container = $('#favorite-cities-container').empty();
        if (favorites.length === 0) {
            $container.html('<p class="text-center w-100">Henüz favori eklenmedi.</p>');
            return;
        }
        favorites.forEach(fav => {
            $container.append(`
                <div class="col">
                    <div class="card p-3 glass-card fav-card text-center" data-city="${fav.name}">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold"><i class="bi bi-geo-alt-fill"></i> ${fav.name}</span>
                            <button class="btn btn-link text-danger p-0 remove-fav" data-city="${fav.name}"><i class="bi bi-x-circle"></i></button>
                        </div>
                        <img src="https://openweathermap.org/img/wn/${fav.icon}@2x.png" class="fav-icon-img" alt="${fav.desc}">
                        <div class="small mt-2">${fav.temp} - ${fav.desc}</div>
                    </div>
                </div>
            `);
        });
    }

    $('#add-to-fav-btn').on('click', function() {
        const city = $('#forecast-city-name').text();
        const temp = $('#forecast-cards-container .fw-bold').first().text();
        const desc = $('#forecast-cards-container .small').first().text();
        const iconSrc = $('#forecast-cards-container img').first().attr('src');
        const iconCode = iconSrc ? iconSrc.split('/wn/')[1].split('@')[0] : '01d';

        if (favorites.length >= 6 && !favorites.some(f => f.name === city)) {
            showNotification("Maksimum 6 favori eklenebilir.", "info");
            return;
        }
        if (city && !favorites.some(f => f.name === city)) {
            favorites.push({ name: city, temp: temp, desc: desc, icon: iconCode });
            localStorage.setItem('favoriteCities', JSON.stringify(favorites));
            renderFavorites();
            showNotification(`${city} eklendi!`, 'success');
        }
    });

    $(document).on('click', '.remove-fav', function(e) {
        e.stopPropagation();
        const city = $(this).data('city');
        favorites = favorites.filter(c => c.name !== city);
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        renderFavorites();
    });

    $(document).on('click', '.fav-card', function() {
        getFiveDayForecast($(this).data('city'));
    });

    // =================================================================
    // 5. ARAMA VE DETAYLAR
    // =================================================================
    $('#get-weather-btn').on('click', function() {
        const city = $('#city-input').val().trim();
        if (city) getFiveDayForecast(city);
    });

    $('#city-input').keypress(function(e) { if (e.which === 13) $('#get-weather-btn').click(); });

    function showNotification(message, type = 'success') {
        const $toast = $('#notification-toast');
        $toast.text(message).removeClass('success info').addClass(type).addClass('show');
        setTimeout(() => { $toast.removeClass('show'); }, 3000);
    }

    // KART TIKLAMA VE 24 SAAT ANALİZİ
    $(document).on('click', '.weather-card', function() {
        $('.weather-card').removeClass('active');
        $(this).addClass('active');

        const selectedDate = $(this).find('h6').text().trim();
        const $details = $('#weather-details-container');

        const dayData = rawDataList.filter(item => {
            const itemDate = new Date(item.dt_txt).toLocaleDateString('tr-TR', { 
                weekday: 'long', day: 'numeric', month: 'long' // Filtreleme için long ayarı
            }).trim();
            return itemDate === selectedDate;
        });

        if (dayData.length > 0) {
            let hourlyHtml = `
                <div class="card details-glass-card p-4 border-0 shadow-sm mb-5">
                    <h4 class="mb-4 text-center border-bottom pb-2">${selectedDate} - Tam Gün Analizi</h4>
                    <div class="row text-center mb-4">
                        <div class="col-4"><strong>Hissedilen</strong><br>${Math.round(dayData[0].main.feels_like)}°</div>
                        <div class="col-4"><strong>Nem</strong><br>%${dayData[0].main.humidity}</div>
                        <div class="col-4"><strong>Rüzgar</strong><br>${dayData[0].wind.speed} km/s</div>
                    </div>
                    <div class="d-flex flex-nowrap overflow-x-auto gap-3 pb-3" style="scrollbar-width: thin;">`;

            dayData.forEach(hour => {
                const time = hour.dt_txt.split(' ')[1].substring(0, 5);
                hourlyHtml += `
                    <div class="p-3 text-center hour-box rounded shadow-sm">
                        <small class="fw-bold d-block mb-1 text-primary">${time}</small>
                        <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" width="45">
                        <div class="fs-5 fw-bold mb-2">${Math.round(hour.main.temp)}°</div>
                        <div class="d-flex flex-column gap-1 border-top pt-2 mt-1" style="font-size: 0.7rem; opacity: 0.8;">
                            <span><i class="bi bi-droplets"></i> %${hour.main.humidity}</span>
                            <span><i class="bi bi-wind"></i> ${hour.wind.speed} m/s</span>
                        </div>
                    </div>`;
            });

            hourlyHtml += `</div></div>`;
            $details.html(hourlyHtml).hide().fadeIn(400);
            window.scrollTo({ top: $details.offset().top - 120, behavior: 'smooth' });
        }
    });
});
// CANLI SAAT FONKSİYONU
function startClock() {
    function updateClock() {
        const now = new Date();
        // Saati 14:30:05 formatında, Türkiye yerel saatine göre alır
        const timeStr = now.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        $('#live-clock').text(timeStr);
    }
    
    setInterval(updateClock, 1000); // Her saniye güncelle
    updateClock(); // Sayfa açılır açılmaz saati göster
}

// Fonksiyonu başlat
startClock();