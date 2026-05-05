class BaseAdapter {
  constructor() {
    this.providerName = 'base';
  }

  async call(requestData, providerConfig) {
    throw new Error('Not implemented');
  }

  getModels() {
    return [];
  }

  transformRequest(requestData) {
    return requestData;
  }

  transformResponse(response) {
    return response;
  }
}

module.exports = BaseAdapter;