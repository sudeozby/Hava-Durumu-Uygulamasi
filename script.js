$(document).ready(function() {
    localStorage.clear(); // Tüm eski bozuk verileri siler
    // =================================================================
    // GENEL DEĞİŞKENLER VE BAŞLANGIÇ AYARLARI
    // =================================================================
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b'; // OpenWeatherMap API Anahtarı
    let rawDataList = []; // Gelen tüm veriyi burada yedekleyeceğiz
    let currentIcon = ''; // O anki ikon kodunu hafızada tutar
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || []; // Kayıtlı favorileri çeker

    // Sayfa yüklendiğinde temayı ayarla ve favori listesini ekrana bas
    applyThemeByTime();
    renderFavorites();


    // =================================================================
    // 1. TEMA YÖNETİMİ (Sude'nin Görevi)
    // =================================================================
    
    // Saate veya kullanıcının tercihine göre temayı belirler
    function applyThemeByTime() {
        const hour = new Date().getHours();
        const savedTheme = localStorage.getItem('user-preference');
        
        if (savedTheme) {
            $('body').addClass(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
        } else {
            // Sabah 6 ile akşam 18 arası aydınlık, diğer saatler karanlık
            const theme = (hour >= 6 && hour < 18) ? 'light-theme' : 'dark-theme';
            $('body').addClass(theme);
        }
    }

    // Tema değiştirme butonuna tıklandığında çalışır
    $('#theme-toggle-btn').on('click', function() {
        const $body = $('body');
        $body.toggleClass('light-theme dark-theme');
        
        // Yeni temayı hafızaya kaydet
        const currentTheme = $body.hasClass('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('user-preference', currentTheme);
        
        // Butonun içindeki yazıyı ve ikonu değiştir
        $(this).html(currentTheme === 'dark' ? '<i class="bi bi-sun-fill text-warning"></i> Aydınlık' : '<i class="bi bi-moon-stars-fill"></i> Karanlık');
    });


  // 2. VERİ ÇEKME VE İŞLEME MOTORU (Zeynep & Sude - Güncellenmiş)
    function getFiveDayForecast(city) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
        $('#get-weather-btn').text('Aranıyor...').prop('disabled', true);

        $.ajax({
            url: url,
            method: 'GET',
            success: function(data) {
                // KRİTİK: Veriyi buraya kaydediyoruz ki tıklayınca detaylar gelsin
                rawDataList = data.list; 
                
                const temizVeri = processForecastData(data.list);
                displayForecastToHTML(temizVeri, data.city.name);
                
                // İlk günün durumuna göre efekti tetikle
                createWeatherEffects(data.list[0].weather[0].main); 
                
                $('#add-to-fav-btn').fadeIn();
                $('#weather-details-container').hide(); // Yeni aramada eski paneli kapat
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
            // İkon belirleme mantığı
            let finalIconHtml = (rawIcon === '01d') ? 
                `<img src="https://openweathermap.org/img/wn/01d@2x.png" class="mx-auto" width="70">` :
                (rawIcon === '01n' || rawIcon === '02n') ? 
                `<i class="bi bi-moon-stars-fill text-moon fs-1 mx-auto my-3 d-block"></i>` :
                `<img src="https://openweathermap.org/img/wn/${rawIcon}@2x.png" class="mx-auto" width="70">`;

            return {
                tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }),
                enYuksek: Math.round(Math.max(...daily[date].temps)),
                durum: daily[date].desc[0],
                ikonHtml: finalIconHtml,
                mainCond: daily[date].mainCond[0]
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
    // 3. ANİMASYON VE EFEKT MOTORU (Kübra'nın Görevi)
    // =================================================================
    
    // Gelen hava durumuna göre ekranda yağmur, kar veya yıldız oluşturur
   function createWeatherEffects(condition) {
    const $c = $('#weather-effects-container').empty();
    const w = condition.toLowerCase();
    
    // Eski sınıfları tertemiz yapalım
    $('body').removeClass('rainy-bg sunny-bg cloudy-bg');

    if (w.includes('rain')) {
        $('body').addClass('rainy-bg');
        // ... yağmur damlası kodları ...
    } else if (w.includes('clear')) {
        $('body').addClass('sunny-bg');
        // ... güneş efekti kodları ...
    } else {
        $('body').addClass('cloudy-bg');
    }
}


    // =================================================================
    // 4. FAVORİ ŞEHİRLER YÖNETİMİ (Beyza & Zeynep)
    // =================================================================

    // Hafızadaki favori şehirleri ekrana kart olarak çizer
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
                            <button class="btn btn-link text-danger p-0 remove-fav" data-city="${fav.name}">
                                <i class="bi bi-x-circle"></i>
                            </button>
                        </div>
                        <img src="https://openweathermap.org/img/wn/${fav.icon}@2x.png" class="fav-icon-img" alt="${fav.desc}" onerror="this.src='https://openweathermap.org/img/wn/01d@2x.png'">
                        <div class="small mt-2">${fav.temp} - ${fav.desc}</div>
                    </div>
                </div>
            `);
        });
    }

    // Yıldızlı "Favorilere Ekle" butonuna tıklandığında çalışır
    $('#add-to-fav-btn').on('click', function() {
        const city = $('#forecast-city-name').text();
        
        // Ekranda halihazırda görünen ilk günden verileri (derece, durum, ikon) çeker
        const temp = $('#forecast-cards-container .fw-bold').first().text();
        const desc = $('#forecast-cards-container .small').first().text();
        const iconSrc = $('#forecast-cards-container img').first().attr('src');
        const iconCode = iconSrc ? iconSrc.split('/wn/')[1].split('@')[0] : '01d';

        // 6 şehir limiti kontrolü
        if (favorites.length >= 6 && !favorites.some(f => f.name === city)) {
            showNotification("Maksimum 6 favori şehir ekleyebilirsiniz.", "info");
            return;
        }

        // Şehir listede yoksa ekler
        if (city && !favorites.some(f => f.name === city)) {
            favorites.push({ name: city, temp: temp, desc: desc, icon: iconCode });
            localStorage.setItem('favoriteCities', JSON.stringify(favorites));
            
            renderFavorites(); // Arayüzü güncelle
            showNotification(`${city} favorilere eklendi!`, 'success');
        } else {
            showNotification("Zaten favorilerinizde!", "info");
        }
    });

    // Favori kartının kendisine (div) tıklandığında o şehri aratır
    $(document).on('click', '.fav-card', function() {
        getFiveDayForecast($(this).data('city'));
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Sayfayı yukarı kaydır
    });

    // Favori kartındaki "X" silme butonuna tıklandığında şehri siler
    $(document).on('click', '.remove-fav', function(e) {
        e.stopPropagation(); // Karta tıklanmasını engelleyip sadece silmeyi tetikler
        const city = $(this).data('city');
        
        favorites = favorites.filter(c => c.name !== city);
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        
        renderFavorites();
        showNotification("Şehir listeden kaldırıldı.", "info");
    });


    // =================================================================
    // 5. ARAMA İŞLEMLERİ VE BİLDİRİMLER
    // =================================================================

    // "Göster" butonuna tıklandığında aramayı başlatır
    $('#get-weather-btn').on('click', function() {
        const city = $('#city-input').val().trim();
        if (city) getFiveDayForecast(city);
    });

    // Arama kutusundayken "Enter" tuşuna basıldığında aramayı başlatır
    $('#city-input').keypress(function(event) {
        if (event.which === 13) { 
            event.preventDefault(); 
            $('#get-weather-btn').click(); 
        }
    });

    // Sağ üstte çıkan renkli bildirim baloncuklarını (Toast) yönetir
    function showNotification(message, type = 'success') {
        const $toast = $('#notification-toast');
        
        // İçeriği ve rengi ayarla, ekranda göster
        $toast.text(message).removeClass('success info').addClass(type).addClass('show');

        // 3 saniye sonra otomatik gizle
        setTimeout(() => {
            $toast.removeClass('show');
        }, 3000);
    }
// KARTLARA TIKLANDIĞINDA DETAYLARI AÇAN GARANTİLİ FONKSİYON
// KARTLARA TIKLANDIĞINDA TÜM GÜNÜ (00:00 - 24:00) AÇAN FONKSİYON
    $(document).on('click', '.weather-card', function() {
        $('.weather-card').removeClass('active');
        $(this).addClass('active');

        const selectedDate = $(this).find('h6').text().trim();
        const $details = $('#weather-details-container');

        const dayData = rawDataList.filter(item => {
            const itemDate = new Date(item.dt_txt).toLocaleDateString('tr-TR', { 
                weekday: 'long', day: 'numeric', month: 'long' 
            }).trim();
            return itemDate === selectedDate;
        });

        if (dayData.length > 0) {
            // Sude, burada artik .slice kullanmiyoruz, 
            // Boylece sabah 00'dan aksam 00'a kadar olan tum bloklar listeleniyor.

            let hourlyHtml = `
            
                <div class="card glass-card p-4 border-0 shadow-sm mb-5">
                    <h4 class="mb-4 text-center border-bottom pb-2">${selectedDate} - Tam Gün Analizi</h4>
                    <div class="row text-center mb-4">
                        <div class="col-4"><strong>Hissedilen</strong><br>${Math.round(dayData[0].main.feels_like)}°</div>
                        <div class="col-4"><strong>Nem</strong><br>%${dayData[0].main.humidity}</div>
                        <div class="col-4"><strong>Rüzgar</strong><br>${dayData[0].wind.speed} km/s</div>
                    </div>
                   
                   <div class="d-flex flex-nowrap overflow-x-auto gap-3 pb-3" style="scrollbar-width: thin; -webkit-overflow-scrolling: touch;">`;

            dayData.forEach(hour => {
                const time = hour.dt_txt.split(' ')[1].substring(0, 5);
                const temp = Math.round(hour.main.temp);
                const humidity = hour.main.humidity;
                const wind = hour.wind.speed;
                hourlyHtml += `
                   <div class="p-3 text-center hour-box rounded shadow-sm">
                        <small class="fw-bold d-block mb-1 text-primary">${time}</small>
                        <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" width="45">
                        <div class="fs-5 fw-bold mb-2">${temp}°</div>
                        
                        <div class="d-flex flex-column gap-1 border-top pt-2 mt-1" style="font-size: 0.7rem; opacity: 0.8;">
                            <span><i class="bi bi-droplets"></i> %${humidity}</span>
                            <span><i class="bi bi-wind"></i> ${wind} m/s</span>
                        </div>
                    </div>`;
            });

            hourlyHtml += `</div></div>`;
            $details.html(hourlyHtml).hide().fadeIn(400);
            
            window.scrollTo({ top: $details.offset().top - 120, behavior: 'smooth' });
        }
    });
    });