/**
 * app.js – Swinton Go! Insurance Motor Quote Demo
 * Manages per-page form data using sessionStorage, vehicle lookup,
 * and quote price calculation.
 */

// ── Storage helpers ────────────────────────────────────────────────────────
const Store = (() => {
    const PREFIX = 'sgq_';
    return {
        get(key)      { try { return JSON.parse(sessionStorage.getItem(PREFIX + key)); } catch { return null; } },
        set(key, val) { try { sessionStorage.setItem(PREFIX + key, JSON.stringify(val)); } catch {} },
        clear()       {
            const keys = Object.keys(sessionStorage).filter(k => k.startsWith(PREFIX));
            keys.forEach(k => sessionStorage.removeItem(k));
        }
    };
})();

// ── Stub address data ──────────────────────────────────────────────────────
const STUB_ADDRESSES = {
    'SW1A1AA': ['10 Downing Street, London, SW1A 1AA', '12 Downing Street, London, SW1A 1AA'],
    'SW1A2AA': ['Buckingham Palace, London, SW1A 2AA'],
    'M11AE':   ['1 Market Street, Manchester, M1 1AE', '3 Market Street, Manchester, M1 1AE', '5 Market Street, Manchester, M1 1AE'],
    'B11BB':   ['1 Corporation Street, Birmingham, B1 1BB', '2 Corporation Street, Birmingham, B1 1BB'],
    'EH11YZ':  ['1 Royal Mile, Edinburgh, EH1 1YZ', '5 Royal Mile, Edinburgh, EH1 1YZ'],
    'LS11BA':  ['Leeds City Centre, Leeds, LS1 1BA', '2 The Headrow, Leeds, LS1 1BA'],
    'BS11AA':  ['1 Broad Quay, Bristol, BS1 1AA', '3 Broad Quay, Bristol, BS1 1AA'],
    'DEFAULT': [
        '1 High Street, Anytown, AA1 1AA',
        '2 High Street, Anytown, AA1 1AA',
        '3 High Street, Anytown, AA1 1AA',
        '4 High Street, Anytown, AA1 1AA',
        '5 High Street, Anytown, AA1 1AA'
    ]
};

// ── Vehicle database (demo stub) ──────────────────────────────────────────
const VEHICLES = {
    'D500NLE': {
        make: 'Volkswagen', model: 'Golf', variant: '1.5 TSI SE 5dr',
        year: 2019, cc: 1498, fuelType: 'Petrol', transmission: 'Manual',
        doors: 5, bodyType: 'Hatchback', colour: 'Metallic Silver', value: 14250
    },
    'AB12CDE': {
        make: 'Ford', model: 'Focus', variant: '1.0 EcoBoost Titanium 5dr',
        year: 2021, cc: 999, fuelType: 'Petrol', transmission: 'Manual',
        doors: 5, bodyType: 'Hatchback', colour: 'Frozen White', value: 18500
    },
    'XY21ZZZ': {
        make: 'Toyota', model: 'Yaris', variant: '1.5 Hybrid Design 5dr',
        year: 2022, cc: 1490, fuelType: 'Hybrid', transmission: 'Automatic',
        doors: 5, bodyType: 'Hatchback', colour: 'Scarlet Flare', value: 22000
    }
};

function lookupVehicle(rawReg) {
    const reg = rawReg.replace(/\s+/g, '').toUpperCase();
    return VEHICLES[reg] || null;
}

// ── Quote price calculation ────────────────────────────────────────────────
function calculateQuote(data) {
    let base = 580;

    // Age factor
    if (data.dob) {
        const dob = new Date(data.dob);
        const age = Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000));
        if      (age < 22) base += 600;
        else if (age < 25) base += 350;
        else if (age < 30) base += 100;
        else if (age > 70) base += 120;
    }

    // Cover type
    const cover = data.coverType || 'comprehensive';
    if      (cover === 'tpft') base -= 40;
    else if (cover === 'tpo')  base -= 130;

    // NCB discount
    const ncb     = parseInt(data.ncbYears || 0, 10);
    const ncbDisc = Math.min(ncb * 0.07, 0.65);
    base = base * (1 - ncbDisc);

    // Claims
    base += (parseInt(data.claimsCount || 0, 10)) * 220;

    // Convictions
    base += (parseInt(data.convictionsCount || 0, 10)) * 175;

    // Voluntary excess credit
    const volExcess = parseInt(data.voluntaryExcess || 0, 10);
    if      (volExcess >= 500) base -= 40;
    else if (volExcess >= 250) base -= 20;

    const annual  = Math.max(Math.round(base), 200);
    const monthly = Math.round((annual * 1.13) / 12 * 100) / 100;

    return { annual, monthly };
}

// ── Form helpers ───────────────────────────────────────────────────────────
function setError(input, msg) {
    input.classList.add('form-control--error');
    const v = input.closest && input.closest('.form-row')?.querySelector('.form-row__validation-text');
    if (v) { v.textContent = msg; v.classList.add('visible'); }
}

function clearError(input) {
    input.classList.remove('form-control--error');
    const v = input.closest && input.closest('.form-row')?.querySelector('.form-row__validation-text');
    if (v) v.classList.remove('visible');
}

// ── DOM helpers ────────────────────────────────────────────────────────────
function $(sel, ctx)  { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

function autoUppercase(input) {
    input.addEventListener('input', () => { input.value = input.value.toUpperCase(); });
}

// ── Shared DOMContentLoaded init ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Mark steps done/active using new progress-nav classes
    const active = parseInt(document.body.dataset.step || '1', 10);
    const steps = $$('.progress-nav__step');
    steps.forEach(s => {
        const n = parseInt(s.dataset.step, 10);
        if (n < active) {
            s.classList.add('progress-nav__step--done');
            s.classList.remove('progress-nav__step--active');
        } else if (n === active) {
            s.classList.add('progress-nav__step--active');
        }
    });
});
