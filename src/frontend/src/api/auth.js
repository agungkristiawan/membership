import client from './client'

export const login = (data) => client.post('/auth/login', data)
export const logout = (data) => client.post('/auth/logout', data)
export const refreshToken = (data) => client.post('/auth/refresh', data)
export const forgotPassword = (data) => client.post('/auth/password-reset/request', data)
export const resetPassword = (data) => client.post('/auth/password-reset/confirm', data)
export const changePassword = (data) => client.post('/auth/password-change', data)
