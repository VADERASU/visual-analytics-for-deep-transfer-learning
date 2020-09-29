from flask_restful import Resource
from flask import request
import numpy as np
from sklearn.preprocessing import normalize, minmax_scale
from sklearn.svm import SVC
from sklearn.decomposition import PCA

from modules.constants import DEFAULT_TOP_K

class FeatureImportance(Resource):

    def __init__(self, init_stat, feature_importance):
        self.stat = init_stat
        self.feature_importance = feature_importance

    def post(self, case_name):

        filter_settings = request.get_json(force=True)

        print(filter_settings)

        # parsing settings
        selected_class = filter_settings['selectedClass']
        model_type = filter_settings['modelType']
        best_or_worst = filter_settings['bw']
        selected_neurons = filter_settings['selectedFeatures']

        projections, proj_matrix = self._compute_projection(
            selected_class,
            best_or_worst,
            model_type,
            selected_neurons
        )

        print(proj_matrix)

        return {'initProj': projections, 'projMatrix': proj_matrix}, 201

    def get(self, case_name):
        # filter_settings = request.get_json(force=True)
        args = request.args

        selected_class = int(args['class'])
        best_or_worst = args['bestAllOrWorstAll']
        model_type = args['modelType']

        print(args)
        print(selected_class)
        print(best_or_worst)

        # get the root data of the specific class
        class_data = self.feature_importance[selected_class]

        # project the top-10 most important features
        (projections, proj_matrix) = self._compute_projection(
            selected_class,
            best_or_worst,
            model_type,
            list(range(DEFAULT_TOP_K))
        )

        # assemble the json
        return {
            'featureImportance': class_data,
            'defaultTopK': DEFAULT_TOP_K,
            'initProj': projections,
            'projMatrix': proj_matrix
        }, 200

    def _compute_projection(self, selected_class, best_or_worst, selected_model, selected_feature_indices):
        neuron_data = self.feature_importance[selected_class][selected_model]['best_all']

        if best_or_worst == 'worst_all':
            neuron_data = list(reversed(neuron_data))

        domain_labels = self.feature_importance[selected_class]['domain_labels']

        # retrieve the corresponding X values
        selected_neurons = [neuron_data[i] for i in selected_feature_indices]
        X_selected = minmax_scale(
            np.array([neuron['X'] for neuron in selected_neurons]).T,
            feature_range=[-1, 1]
        )

        # re-train an SVM to split them
        svm = SVC(kernel='linear', C=100)
        svm.fit(X_selected, domain_labels)

        # get the projection matrix
        normal = svm.coef_[0].copy()
        normal = normal / np.linalg.norm(normal)  # to unit vector

        pca = PCA(n_components=1)
        pca.fit(X_selected)

        # gram-schmidt, Q is a projection matrix of [NUM_DATA, 2]
        Q, R = np.linalg.qr(
            np.vstack(
                (normal, pca.components_[0])
            ).T
        )

        proj = X_selected.dot(Q)

        return proj, Q
