export const CASE_NAME = 'office';
export const REQUEST_HEADER = {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'no-cors'
};

export const getImageURL = (domainName, fileName) => `/${domainName}/${fileName}`;
export const getNeuronImageURL = (domain, layerIdx, filterIdx) =>
    `/featurevis/${domain}/l${layerIdx}_f${filterIdx}.jpg`;
export const getWeightImageURL = (domain, fromLayer, toLayer, fromNeuron, toNeuron) =>
    `/weightvis/${domain}/l${fromLayer}_l${toLayer}_${fromNeuron}_${toNeuron}.png`

/**
 * Unified with the backend key names
 * @type {string}
 */
export const BEST_ALL = 'best_all';
export const WORST_ALL = 'worst_all';
export const SOURCE_MODEL = 'source_model';
export const TARGET_MODEL = 'target_model';