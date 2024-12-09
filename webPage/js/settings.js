$('#myModal').on('shown.bs.modal', function () {
    $('#myInput').trigger('focus')
})

// Assurez-vous que le document est prêt avant d'exécuter le script
document.addEventListener('DOMContentLoaded', function() {
    // Références aux éléments de formulaire
    const summonerNameInput = document.getElementById('summonerName');
    const profilePictureLinkInput = document.getElementById('porfilPictureLink');
    const roleSelect = document.getElementById('roleSelect');
    const championNameInput = document.getElementById('championName');
    const championList = document.querySelector('.list-group');

    // Charger les paramètres stockés au démarrage
    chrome.storage.sync.get(['summonerName', 'profilePictureLink', 'role', 'championNames'], function(data) {
        if (data.summonerName) {
            summonerNameInput.value = data.summonerName;
        }
        if (data.profilePictureLink) {
            profilePictureLinkInput.value = data.profilePictureLink;
        }
        if (data.role) {
            roleSelect.value = data.role;
        }
        if (data.championNames) {
            data.championNames.forEach(champion => {
                addChampionToList(champion);
            });
        }
    });

    // Sauvegarder les paramètres lorsque les champs changent
    summonerNameInput.addEventListener('change', function() {
        chrome.storage.sync.set({ summonerName: summonerNameInput.value });
    });

    profilePictureLinkInput.addEventListener('change', function() {
        chrome.storage.sync.set({ profilePictureLink: profilePictureLinkInput.value });
    });

    roleSelect.addEventListener('change', function() {
        chrome.storage.sync.set({ role: roleSelect.value });
    });

    // Ajouter un champion à la liste
    document.querySelector('.btn-success').addEventListener('click', function() {
        const championName = championNameInput.value.trim();
        if (championName) {
            addChampionToList(championName);
            chrome.storage.sync.get(['championNames'], function(data) {
                const championNames = data.championNames || [];
                championNames.push(championName);
                chrome.storage.sync.set({ championNames: championNames });
            });
            championNameInput.value = '';
        }
    });

    // Fonction pour ajouter un champion à la liste
    function addChampionToList(championName) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'col-12', 'd-flex', 'justify-content-between');
        listItem.innerHTML = `
            <div>
                <img src="https://opgg-static.akamaized.net/meta/images/lol/14.14.1/champion/${championName}.png" alt="${championName}" class="rounded-circle me-2" size="36" height="36" width="36">
                <span>${championName}</span>
            </div>
            <img src="../assets/xmark-solid.svg" alt="cancel Icon" width="24" height="24" class="remove-champion">
        `;
        championList.appendChild(listItem);

        // Ajouter l'événement de suppression
        listItem.querySelector('.remove-champion').addEventListener('click', function() {
            championList.removeChild(listItem);
            chrome.storage.sync.get(['championNames'], function(data) {
                const championNames = data.championNames || [];
                const newChampionNames = championNames.filter(name => name !== championName);
                chrome.storage.sync.set({ championNames: newChampionNames });
            });
        });
    }
});
