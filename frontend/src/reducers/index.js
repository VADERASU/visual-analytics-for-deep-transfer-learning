/**
 * Main reducer
 */

import {
    LOAD_PROJECTION_DATA_SUCCESS,
    LOAD_PROJECTION_DATA_FAILURE,
    LOAD_INIT_DATA_FAILURE,
    LOAD_INIT_DATA_SUCCESS,
    CHANGE_SELECTED_MATRIX_CELL,
    CHANGE_SELECTED_NEURON,
    CHANGE_HIGHLIGHTED_INSTANCE,
    CHANGE_SELECTED_CLASS_IN_MATRIX_VIEW,
    CHANGE_SELECTED_LAYERS_IN_MATRIX_VIEW,
    INIT_FEATURE_IMPORTANCE_SUCCESS,
    CHANGE_BEST_ALL_OR_WORST_ALL,
    CHANGE_FEATURE_MODEL_TYPE,
    CHANGE_TOGGLED_FEATURES,
    LOAD_FEATURE_PROJECTION_FAILURE,
    LOAD_FEATURE_PROJECTION_SUCCESS,
    CHANGE_SELECTED_CLASS_AND_LOAD_EDGE_STAT_IN_MATRIX_VIEW_SUCCESS
} from '../constants/actiontypes';
import {RESOLUTION_HEIGHT, UPPER_HEIGHT, PADDING} from "../constants/viewsizes";
import {BEST_ALL, WORST_ALL, SOURCE_MODEL, TARGET_MODEL} from "../constants/backend";


const initialState = {
    /**
     * Data section
     */
    isInitDataFetched: false,
    modelStat: null,

    /**
     * Component Sizes
     */
    upperHeight: UPPER_HEIGHT,
    lowerHeight: RESOLUTION_HEIGHT - PADDING * 3 - UPPER_HEIGHT,  // WINDOW_HEIGHT - top padding - upperHeight - upper-lower gap - bottom padding

    /**
     * Data for Instance View
     */
    instanceViewHighlightedInstance: null,
    instanceViewProjection: null,
    instanceViewSelectedClasses: [],

    /**
     * Data for Matrix View
     */
    matrixViewSelectedClass: null,
    matrixViewSelectedLayers: [],
    matrixViewSelectedNeuron: null,
    matrixViewSelectedMatrixCell: null,
    matrixViewEdgeStat: {},

    /**
     * Data for Feature View
     */
    featureImportance: null,
    defaultTopK: null,
    initProj: null,
    projMatrix: null,
    bestAllOrWorstAll: BEST_ALL,
    featureModelType: TARGET_MODEL,
    toggledFeaturesForBestAll: new Set(),
    toggledFeaturesForWorstAll: new Set()
};

const rootReducer = (state = initialState, action) => {

    /**
     * Global data initialization handler
     */
    if (action.type === LOAD_INIT_DATA_SUCCESS) {
        return Object.assign({}, state, {
            modelStat: action.data.modelStat,
            isInitDataFetched: true
        })
    }

    if (action.type === LOAD_INIT_DATA_FAILURE) {
        alert(action.err);
        return Object.assign({}, state, {
            err: action.err
        })
    }

    /**
     * Projection request handler
     */
    if (action.type === LOAD_PROJECTION_DATA_SUCCESS) {
        return Object.assign({}, state, {
            instanceViewProjection: action.data.backend,
            instanceViewSelectedClasses: action.data.selectedClasses
        });
    }

    if (action.type === LOAD_PROJECTION_DATA_FAILURE) {
        alert(action.err);
        return Object.assign({}, state, {
            err: action.err
        });
    }

    /**
     * Instance View highlighting
     */
    if (action.type === CHANGE_HIGHLIGHTED_INSTANCE) {
        return Object.assign({}, state, {
            instanceViewHighlightedInstance: action.instance
        });
    }

    /**
     * Matrix View Interactions
     */
    if (action.type === CHANGE_SELECTED_CLASS_IN_MATRIX_VIEW) {
        return Object.assign({}, state, {
            matrixViewSelectedClass: action.classIdx
        });
    }

    if (action.type === CHANGE_SELECTED_CLASS_AND_LOAD_EDGE_STAT_IN_MATRIX_VIEW_SUCCESS) {
        let additionalEdgeStat = {};
        additionalEdgeStat[action.classIdx] = action.data;

        return Object.assign({}, state, {
            matrixViewSelectedClass: action.classIdx,
            matrixViewEdgeStat: Object.assign({}, state.matrixViewEdgeStat, additionalEdgeStat)
        });
    }

    if (action.type === CHANGE_SELECTED_LAYERS_IN_MATRIX_VIEW) {
        return Object.assign({}, state, {
            matrixViewSelectedLayers: action.layers
        });
    }

    if (action.type === CHANGE_SELECTED_MATRIX_CELL) {
        return Object.assign({}, state, {
            matrixViewSelectedMatrixCell: action.cellData
        })
    }

    if (action.type === CHANGE_SELECTED_NEURON) {
        return Object.assign({}, state, {
            matrixViewSelectedNeuron: action.neuronData
        })
    }

    /**
     * Feature View Interactions
     */
    if (action.type === INIT_FEATURE_IMPORTANCE_SUCCESS) {
        return Object.assign({}, state, action.data, {
            toggledFeaturesForBestAll: new Set([...Array(action.data.defaultTopK).keys()]),
            toggledFeaturesForWorstAll: new Set([...Array(action.data.defaultTopK).keys()])
        })
    }

    if (action.type === CHANGE_BEST_ALL_OR_WORST_ALL) {
        return Object.assign({}, state, {
            bestAllOrWorstAll: action.bw
        })
    }

    if (action.type === CHANGE_FEATURE_MODEL_TYPE) {
        return Object.assign({}, state, {
            featureModelType: action.modelType
        });
    }

    if (action.type === CHANGE_TOGGLED_FEATURES) {
        if (action.bw === BEST_ALL) {
            // create the new set
            let toggledFeatures = state.toggledFeaturesForBestAll;

            if (action.checked) {
                toggledFeatures.add(action.idx);
            } else {
                toggledFeatures.delete(action.idx);
            }

            return Object.assign({}, state, {
                toggledFeaturesForBestAll: toggledFeatures
            })
        } else if (action.bw === WORST_ALL) {
            // create the new set
            let toggledFeatures = state.toggledFeaturesForWorstAll;

            if (action.checked) {
                toggledFeatures.add(action.idx);
            } else {
                toggledFeatures.delete(action.idx);
            }

            return Object.assign({}, state, {
                toggledFeaturesForWorstAll: toggledFeatures
            })
        }
    }

    if (action.type === LOAD_FEATURE_PROJECTION_SUCCESS) {
        return Object.assign({}, state, {
            initProj: action.data.initProj,
            projMatrix: action.data.projMatrix
        });
    }

    if (action.type === LOAD_FEATURE_PROJECTION_FAILURE) {
        alert(action.err);
        return Object.assign({}, state, {
            err: action.err
        });
    }

    return state;
};

export default rootReducer;