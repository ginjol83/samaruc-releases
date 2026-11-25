(function () {
  'use strict';

  var api = 'https://api.github.com/repos/ginjol83/samaruc-releases/releases?per_page=30';
  var statusEl = document.getElementById('status');
  var latestBadge = document.getElementById('latest-badge');
  var latestCard = document.getElementById('latest-card');
  var history = document.getElementById('history');

  function createElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text !== undefined && text !== null) {
      node.textContent = text;
    }
    return node;
  }

  function formatDate(value) {
    if (!value) {
      return 'fecha desconocida';
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'fecha desconocida';
    }
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  function assetPriority(name) {
    var lower = name.toLowerCase();
    if (lower.endsWith('.msi')) return 0;
    if (lower.endsWith('.exe')) return 1;
    if (lower.endsWith('.zip')) return 2;
    if (lower.endsWith('.jar')) return 3;
    return 4;
  }

  function assetLabel(name) {
    var lower = name.toLowerCase();
    if (lower.endsWith('.msi')) return 'Instalador MSI (Windows)';
    if (lower.endsWith('.exe')) return 'Instalador EXE (Windows)';
    if (lower.endsWith('.zip')) return 'Paquete ZIP (Windows)';
    if (lower.endsWith('.jar')) return 'JAR ejecutable (Java 17+)';
    return 'Descargar ' + name;
  }

  function addDownloads(container, assets) {
    if (!assets || assets.length === 0) {
      container.appendChild(createElement('p', 'release-date', 'Esta versión no tiene archivos adjuntos.'));
      return;
    }
    assets.slice().sort(function (a, b) {
      return assetPriority(a.name) - assetPriority(b.name);
    }).forEach(function (asset, index) {
      var link = createElement('a', 'download' + (index === 0 ? ' primary' : ''));
      link.href = asset.browser_download_url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(createElement('span', 'download-name', assetLabel(asset.name)));
      link.appendChild(createElement('span', 'download-file', asset.name));
      container.appendChild(link);
    });
  }

  function buildCard(release) {
    var card = createElement('article', 'release-card');
    var head = createElement('div', 'release-head');
    head.appendChild(createElement('h3', 'release-name', release.name || release.tag_name));
    head.appendChild(createElement('span', 'release-date', formatDate(release.published_at || release.created_at)));
    card.appendChild(head);

    var downloads = createElement('div', 'downloads');
    addDownloads(downloads, release.assets);
    card.appendChild(downloads);

    var notes = document.createElement('details');
    notes.appendChild(createElement('summary', null, 'Ver notas de la versión'));
    var body = release.body && release.body.trim() ? release.body.trim() : 'Sin notas publicadas.';
    notes.appendChild(createElement('pre', 'notes', body));
    card.appendChild(notes);
    return card;
  }

  function showError(message) {
    statusEl.textContent = message;
    statusEl.classList.add('error');
    latestBadge.textContent = '—';
  }

  async function load() {
    try {
      var response = await fetch(api, {
        headers: { Accept: 'application/vnd.github+json' }
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('El repositorio público de releases todavía no existe o no es accesible.');
        }
        throw new Error('GitHub devolvió el código ' + response.status + '.');
      }
      var data = await response.json();
      var releases = data.filter(function (release) {
        return !release.draft && !release.prerelease && /^v\d+\.\d+\.\d+$/.test(release.tag_name);
      }).sort(function (a, b) {
        var left = new Date(a.published_at || a.created_at).getTime();
        var right = new Date(b.published_at || b.created_at).getTime();
        return right - left;
      });

      if (releases.length === 0) {
        showError('Aún no hay versiones estables publicadas.');
        return;
      }

      statusEl.textContent = releases.length + ' versión(es) pública(s)';
      latestBadge.textContent = releases[0].tag_name;
      var latest = buildCard(releases[0]);
      latest.classList.add('latest');
      latestCard.appendChild(latest);

      releases.forEach(function (release) {
        history.appendChild(buildCard(release));
      });
    } catch (error) {
      showError('No se pudieron cargar las descargas. ' + error.message);
    }
  }

  load();
})();
