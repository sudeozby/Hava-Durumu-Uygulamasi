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
});
// --- KÜBRA'NIN GÖREV ALANI: DİNAMİK HAVA DURUMU EFEKTLERİ ---

function createWeatherEffects(condition) {
    const $container = $('#weather-effects-container');
    
    // Yeni bir şehre tıklandığında önceki şehrin efektlerini temizle
    $container.empty(); 

    // API'den gelen durumu küçük harfe çevir
    const weather = condition.toLowerCase();

    if (weather.includes('rain')) {
        // Yağmurlu: 30 tane düşen yağmur damlası oluştur
        for (let i = 0; i < 30; i++) {
            let left = Math.random() * 100; // Ekranın rastgele yatay konumu
            let duration = Math.random() * 1 + 0.5; // Düşme hızı
            $container.append(`<div class="rain-drop" style="left:${left}vw; animation-duration:${duration}s"></div>`);
        }
    } 
    else if (weather.includes('cloud')) {
        // Bulutlu: 5 tane hareket eden bulut kümesi oluştur
        for (let i = 0; i < 5; i++) {
            let top = Math.random() * 50; // Ekranın üst yarısında rastgele konum
            let size = Math.random() * 200 + 100; // Rastgele boyut
            let duration = Math.random() * 20 + 10; // Kayma hızı
            $container.append(`<div class="cloud-particle" style="top:${top}%; width:${size}px; height:${size/2}px; animation-duration:${duration}s"></div>`);
        }
    }
    else if (weather.includes('clear')) {
        // Güneşli: Sağ üst köşeye güneş parlaması ekle
        $container.append('<div class="sun-glow"></div>');
    }
    else if (weather.includes('snow')) {
        // Karlı: 40 tane dönerek düşen kar tanesi oluştur
        for (let i = 0; i < 40; i++) {
            let left = Math.random() * 100;
            let duration = Math.random() * 3 + 2;
            $container.append(`<div class="snow-flake" style="left:${left}vw; animation-duration:${duration}s">❄</div>`);
        }
    }
}
