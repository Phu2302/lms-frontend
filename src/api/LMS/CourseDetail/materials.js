import api from '../../axios';

export const createMaterialAPI = (data) => {
  return api.post('/materials', data);
};

export const deleteMaterialAPI = (id) => {
  return api.delete(`/materials/${id}`);
};
