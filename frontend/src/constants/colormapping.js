export const QUALITATIVE_COLORS = [
    '#fdbd5d',
    '#bebada',
    '#bc80bd',
    '#fb8072',
    '#8dd3c7',
    '#b3de69',
    '#fccde5',
    // '#80b1d3',
    '#bc80bd',
    // '#d9d9d9',
    '#ccebc5',
    '#ffed6f',
    '#ffffb3'
];

export const OTHER_CLASS_COLOR = '#d9d9d9';

export const SIMILARITY_MAX_COLOR = '#bac0cb';  // rgb(181,109,203)
// export const EDGE_MATRIX_MAX_COLOR = '#b5bdcb';
export const EDGE_MATRIX_CELL_SRC_CORRESPOND_COLOR = '#bc80bd';

// Source and target markers
// export const SOURCE_COLOR_NORMAL = "#f4a582";
export const SOURCE_COLOR_NORMAL = "#f4b6b2";
export const TARGET_COLOR_NORMAL = "#92c5de";
export const SOURCE_COLOR_DARK = "#d6604d";
export const TARGET_COLOR_DARK = "#4393c3";

export const IMPORTANCE_COLOR = [SOURCE_COLOR_NORMAL, '#ffffff'];

export const ANT_DESIGN_COLOR = '#1890FF';

export const getMax = (a) => {
    return Math.max(...a.map(e => Array.isArray(e) ? getMax(e) : e));
};