// SponsorBlock example extension for Ribari.
// Inspired by the open source SponsorBlock project created by Ajay Ramachandran and contributors.
// This file shows how a browser extension settings UI can be ported into a Ribari tile.

const STORAGE_KEYS = {
    enabled: 'enabled',
    categories: 'categories',
    autoSkip: 'autoSkip',
    notifications: 'notifications',
};

const DEFAULT_CATEGORY_SELECTION = 'sponsor';

// Category metadata is rendered into the tile UI at startup.
const categories = [
    { id: 'sponsor', name: 'Sponsor', desc: 'Paid promotion, paid referrals, and direct advertisements' },
    { id: 'intro', name: 'Intermission/Intro', desc: 'Intro animation, pause, or static frame' },
    { id: 'outro', name: 'Endcards/Credits', desc: 'Credits or when the YouTube endcards appear' },
    { id: 'interaction', name: 'Interaction Reminder', desc: '"Subscribe", "Like", "Follow on social media", etc.' },
    { id: 'selfpromo', name: 'Unpaid/Self Promotion', desc: 'Promoting own product, website, or merch' },
    { id: 'music_offtopic', name: 'Music: Non-Music', desc: 'Only for use in music videos' },
    { id: 'preview', name: 'Preview/Recap', desc: 'Collection of clips showing what is coming up or what happened' },
    { id: 'filler', name: 'Filler Tangent', desc: 'Tangential scenes added only for filler or humor' },
];

// Build the settings UI for segment categories.
const categoriesSection = document.getElementById('categoriesSection');
categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'checkbox-item';
    item.innerHTML = `<label><input type="checkbox" data-category="${cat.id}"> ${cat.name}</label>`;
    categoriesSection.appendChild(item);

    const desc = document.createElement('div');
    desc.className = 'checkbox-desc';
    desc.textContent = cat.desc;
    categoriesSection.appendChild(desc);
});

// Tile controls.
const enableToggle = document.getElementById('enableToggle');
const autoSkip = document.getElementById('autoSkip');
const notifications = document.getElementById('notifications');

// Load persisted settings from shared extension storage.
async function loadSettings() {
    try {
        const enabled = await ribari.storage.get(STORAGE_KEYS.enabled);
        const cats = await ribari.storage.get(STORAGE_KEYS.categories);
        const autoSkipVal = await ribari.storage.get(STORAGE_KEYS.autoSkip);
        const notifVal = await ribari.storage.get(STORAGE_KEYS.notifications);

        enableToggle.checked = (enabled === 'true' || enabled === '1');
        autoSkip.checked = (autoSkipVal !== 'false' && autoSkipVal !== '0');
        notifications.checked = (notifVal !== 'false' && notifVal !== '0');

        const enabledCats = (cats || DEFAULT_CATEGORY_SELECTION).split(',').map(s => s.trim());
        document.querySelectorAll('[data-category]').forEach(cb => {
            cb.checked = enabledCats.includes(cb.dataset.category);
        });

        updateDisabledState(enableToggle.checked);
    } catch (e) {
        ribari.showToast('Failed to load settings: ' + e.message, 'error');
    }
}

function updateDisabledState(enabled) {
    const sections = [
        document.getElementById('categoriesSection'),
        document.getElementById('behaviorSection'),
    ];
    sections.forEach(el => {
        if (enabled) {
            el.classList.remove('disabled-section');
        } else {
            el.classList.add('disabled-section');
        }
    });
}

// Persist the top-level enabled flag and update the rest of the tile UI.
enableToggle.addEventListener('change', async () => {
    const enabled = enableToggle.checked;
    await ribari.storage.set(STORAGE_KEYS.enabled, String(enabled)).catch(e => {
        ribari.showToast('Failed to save setting: ' + e.message, 'error');
    });
    updateDisabledState(enabled);
    ribari.showToast(enabled ? 'SponsorBlock enabled — takes effect on next YouTube page load' : 'SponsorBlock disabled — takes effect on next YouTube page load');
});

// Keep category selection in shared storage for the YouTube content script.
categoriesSection.addEventListener('change', async () => {
    const checked = [];
    document.querySelectorAll('[data-category]:checked').forEach(cb => {
        checked.push(cb.dataset.category);
    });
    await ribari.storage.set(STORAGE_KEYS.categories, checked.join(',')).catch(e => {
        ribari.showToast('Failed to save categories: ' + e.message, 'error');
    });
});

autoSkip.addEventListener('change', async () => {
    await ribari.storage.set(STORAGE_KEYS.autoSkip, String(autoSkip.checked)).catch(e => {
        ribari.showToast('Failed to save setting: ' + e.message, 'error');
    });
});

notifications.addEventListener('change', async () => {
    await ribari.storage.set(STORAGE_KEYS.notifications, String(notifications.checked)).catch(e => {
        ribari.showToast('Failed to save setting: ' + e.message, 'error');
    });
});

// These links intentionally open in regular web tiles.
document.getElementById('projectLink').addEventListener('click', () => {
    ribari.openURL('https://sponsor.ajay.app/');
});

document.getElementById('sourceLink').addEventListener('click', () => {
    ribari.openURL('https://github.com/ajayyy/SponsorBlock');
});

// Initialize the tile from persisted state.
loadSettings();
