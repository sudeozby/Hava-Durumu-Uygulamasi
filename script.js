$(document).ready(function() {
    const apiKey = '5c03ce0373390aff630bcb6f7aac303b';
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];
    let fullForecastList = []; // Grafik için veriyi saklıyoruz
    let myChart = null;

    applyThemeByTime();
    renderFavorites();

    // 1. TEMA DEĞİŞTİRME
    $('#theme-toggle-btn').on('click', function() {
        $('body').toggleClass('light-theme dark-theme');
        const isDark = $('body').hasClass('dark-theme');
        $(this).html(isDark ? '<i class="bi bi-sun-fill text-warning"></i> Aydınlık' : '<i class="bi bi-moon-stars-fill"></i> Karanlık');
    });

    function applyThemeByTime() {
        const hour = new Date().getHours();
        if (hour < 6 || hour >= 18) $('body').addClass('dark-theme').removeClass('light-theme');
    }

    // 2. PROFESYONEL BİLDİRİM (TOAST)
    function notify(msg) {
        if(!$('#custom-toast').length) $('body').append('<div id="custom-toast" class="toast-message"></div>');
        $('#custom-toast').text(msg).addClass('show');
        setTimeout(() => $('#custom-toast').removeClass('show'), 3000);
    }

    // 3. GRAFİK MOTORU
    function drawChart(selectedDate) {
        const filteredData = fullForecastList.filter(item => {
            return new Date(item.dt * 1000).toLocaleDateString('tr-TR', { weekday: 'long' }) === selectedDate.split(',')[0];
        });

        const labels = filteredData.map(i => i.dt_txt.split(' ')[1].substring(0, 5));
        const temps = filteredData.map(i => i.main.temp);

        if (myChart) myChart.destroy();
        const ctx = document.getElementById('tempChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{ label: 'Sıcaklık (°C)', data: temps, borderColor: '#6c5ce7', tension: 0.4, fill: true, backgroundColor: 'rgba(108, 92, 231, 0.1)' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        $('#chart-section').fadeIn();
    }

    // 4. VERİ ÇEKME VE KART TIKLAMA
    function getFiveDayForecast(city) {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=tr`;
        $.get(url, function(data) {
            fullForecastList = data.list; // Tüm veriyi sakla
            const temizVeri = processForecastData(data.list);
            displayForecast(temizVeri, data.city.name);
            
            // İlk günün efekti ve grafiği
            createWeatherEffects(data.list[0].weather[0].main);
            drawChart(temizVeri[0].tarih);
            $('#add-to-fav-btn').show();
        });
    }

    function displayForecast(daily, cityName) {
        const container = $('#forecast-cards-container').empty();
        $('#forecast-city-name').text(cityName).show();
        daily.forEach((day, idx) => {
            container.append(`
                <div class="col">
                    <div class="card weather-card text-center p-3 h-100 glass-card border-0 ${idx===0?'active':''}" data-date="${day.tarih}" data-cond="${day.mainCond}">
                        <h6 class="small">${day.tarih}</h6>
                        <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" class="mx-auto" width="60">
                        <div class="fw-bold">${day.enYuksek}°</div>
                        <p class="small mb-0 text-capitalize">${day.durum}</p>
                    </div>
                </div>
            `);
        });
    }

    // KART TIKLAMA OLAYI
    $(document).on('click', '.weather-card', function() {
        $('.weather-card').removeClass('active');
        $(this).addClass('active');
        drawChart($(this).data('date'));
        createWeatherEffects($(this).data('cond'));
        notify("Hava durumu detayları güncellendi.");
    });

    // Favori İşlemleri
    $('#add-to-fav-btn').click(function() {
        const city = $('#forecast-city-name').text();
        if(!favorites.includes(city)) {
            favorites.push(city);
            localStorage.setItem('favoriteCities', JSON.stringify(favorites));
            renderFavorites();
            notify(`${city} Favorilere Eklendi! ✨`);
        }
    });

    // Arama Tetikleyici
    $('#get-weather-btn').click(() => {
        const city = $('#city-input').val();
        if(city) getForecast(city);
    });

    // ... (Zeynep'in processForecastData ve renderFavorites fonksiyonlarını buraya ekle)

    // KÜBRA NIN EFEKTLERİ
    function createWeatherEffects(condition) {
        const $c = $('#weather-effects-container').empty();
        const w = condition.toLowerCase();
        if (w.includes('rain')) {
            for(let i=0; i<30; i++) $c.append(`<div class="rain-drop" style="left:${Math.random()*100}vw"></div>`);
        } else if (w.includes('clear')) {
            $c.append('<div class="sun-glow"></div>');
        } else if (w.includes('thunder') || w.includes('storm')) {
            $c.append('<div class="lightning-flash"></div>');
        }
    }

    function processForecastData(list) {
        const daily = {};
        list.forEach(i => {
            const date = i.dt_txt.split(' ')[0];
            if (!daily[date]) daily[date] = i;
        });
        return Object.values(daily).slice(0, 5).map(i => ({
            tarih: new Date(i.dt * 1000).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'short' }),
            enYuksek: Math.round(i.main.temp),
            durum: i.weather[0].description,
            icon: i.weather[0].icon,
            mainCond: i.weather[0].main
        }));
    }

    function renderFavorites() {
        const container = $('#favorite-cities-container').empty();
        favorites.forEach(city => {
            container.append(`<div class="col"><div class="card p-3 glass-card fav-card" onclick="getForecast('${city}')">${city}</div></div>`);
        });
    }

    window.getForecast = getFiveDayForecast; // Favori tıklaması için
});