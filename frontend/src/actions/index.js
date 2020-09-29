import {
    LOAD_INIT_DATA_FAILURE,
    LOAD_INIT_DATA_SUCCESS,
    LOAD_PROJECTION_DATA_SUCCESS,
    LOAD_PROJECTION_DATA_FAILURE,
    CHANGE_SELECTED_MATRIX_CELL,
    CHANGE_SELECTED_CLASS_IN_MATRIX_VIEW,
    CHANGE_SELECTED_CLASS_AND_LOAD_EDGE_STAT_IN_MATRIX_VIEW_SUCCESS,
    CHANGE_SELECTED_CLASS_AND_LOAD_EDGE_STAT_IN_MATRIX_VIEW_FAILURE,
    CHANGE_SELECTED_LAYERS_IN_MATRIX_VIEW,
    CHANGE_SELECTED_NEURON,
    CHANGE_INSTANCE_VIEW_CLASSES,
    CHANGE_HIGHLIGHTED_INSTANCE,
    INIT_FEATURE_IMPORTANCE_FAILURE,
    INIT_FEATURE_IMPORTANCE_SUCCESS,
    CHANGE_BEST_ALL_OR_WORST_ALL,
    CHANGE_FEATURE_MODEL_TYPE, CHANGE_TOGGLED_FEATURES, LOAD_FEATURE_PROJECTION_SUCCESS, LOAD_FEATURE_PROJECTION_FAILURE
} from "../constants/actiontypes";
import {CASE_NAME, REQUEST_HEADER} from "../constants/backend";


/**
 * Initialize the global model statistics data (called when start)
 * @param payload
 * @returns {function(*): Promise<any>}
 */
export const loadInitData = (payload) => {

    return dispatch => fetch(`/${CASE_NAME}/initdata/`, {
            method: 'GET'
        }
    )
        .then(res => res.json())
        .then(
            data => dispatch({
                type: LOAD_INIT_DATA_SUCCESS, data
            }),
            err => dispatch({
                type: LOAD_INIT_DATA_FAILURE, err
            })
        );
};


export const loadProjection = (projectionFilters) => {
    return dispatch => fetch(
        `/${CASE_NAME}/projection/`, {
            method: 'POST',
            headers: REQUEST_HEADER,
            body: JSON.stringify(projectionFilters)
        }
    )
        .then(res => res.json())
        .then(
            data => dispatch({
                type: LOAD_PROJECTION_DATA_SUCCESS,
                data: {
                    backend: data,
                    selectedClasses: projectionFilters.classes
                }
            }),
            err => dispatch({
                type: LOAD_PROJECTION_DATA_FAILURE, err
            })
        )
};


/**
 * Instance View Interactions
 */
export const changeInstanceViewHighlightedInstance = (instance) => {
    return {
        type: CHANGE_HIGHLIGHTED_INSTANCE,
        instance
    }
};

// export const changeInstanceViewClasses = (classes) => {
//     return {
//         type: CHANGE_INSTANCE_VIEW_CLASSES,
//         classes
//     }
// };

/**
 * Change attributes in the Matrix View
 */

export const changeMatrixViewSelectedClass = (classIdx) => {
    return {
        type: CHANGE_SELECTED_CLASS_IN_MATRIX_VIEW,
        classIdx
    }
};

export const changeSelectedClassAndLoadEdgeStat = (classIdx) => {
    return dispatch => fetch(`/${CASE_NAME}/edgestat/${classIdx}/`, {
            method: 'GET',
            headers: REQUEST_HEADER
        }
    )
        .then(res => res.json())
        .then(
            data => dispatch({
                type: CHANGE_SELECTED_CLASS_AND_LOAD_EDGE_STAT_IN_MATRIX_VIEW_SUCCESS,
                classIdx,
                data
            }),
            err => dispatch({
                type: CHANGE_SELECTED_CLASS_AND_LOAD_EDGE_STAT_IN_MATRIX_VIEW_FAILURE,
                err
            })
        )
};

export const changeMatrixViewSelectedLayers = (layers) => {
    return {
        type: CHANGE_SELECTED_LAYERS_IN_MATRIX_VIEW,
        layers
    }
};


export const changeSelectedMatrixCell = (cellData) => {
    return {
        type: CHANGE_SELECTED_MATRIX_CELL,
        cellData
    };
};

export const changeSelectedNeuron = (neuronData) => {
    return {
        type: CHANGE_SELECTED_NEURON,
        neuronData
    }
};

/**
 * Feature View
 */
export const initFeatureImpotance = (classIdx, bestAllOrWorstAll, modelType) => {

    // create the URL
    const searchParam = new URLSearchParams({
        'class': classIdx,
        bestAllOrWorstAll,
        modelType
    }).toString();

    return dispatch => fetch(`/${CASE_NAME}/feature/?${searchParam}`, {
            method: 'GET',
            headers: REQUEST_HEADER
        }
    )
        .then(res => res.json())
        .then(
            data => dispatch({
                type: INIT_FEATURE_IMPORTANCE_SUCCESS,
                data
            }),
            err => dispatch({
                type: INIT_FEATURE_IMPORTANCE_FAILURE, err
            })
        )
};

export const loadFeatureProjection = (selectedClass, modelType, bw, selectedFeatures) => {
    return dispatch => fetch(`/${CASE_NAME}/feature/`, {
            method: 'POST',
            headers: REQUEST_HEADER,
            body: JSON.stringify({
                selectedClass, modelType, bw,
                selectedFeatures: [...selectedFeatures].sort() // expand the set
            })
        }
    )
        .then(res => res.json())
        .then(
            data => dispatch({
                type: LOAD_FEATURE_PROJECTION_SUCCESS,
                data
            }),
            err => dispatch({
                type: LOAD_FEATURE_PROJECTION_FAILURE, err
            })
        )
};

export const changeBestAllOrWorstAll = (bw) => {
    return {
        type: CHANGE_BEST_ALL_OR_WORST_ALL,
        bw
    };
};

export const changeFeatureModelType = (modelType) => {
    return {
        type: CHANGE_FEATURE_MODEL_TYPE,
        modelType
    }
};

export const changeToggledFeatures = (checked, idx, bw) => {
    return {
        type: CHANGE_TOGGLED_FEATURES,
        checked, idx, bw
    }
}