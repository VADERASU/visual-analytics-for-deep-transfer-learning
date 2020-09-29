import json
import pickle
from modules.constants import *

STAT_PATH = 'assets/statjson/'


def load_data(dataset):
    res = {}

    if dataset == SVHN_MNIST_CASE:
        return load_stats_and_pickles(
            SVHN_MNIST_STATJSON,
            SVHN_MNIST_ACTIVATIONS,
            SVHN_MNIST_IMAGE_FOLDER,
            SVHN_MNIST_FEATURE_IMPORTANCE,
            SVHN_MNIST_EDGE_STAT
        )

    elif dataset == OFFICE31_CASE:
        return load_stats_and_pickles(
            OFFICE31_STATJSON,
            OFFICE31_ACTIVATIONS,
            # OFFICE31_TSNE_ALL_ARRAY,
            OFFICE31_IMAGE_FOLDER,
            OFFICE31_FEATURE_IMPORTANCE,
            OFFICE31_EDGE_STAT
        )


def load_stats_and_pickles(
        statjson_path,
        activation_path,
        # tsne_all_path,
        image_path,
        feature_json_path,
        edge_stat_path
):
    print(statjson_path)
    print(activation_path)
    print(image_path)

    with open(statjson_path, 'r') as fin:
        stats = json.load(fin)

    with open(activation_path, 'rb') as fin:
        activations = pickle.load(fin)

    # tsne_all = np.load(tsne_all_path)

    with open(feature_json_path, 'rb') as fin:
        feature_json = pickle.load(fin)

    with open(edge_stat_path, 'r') as fin:
        edge_stat_json = json.load(fin)

    # return stats, activations, tsne_all, image_path, feature_json, edge_stat_json
    return stats, activations, image_path, feature_json, edge_stat_json
