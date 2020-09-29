def reformat_activation(a):
    return a[0] if len(a.shape) == 2 and a.shape[0] == 1 else a