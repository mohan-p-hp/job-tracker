import axios from 'axios';

export const getAllJobs = () => axios.get('/jobs');

export const getJobById = (id) => axios.get(`/jobs/${id}`);

export const addJob = (jobData) => axios.post('/jobs', jobData);

export const updateJob = (id, jobData) => axios.put(`/jobs/${id}`, jobData);

export const deleteJob = (id) => axios.delete(`/jobs/${id}`);
