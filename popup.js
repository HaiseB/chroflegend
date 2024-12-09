document.addEventListener('DOMContentLoaded', function () {
  const selectElement = document.getElementById('champion-select');
  const filterInput = document.getElementById('filter-input');
  const loltheoryButton = document.getElementById("loltheory");
  const openSettingsButton = document.getElementById("openSettings");
  const loader = document.getElementById('loader');
  const picks = document.getElementById('picks');

  const profileImage = document.getElementById('profileImage');
  const summonerNameElement = document.getElementById('summonerName');
  const myOpggLink = document.getElementById('myOpgg');
  const picksContainer = document.getElementById('picks');

  chrome.storage.sync.get(['summonerName', 'profilePictureLink', 'championNames', 'role'], function(data) {
    if (data.profilePictureLink) {
        profileImage.src = data.profilePictureLink;
    }
    if (data.summonerName) {
        const summonerName = data.summonerName.split('#')[0];
        summonerNameElement.textContent = summonerName;
        myOpggLink.href = `https://www.op.gg/summoners/euw/${data.summonerName.replace('#', '-')}`;
    }

    if (data.championNames && data.role) {
      renderChampionCards(data.championNames, data.role);
    }
  });

  selectElement.addEventListener('focus', function () {
    filterInput.style.display = 'block';
    filterInput.focus();
  });

  filterInput.addEventListener('blur', function () {
    setTimeout(() => {
      filterInput.style.display = 'none';
    }, 100);
  });

  filterInput.addEventListener('input', function () {
    console.log("filterInput.addEventListener")
    const filter = filterInput.value.toLowerCase();
    const options = selectElement.options;
    for (let i = 0; i < options.length; i++) {
      const optionText = options[i].text.toLowerCase();
      if (optionText.includes(filter)) {
        options[i].style.display = '';
        options[i].addEventListener('click', function () {
          selectElement.value = options[i].value;
          selectElement.dispatchEvent(new Event('change'));

          // Régénérer les cartes ici en utilisant le filtre sélectionné
          chrome.storage.sync.get(['championNames', 'role'], function(data) {
            if (data.championNames && data.role) {
              renderChampionCards([options[i].value], data.role, filterInput.value);
            }
          });

          filterInput.style.display = 'none';
        });
      } else {
        options[i].style.display = 'none';
      }
    }
  });

  selectElement.addEventListener('change', function () {
    filterInput.value = '';
    const options = selectElement.options;
    for (let i = 0; i < options.length; i++) {
      options[i].style.display = '';
    }

    setTimeout(() => {
      filterInput.style.display = 'none';
    }, 100);

    //loader.classList.remove('d-none');
    //picks.classList.add('d-none');
  });

  loltheoryButton.addEventListener("click", function () {
    chrome.tabs.create({
      url: "https://loltheory.gg/",
    });
  });

  openSettingsButton.addEventListener("click", function () {
    chrome.tabs.create({
      url: chrome.runtime.getURL("webPage/settings.html"),
    });
  });

  // Fonction pour régénérer les cartes
  function renderChampionCards(championNames, role, filterValue = null) {
    picksContainer.innerHTML = ''; // Vide le conteneur avant de régénérer les cartes
    championNames.forEach(champion => {
      const card = createChampionCard(champion, role, filterValue);
      picksContainer.appendChild(card);
    });
  }
});

function createChampionCard(championName, role, filterValue) {
  const card = document.createElement('div');
  card.classList.add('card', 'border-primary', 'mb-3', 'mx-1');
  card.style.width = 'calc(50% - 20px)';

  const cardHeader = document.createElement('div');
  cardHeader.classList.add('card-header');
  cardHeader.innerHTML = `
      <img src="https://opgg-static.akamaized.net/meta/images/lol/14.14.1/champion/${championName}.png"
          alt="${championName}" class="rounded-circle me-2" size="36" height="36" width="36">
          ${filterValue ? `${championName} (54%)` : `${championName}`}
  `;

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  if (filterValue) {
      cardBody.innerHTML = `
          <p class="card-text">
              <button type="button" class="btn btn-success">Cntr build</button>
              <a href="https://www.op.gg/champions/${championName}/build/${role.toLowerCase()}?target_champion=${filterValue}" class="btn btn-outline-primary">Base build</a>
          </p>
      `;
  } else {
      cardBody.innerHTML = `
          <p class="card-text">
              <button type="button" class="btn btn-success disabled">Cntr build</button>
              <a href="https://www.op.gg/champions/${championName}/build/${role.toLowerCase()}" class="btn btn-outline-primary">Base build</a>
          </p>
      `;
  }

  card.appendChild(cardHeader);
  card.appendChild(cardBody);

  return card;
}
