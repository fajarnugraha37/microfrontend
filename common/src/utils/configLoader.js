/**
 * Loads config.json from public/assets and returns a promise with the config object
 * @returns {Promise<Object>}
 */
export default async function loadConfig() {
    const res = await fetch('/assets/config.json');
    return await res.json();
}
