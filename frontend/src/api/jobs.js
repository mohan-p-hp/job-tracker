import axios from 'axios'

export const getAllJobs = () => axios.get('/jobs')
export const getJobById = (id) => axios.get(`/jobs/${id}`)
export const addJob = (jobData) => axios.post('/jobs', jobData)
export const updateJob = (id, jobData) => axios.put(`/jobs/${id}`, jobData)
export const deleteJob = (id) => axios.delete(`/jobs/${id}`)

export const lookupRecruiters = (company, domain, applicationId) =>
  axios.get(`/lookup/recruiter?company=${encodeURIComponent(company)}&domain=${domain}&application_id=${applicationId}`)
export const sendOutreach = (data) => axios.post('/outreach/send', data)
export const getOutreachLogs = (applicationId) =>
  axios.get(`/outreach/logs?application_id=${applicationId}`)
export const markReply = (id) => axios.put(`/outreach/reply/${id}`)
