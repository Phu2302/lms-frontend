import api from '../../axios';

export const createMaterialAPI = (data) => {
  return api.post('/materials', data);
};

export const updateMaterialAPI = (id, data) => {
  return api.put(`/materials/${id}`, data);
};

export const deleteMaterialAPI = (id) => {
  return api.delete(`/materials/${id}`);
};

export const getMaterialByIdAPI = (id) => {
  return api.get(`/materials/${id}`);
};
