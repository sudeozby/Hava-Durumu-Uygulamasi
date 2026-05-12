$(document).ready(function() {
    localStorage.clear(); // Tüm eski bozuk verileri siler
    // =================================================================
    // GENEL DEĞİŞKENLER VE BAŞLANGIÇ AYARLARI
    // =================================================================
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b'; // OpenWeatherMap API Anahtarı
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


    // =================================================================
    // 2. VERİ ÇEKME VE İŞLEME MOTORU (Zeynep'in Görevi)
    // =================================================================
    
    // API'den 5 günlük hava durumu verisini çeken ana fonksiyon
    // --- script.js İçinde getFiveDayForecast Fonksiyonunu Bul ve Güncelle ---

// 2. VERİ ÇEKME VE İŞLEME MOTORU (Zeynep)
function getFiveDayForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`;
    
    // Veri gelirken butonu pasifleştir
    $('#get-weather-btn').text('Aranıyor...').prop('disabled', true);

    $.ajax({
        url: url,
        method: 'GET',
        success: function(data) {
            // Veriyi temizle, HTML'e bas ve efektleri tetikle
            const temizVeri = processForecastData(data.list);
            displayForecastToHTML(temizVeri, data.city.name);
            
            // Burası önemli: Efektleri tetiklerken ikon kodunu da gönder
            createWeatherEffects(data.list[0].weather[0].main, temizVeri[0].ikon); 
            
            $('#add-to-fav-btn').fadeIn(); // Favoriye ekle butonunu göster
        },
        error: function() { 
            // Amatör ALERT yerine profesyonel NOTIFY kullan
            showNotify("Şehir bulunamadı! Geçerli bir şehir girin.", "info"); 
        },
        complete: function() {
            // İşlem bitince butonu eski haline getir
            $('#get-weather-btn').text('Göster').prop('disabled', false);
        }
    });
}


// --- processForecastData Fonksiyonunda İkon Belirleme Mantığını Değiştir ---

// 40 adet 3 saatlik veriyi, 5 günlük net bir özete çevirir
function processForecastData(list) {
    const daily = {};
    
    // Gelen verileri tarihlere göre torbalara ayırır
    list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!daily[date]) daily[date] = { temps: [], icons: [], desc: [], mainCond: [] };
        
        daily[date].temps.push(item.main.temp);
        daily[date].icons.push(item.weather[0].icon);
        daily[date].desc.push(item.weather[0].description);
        daily[date].mainCond.push(item.weather[0].main);
    });
    
    // Her torbadaki en yüksek/düşük sıcaklıkları bularak son listeyi oluşturur
    return Object.keys(daily).slice(0, 5).map(date => {
        const rawIcon = daily[date].icons[0]; // API'den gelen ham ikon kodu (01d, 01n vb.)
        let finalIconHtml;

        // --- BU KISMI DİKKATLİCE YAPIŞTIR (İkon Eşleştirme) ---
        // Gündüz Açık (01d) -> Güneş İkonu (API'den imaj)
        if (rawIcon === '01d') {
            finalIconHtml = `<img src="https://openweathermap.org/img/wn/01d@2x.png" class="mx-auto" width="70" alt="Güneşli">`;
        } 
        // Geceleri Açık (01n) veya Hafif Bulutlu Gece (02n) -> Hilal (Bootstrap İkonu)
        else if (rawIcon === '01n' || rawIcon === '02n') {
            finalIconHtml = `<i class="bi bi-moon-stars-fill text-moon fs-1 mx-auto my-3" title="Açık Gece"></i>`;
        } 
        // Diğer durumlar (Yağmur, Kar, Çok Bulutlu vb.) -> API'den gelen varsayılan imajı kullan
        else {
            finalIconHtml = `<img src="https://openweathermap.org/img/wn/${rawIcon}@2x.png" class="mx-auto" width="70" alt="${daily[date].desc[0]}">`;
        }
        // -----------------------------------------------------

        return {
            tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
            enYuksek: Math.round(Math.max(...daily[date].temps)),
            durum: daily[date].desc[0],
            ikonHtml: finalIconHtml, // Artık ham kodu değil, hazır HTML'i gönderiyoruz
            mainCond: daily[date].mainCond[0]
        };
    });
}


// --- displayForecastToHTML Fonksiyonunu HTML Şablonunu Güncelle ---

// Temizlenmiş 5 günlük listeyi arayüzdeki (HTML) kartlara dönüştürür
// 2. VERİ ÇEKME VE İŞLEME MOTORU (Zeynep)



// --- processForecastData Fonksiyonunda İkon Belirleme Mantığını Değiştir ---

// 40 adet 3 saatlik veriyi, 5 günlük net bir özete çevirir
function processForecastData(list) {
    const daily = {};
    
    // Gelen verileri tarihlere göre torbalara ayırır
    list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!daily[date]) daily[date] = { temps: [], icons: [], desc: [], mainCond: [] };
        
        daily[date].temps.push(item.main.temp);
        daily[date].icons.push(item.weather[0].icon);
        daily[date].desc.push(item.weather[0].description);
        daily[date].mainCond.push(item.weather[0].main);
    });
    
    // Her torbadaki en yüksek/düşük sıcaklıkları bularak son listeyi oluşturur
    return Object.keys(daily).slice(0, 5).map(date => {
        const rawIcon = daily[date].icons[0]; // API'den gelen ham ikon kodu (01d, 01n vb.)
        let finalIconHtml;

        // --- BU KISMI DİKKATLİCE YAPIŞTIR (İkon Eşleştirme) ---
        // Gündüz Açık (01d) -> Güneş İkonu (API'den imaj)
        if (rawIcon === '01d') {
            finalIconHtml = `<img src="https://openweathermap.org/img/wn/01d@2x.png" class="mx-auto" width="70" alt="Güneşli">`;
        } 
        // Geceleri Açık (01n) veya Hafif Bulutlu Gece (02n) -> Hilal (Bootstrap İkonu)
        else if (rawIcon === '01n' || rawIcon === '02n') {
            finalIconHtml = `<i class="bi bi-moon-stars-fill text-moon fs-1 mx-auto my-3" title="Açık Gece"></i>`;
        } 
        // Diğer durumlar (Yağmur, Kar, Çok Bulutlu vb.) -> API'den gelen varsayılan imajı kullan
        else {
            finalIconHtml = `<img src="https://openweathermap.org/img/wn/${rawIcon}@2x.png" class="mx-auto" width="70" alt="${daily[date].desc[0]}">`;
        }
        // -----------------------------------------------------

        return {
            ttarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
        enYuksek: Math.round(Math.max(...daily[date].temps)),
        durum: daily[date].desc[0],
        ikonKodu: daily[date].icons[0], // <--- AY İÇİN ŞART!
        mainCond: daily[date].mainCond[0]
        };
    });
}


// --- displayForecastToHTML Fonksiyonunu HTML Şablonunu Güncelle ---

// Temizlenmiş 5 günlük listeyi arayüzdeki (HTML) kartlara dönüştürür

function displayForecastToHTML(dailyForecasts, cityName) {
    const $container = $('#forecast-cards-container').empty();
    $('#forecast-city-name').text(cityName).show();
    
    dailyForecasts.forEach(day => {
        let ikonHtml = '';
        // Gece ('n' harfi varsa) ve Hava Açık ('Clear') ise Ay koy
        if (day.ikonKodu && day.ikonKodu.includes('n') && day.mainCond === 'Clear') {
            ikonHtml = `<i class="bi bi-moon-stars-fill text-moon fs-1 mx-auto my-3"></i>`;
        } else {
            ikonHtml = `<img src="https://openweathermap.org/img/wn/${day.ikonKodu}@2x.png" class="mx-auto" width="70">`;
        }

        $container.append(`
            <div class="col">
                <div class="card weather-card text-center p-3 h-100 glass-card border-0">
                    <h6>${day.tarih}</h6>
                    ${ikonHtml} 
                    <div class="fw-bold">${day.enYuksek}°</div>
                    <p class="small text-capitalize mb-0">${day.durum}</p>
                </div>
            </div>
        `);
    });
}
    // 40 adet 3 saatlik veriyi, 5 günlük net bir özete çevirir
    function processForecastData(list) {
        const daily = {};
        
        // Gelen verileri tarihlere göre torbalara ayırır
        list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!daily[date]) daily[date] = { temps: [], icons: [], desc: [], mainCond: [] };
            
            daily[date].temps.push(item.main.temp);
            daily[date].icons.push(item.weather[0].icon);
            daily[date].desc.push(item.weather[0].description);
            daily[date].mainCond.push(item.weather[0].main);
        });
        
        // Her torbadaki en yüksek/düşük sıcaklıkları bularak son listeyi oluşturur
        return Object.keys(daily).slice(0, 5).map(date => ({
            tarih: new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
            enYuksek: Math.round(Math.max(...daily[date].temps)),
            durum: daily[date].desc[0],
            ikon: daily[date].icons[0],
            mainCond: daily[date].mainCond[0]
        }));
    }

    // Temizlenmiş 5 günlük listeyi arayüzdeki (HTML) kartlara dönüştürür
    


    // =================================================================
    // 3. ANİMASYON VE EFEKT MOTORU (Kübra'nın Görevi)
    // =================================================================
    
    // Gelen hava durumuna göre ekranda yağmur, kar veya yıldız oluşturur
   // =================================================================
// 3. ANİMASYON VE EFEKT MOTORU (Kübra'nın Görevi - DÜZELTİLDİ)
// =================================================================

function createWeatherEffects(condition, iconCode) {
    const $c = $('#weather-effects-container').empty();
    const w = condition.toLowerCase();

    // Eski arkaplanları temizle
    $('body').removeClass('rainy-bg sunny-bg cloudy-bg');

    // A) YAĞMUR EFEKTİ
    if (w.includes('rain')) {
        $('body').addClass('rainy-bg');
        for(let i=0; i<80; i++) {
            $c.append(`<div class="rain-drop" style="left:${Math.random()*100}vw; animation-duration:${Math.random()+0.5}s; animation-delay:${Math.random()}s"></div>`);
        }
    } 
    // B) GÜNEŞLİ / AÇIK GECE EFEKTİ
    else if (w.includes('clear')) {
        if (iconCode && iconCode.includes('n')) {
            // Gece ise yıldızlar (isteğe bağlı eklenebilir)
        } else {
            $('body').addClass('sunny-bg');
        }
    } 
    // C) BULUTLU
    else if (w.includes('cloud')) {
        $('body').addClass('cloudy-bg');
    }
    function createWeatherEffects(condition, iconCode) {
    const $c = $('#weather-effects-container').empty();
    const w = condition.toLowerCase();

    $('body').removeClass('rainy-bg sunny-bg cloudy-bg');

    // A) YAĞMUR EFEKTİ
    if (w.includes('rain')) {
        $('body').addClass('rainy-bg');
        for(let i=0; i<80; i++) {
            $c.append(`<div class="rain-drop" style="left:${Math.random()*100}vw; animation-duration:${Math.random()+0.5}s; animation-delay:${Math.random()}s"></div>`);
        }
    } 
    // B) GÜNEŞLİ / AÇIK HAVA
    else if (w.includes('clear')) {
        if (iconCode && !iconCode.includes('n')) {
            $('body').addClass('sunny-bg');
            // GÜNEŞ: Ekrana bir güneş objesi ekliyoruz
            $c.append('<div class="sun-effect"><div class="sun-rays"></div></div>');
        } else {
            // Gece ise yıldızlar oluştur
            for(let i=0; i<40; i++) {
                $c.append(`<div class="star" style="top:${Math.random()*100}vh; left:${Math.random()*100}vw; animation-delay:${Math.random()*2}s"></div>`);
            }
        }
    } 
    // C) BULUTLU HAVA
    else if (w.includes('cloud')) {
        $('body').addClass('cloudy-bg');
        // BULUTLAR: Ekranda yavaşça yüzen 5-6 büyük bulut katmanı
        for(let i=0; i<6; i++) {
            $c.append(`<div class="cloud-particle" style="top:${10 + Math.random()*40}vh; animation-duration:${20 + Math.random()*10}s; animation-delay:${-Math.random()*20}s"></div>`);
        }
    }
}
}

// AY'IN GÖZÜKMESİ İÇİN: 258. satırdaki displayForecastToHTML fonksiyonunu bununla değiştir
function displayForecastToHTML(dailyForecasts, cityName) {
    const $container = $('#forecast-cards-container').empty();
    $('#forecast-city-name').text(cityName).show();

    dailyForecasts.forEach(day => {
        let ikonHtml = '';
        // Gece ('n' harfi) ve Hava Açık ('Clear') ise Ay koy
        if (day.ikon && day.ikon.includes('n') && day.mainCond === 'Clear') {
            ikonHtml = `<i class="bi bi-moon-stars-fill text-moon fs-1 mx-auto my-3"></i>`;
        } else {
            ikonHtml = `<img src="https://openweathermap.org/img/wn/${day.ikon}@2x.png" class="mx-auto" width="70">`;
        }

        $container.append(`
            <div class="col">
                <div class="card weather-card text-center p-3 h-100 glass-card" data-cond="${day.mainCond}">
                    <h6>${day.tarih}</h6>
                    ${ikonHtml}
                    <div class="fw-bold">${day.enYuksek}°</div>
                    <p class="small text-capitalize mb-0">${day.durum}</p>
                </div>
            </div>
        `);
    });
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
});