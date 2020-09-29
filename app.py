#!env python3
from flask import Flask
from flask_restful import Api

from modules.backend_data_loader import load_data
from resources.stat_data import StatData
from resources.instance_view import Projection
from resources.feature_view import FeatureImportance
from resources.matrix_view_edge_stat import MatrixViewEdgeStat
from modules.constants import OFFICE31_CASE, SVHN_MNIST_CASE
from modules.np_encoder import NumpyEncoder

# necessary data files:
#

# dataset names: OFFICE31_CASE, SVHN_MNIST_CASE
init_stat, init_activations, static_folder, feature_importance, matrix_view_edge_stat = load_data(OFFICE31_CASE)
# init_stat, init_activations, static_folder, feature_importance, matrix_view_edge_stat = load_data(SVHN_MNIST_CASE)

# static images can be accessed by static/{domain_name}/{class_name}/filename
app = Flask(__name__, static_folder=static_folder)
api = Api(app)
app.config['RESTFUL_JSON'] = {'cls': NumpyEncoder}

api.add_resource(StatData,
                 '/<string:case_name>/initdata/',
                 resource_class_args=(init_stat,))

api.add_resource(Projection,
                 '/<string:case_name>/projection/',
                 resource_class_args=(init_stat, init_activations))

api.add_resource(FeatureImportance,
                 '/<string:case_name>/feature/',
                 resource_class_args=(init_stat, feature_importance))

api.add_resource(MatrixViewEdgeStat,
                 '/<string:case_name>/edgestat/<string:class_i>/',
                 resource_class_args=(init_stat, matrix_view_edge_stat))

if __name__ == '__main__':
    app.run(debug=True)
