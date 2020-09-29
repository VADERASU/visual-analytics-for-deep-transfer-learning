from flask_restful import Resource


class MatrixViewEdgeStat(Resource):

    def __init__(self, init_stat, edge_stat):
        self.init_stat = init_stat
        self.matrix_view_edge_stat = edge_stat

    def get(self, case_name, class_i):
        print(case_name)
        print(class_i)

        return self.matrix_view_edge_stat[int(class_i)], 200
