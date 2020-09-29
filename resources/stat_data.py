from flask_restful import Resource


class StatData(Resource):

    def __init__(self, init_stat):
        self.init_stat = init_stat

    def get(self, case_name):
        print(case_name)
        return {
            'modelStat': self.init_stat
        }
