from flask_restful import Resource
from flask import request
import numpy as np
from itertools import chain
from uuid import uuid4
# from MulticoreTSNE import MulticoreTSNE as TSNE
from sklearn.manifold import TSNE as TSNE

from resources.utils import reformat_activation
from modules.constants import TSNE_PERPLEXITY, TSNE_LR, TSNE_N_JOBS


class Projection(Resource):

    def __init__(self, init_stat, activations):
        self.stat = init_stat
        self.activations = activations

    def post(self, case_name):

        filter_settings = request.get_json(force=True)

        print(filter_settings)

        temp_uuid = str(uuid4())

        # parsing settings
        enabled_classes = set(filter_settings['classes'])
        should_recompute = filter_settings['shouldRecompute']
        use_partial_tsne = filter_settings['usePartialTSNE']
        embedding_layer_idx = filter_settings['layerIdx']

        # retrieve data
        target_model_source_data = self.activations['target_model_source_data']
        target_model_target_data = self.activations['target_model_target_data']

        source_activations = target_model_source_data['activations']
        target_activations = target_model_target_data['activations']
        source_data_label = target_model_source_data['labels']
        target_data_label = target_model_target_data['labels']
        source_preds = target_model_source_data['predictions']
        target_preds = target_model_target_data['predictions']
        len_source = len(source_activations)

        all_classes = list(range(len(self.stat['datasets']['target']['train']['classNames'])))

        if enabled_classes is None or len(enabled_classes) == 0:
            enabled_classes = set(all_classes)

        if use_partial_tsne:  # filter train first, project next

            X = []  # embedding for projection
            res = []

            for i, (activation, label, pred) in enumerate(
                    zip(
                        chain(source_activations, target_activations),
                        chain(source_data_label, target_data_label),
                        chain(source_preds, target_preds)
                    )
            ):
                if label in enabled_classes:
                    X.append(reformat_activation(activation[embedding_layer_idx]))

                    res.append({
                        'coord': None,
                        'idx': i if i < len_source else i - len_source,
                        'inSourceOrTarget': 'source' if i < len_source else 'target',
                        'label': label,
                        'pred': pred
                    })

            # compute the new projection

            coords = tsne_helper(np.array(X))

            # re-fill the coord part
            for item, coord in zip(res, coords):
                item['coord'] = coord

            return {'uuid': temp_uuid, 'projections': res}, 201

def tsne_helper(X):
    print(X.shape)

    return TSNE(
        n_components=2,
        perplexity=TSNE_PERPLEXITY,
#         "n_jobs" new in version 0.22.
#         https://scikit-learn.org/stable/modules/generated/sklearn.manifold.TSNE.html#examples-using-sklearn-manifold-tsne
#         learning_rate=TSNE_LR, n_jobs=TSNE_N_JOBS
        learning_rate=TSNE_LR
    ).fit_transform(X)
