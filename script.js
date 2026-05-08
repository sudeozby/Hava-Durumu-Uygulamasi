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