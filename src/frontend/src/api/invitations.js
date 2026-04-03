import client from './client'

export const generateInvitation = (data) => client.post('/invitations', data)
export const validateInvitation = (token) => client.get(`/invitations/${token}/validate`)
export const registerViaInvitation = (token, data) => client.post(`/invitations/${token}/register`, data)
