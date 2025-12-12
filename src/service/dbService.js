/* eslint-disable */
function makeMongoDbService({ model }) {
  const createDocument = async (data) => {
    try {
      return await model.create(data);
    } catch (error) {
      throw error;
    }
  }

  const bulkInsert = async (data) => {
    try {
      return await model.insertMany(data);
    } catch (error) {
      throw error;
    }
  }

  const updateDocumentById = async (id, data) => {
    try {
      return await model.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      throw error;
    }
  }

  const findOneAndUpdateDocument = async (filter, data, options = {}) => {
    try {
      return await model.findOneAndUpdate(filter, data, options);
    } catch (error) {
      throw error;
    }
  }

  const updateDocumentByQuery = async (filter, data) => {
    try {
      return await model.updateMany(filter, data);
    } catch (error) {
      throw error;
    }
  }

  const deleteDocumentById = async (id) => {
    try {
      return await model.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  const findOneAndDeleteDocument = async (filter, options = {}) => {
    try {
      return await model.findOneAndDelete(filter, options);
    } catch (error) {
      throw error;
    }
  }

  const deleteDocumentByQuery = async (query) => {
    try {
      return await model.deleteMany(query);
    } catch (error) {
      throw error;
    }
  }

  const getCountDocument = async (where) => {
    try {
      return await model.countDocuments(where);
    } catch (error) {
      throw error;
    }
  }

  const getDocumentById = async (id, select = []) => {
    try {
      return await model.findById(id).select(select);
    } catch (error) {
      throw error;
    }
  }

  const getDocumentByIdPopulate = async (id, select = [], population = []) => {
    try {
      return await model.findById(id).select(select).populate(population);
    } catch (error) {
      throw error;
    }
  }

  const getSingleDocumentByQuery = async (where, select = []) => {
    try {
      return await model.findOne(where).select(select);
    } catch (error) {
      throw error;
    }
  }

  const getSingleDocumentByQueryPopulate = async (where, select = [], population = []) => {
    try {
      return await model.findOne(where).select(select).populate(population);
    } catch (error) {
      throw error;
    }
  }

  const getDocumentByQuery = async (where, select = [], sort = {}, pageNumber, pageSize) => {
    try {
      if (!pageNumber && !pageSize) {
        return await model.find(where).select(select).sort(sort);
      } else {
        return await model.find(where).select(select).sort(sort).skip((parseInt(pageNumber) - 1) * parseInt(pageSize)).limit(parseInt(pageSize));
      }
    } catch (error) {
      throw error;
    }
  }

  const getDocumentByQueryPopulate = async (where, select = [], population = [], sort = {}, pageNumber, pageSize) => {
    try {
      if (!pageNumber && !pageSize) {
        return await model.find(where).select(select).sort(sort).populate(population);
      } else {
        return await model.find(where).select(select).sort(sort).skip((parseInt(pageNumber) - 1) * parseInt(pageSize)).limit(parseInt(pageSize)).populate(population);
      }
    } catch (error) {
      throw error;
    }
  }

  const getDocumentByAggregation = async (array) => {
    try {
      return await model.aggregate(array);
    } catch (error) {
      throw error;
    }
  }

  return Object.freeze({
    createDocument,
    bulkInsert,
    updateDocumentById,
    findOneAndUpdateDocument,
    updateDocumentByQuery,
    deleteDocumentById,
    findOneAndDeleteDocument,
    deleteDocumentByQuery,
    getCountDocument,
    getDocumentById,
    getDocumentByIdPopulate,
    getSingleDocumentByQuery,
    getSingleDocumentByQueryPopulate,
    getDocumentByQuery,
    getDocumentByQueryPopulate,
    getDocumentByAggregation,
  });
}

module.exports = makeMongoDbService;