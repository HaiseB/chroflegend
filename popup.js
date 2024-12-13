document.addEventListener('DOMContentLoaded', function () {
  const selectElement = document.getElementById('champion-select');
  const loltheoryButton = document.getElementById("loltheory");
  const openSettingsButton = document.getElementById("openSettings");
  const loader = document.getElementById('loader');

  const profileImage = document.getElementById('profileImage');
  const summonerNameElement = document.getElementById('summonerName');
  const myOpggButton = document.getElementById('myOpgg');
  const picksContainer = document.getElementById('picks');

  let dataChampionNames = null;
  let dataRole = null;

  chrome.storage.sync.get(['summonerName', 'profilePictureLink', 'championNames', 'role'], function(data) {
    if (data.profilePictureLink) {
        profileImage.src = data.profilePictureLink;
    }

    if (data.summonerName && data.summonerName !== "") {
      const summonerName = data.summonerName.split('#')[0];
      summonerNameElement.textContent = summonerName;
      const myOpggLink = `https://www.op.gg/summoners/euw/${data.summonerName.replace('#', '-')}`;

      myOpggButton.addEventListener("click", function () {
        chrome.tabs.create({
          url: myOpggLink,
        });
      });
    } else {
      myOpggButton.classList.add('disabled');
    }

    if (data.championNames && data.role) {
      dataChampionNames = data.championNames;
      dataRole = data.role;

      renderChampionCards(data.championNames, data.role);
    }
  });

  selectElement.addEventListener('change', function () {
    const options = selectElement.options;
    for (let i = 0; i < options.length; i++) {
      options[i].style.display = '';
    }

    loader.classList.remove('d-none');
    picks.classList.add('d-none');

    renderChampionCards(dataChampionNames, dataRole, selectElement.value);
  });

  loltheoryButton.addEventListener("click", function () {
    chrome.tabs.create({
      url: "https://loltheory.gg/lol/statistics/champion-list",
    });
  });

  openSettingsButton.addEventListener("click", function () {
    chrome.tabs.create({
      url: chrome.runtime.getURL("webPage/settings.html"),
    });
  });

  async function renderChampionCards(championNames, role, selectElementValue = null) {
    picksContainer.innerHTML = '';

    for (const champion of championNames) {
      let winRate = '-';

      if (selectElementValue) {
        try {
          winRate = await withTimeout(
            fetchWinRateAgainst(champion, role, selectElementValue),
            500
          );
        } catch (error) {
          console.error(`Erreur ou timeout lors de la récupération du taux de victoire pour ${champion} contre ${selectElementValue}:`, error);
        }
      }

      const card = createChampionCard(champion, role, selectElementValue, winRate);
      picksContainer.appendChild(card);

      loader.classList.add('d-none');
      picks.classList.remove('d-none');
    }
  }
});

function createChampionCard(championName, role, selectElementValue, winRate) {
  const card = document.createElement('div');
  card.classList.add('card', 'border-primary', 'mb-3', 'mx-1');
  card.style.width = 'calc(50% - 20px)';

  const cardHeader = document.createElement('div');
  cardHeader.classList.add('card-header');
  cardHeader.innerHTML = `
    <img src="https://opgg-static.akamaized.net/meta/images/lol/14.14.1/champion/${championName}.png"
      alt="${championName}" class="rounded-circle me-2" size="36" height="36" width="36">
      ${selectElementValue ? `${championName} (${winRate}%)` : `${championName}`}
  `;

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');

  cardBody.innerHTML = `
    <p class="card-text">
      <button class="btn btn-success cntr-build-btn ${selectElementValue ? '' : 'disabled'}">
        Cntr build
      </button>
      <button class="btn btn-outline-primary base-build-btn">
        Base build
      </button>
    </p>
  `;

  card.appendChild(cardHeader);
  card.appendChild(cardBody);

  const cntrBuildBtn = cardBody.querySelector('.cntr-build-btn');
  const baseBuildBtn = cardBody.querySelector('.base-build-btn');

  if (selectElementValue) {
    cntrBuildBtn.addEventListener('click', () => {
      chrome.tabs.create({
        url: `https://www.op.gg/champions/${championName}/build/Top?target_champion=${selectElementValue}&type=ranked`,
      });
    });
  }

  baseBuildBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: `https://loltheory.gg/lol/champion/${championName.toLowerCase()}/build-runes/${role.toLowerCase()}`,
    });
  });

  return card;
}

function fetchWinRateAgainst(champion, role, targetChampion) {
  const url = `https://www.op.gg/champions/${champion}/build/${role}?target_champion=${targetChampion}&type=ranked`;

  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: false }, (tab) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            const winRateElement = document.querySelector(
              '.inner-box .inner-bottom:nth-child(3) :nth-child(2)'
            );
            return winRateElement ? winRateElement.textContent.trim() : null;
          },
        },
        (results) => {
          chrome.tabs.remove(tab.id); // Fermer l'onglet après récupération
          if (chrome.runtime.lastError || !results || !results[0].result) {
            reject(chrome.runtime.lastError || 'Aucune donnée trouvée.');
          } else {
            resolve(results[0].result);
          }
        }
      );
    });
  });
}