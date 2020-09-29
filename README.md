# visual-analytics-for-deep-transfer-learning
This repository contains the code for the paper "A Visual Analytics Framework for Explaining and Diagnosing Transfer Learning Processes".

[Arxiv Link](https://arxiv.org/abs/2009.06876)

Abstract: Many statistical learning models hold an assumption that the training data and the future unlabeled data are drawn from the same distribution. However, this assumption is difficult to fulfill in real-world scenarios and creates barriers in reusing existing labels from similar application domains. Transfer Learning is intended to relax this assumption by modeling relationships between domains, and is often applied in deep learning applications to reduce the demand for labeled data and training time. Despite recent advances in exploring deep learning models with visual analytics tools, little work has explored the issue of explaining and diagnosing the knowledge transfer process between deep learning models. In this paper, we present a visual analytics framework for the multi-level exploration of the transfer learning processes when training deep neural networks. Our framework establishes a multi-aspect design to explain how the learned knowledge from the existing model is transferred into the new learning task when training deep neural networks. Based on a comprehensive requirement and task analysis, we employ descriptive visualization with performance measures and detailed inspections of model behaviors from the statistical, instance, feature, and model structure levels. We demonstrate our framework through two case studies on image classification by fine-tuning AlexNets to illustrate how analysts can utilize our framework.

### Installation
The system consists of two parts: the backend server, and the frontend web interface.

#### Prerequisites
Python 3.7+

Node 6.4+

yarn 1.22.* (version 2+ not tested)

Google Chrome Browser (Firefox or other modern browsers should work as well)

#### Data Folder
Please download [office.zip](http://vader.lab.asu.edu/docs/publications/pdf/2020/office.zip) and unzip it in `assets/`. The folder structure should be like:

```
assets
|- office
|  |- datasets/
|  |- edge_stat.json
|  |- feature_importance.pkl
|  |- model_stat_office_fixed.json
|  |- Office31_actis.pkl
```

#### Setup the Backend
Install the dependencies for the Python backend:
```shell script
$ pip install -r requirements.txt
```

Start the server:
```shell script
$ python3.7 app.py
```
The server runs at http://localhost:5000. Please keep it running while using the frontend interface.

#### Setup the Frontend

Install yarn:
```shell script
$ npm -g install yarn
```

Install the dependencies with `yarn`:
```shell script
$ cd frontend
$ yarn
```

Start the frontend:
```shell script
$ yarn start
```

It starts a node development server at http://localhost:3000 by default. Please access it in a web browser to view the interface.

Note: the proxy setting in ```frontend/package.json``` is enabled to redirect the requests to the Python backend server, which is http://localhost:5000 by default.
