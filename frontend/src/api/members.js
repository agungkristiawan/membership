import client from './client'
import { mockMembers } from './mockData'

const MOCK = false // set to false when backend is ready

const paginate = (items, page = 1, perPage = 25) => {
  const start = (page - 1) * perPage
  const data = items.slice(start, start + perPage)
  return { data, pagination: { page, per_page: perPage, total: items.length, total_pages: Math.ceil(items.length / perPage) } }
}

export const getMembers = (params = {}) => {
  if (MOCK) {
    let results = [...mockMembers]
    if (params.search) {
      const q = params.search.toLowerCase()
      results = results.filter((m) => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
    }
    if (params.status) results = results.filter((m) => m.status === params.status)
    return Promise.resolve({ data: paginate(results, params.page) })
  }
  return client.get('/members', { params })
}

export const getMember = (id) => {
  if (MOCK) {
    const member = mockMembers.find((m) => m.id === id)
    return member ? Promise.resolve({ data: member }) : Promise.reject({ response: { status: 404 } })
  }
  return client.get(`/members/${id}`)
}

export const updateMember = (id, data) => {
  if (MOCK) {
    const idx = mockMembers.findIndex((m) => m.id === id)
    if (idx !== -1) Object.assign(mockMembers[idx], data)
    return Promise.resolve({ data: { message: 'Member updated successfully' } })
  }
  return client.put(`/members/${id}`, data)
}

export const deleteMember = (id) => {
  if (MOCK) return Promise.resolve({ data: { message: 'Member removed successfully' } })
  return client.delete(`/members/${id}`)
}

export const uploadPhoto = (id, file) => {
  if (MOCK) return Promise.resolve({ data: { message: 'Photo uploaded successfully', photo_url: URL.createObjectURL(file) } })
  const form = new FormData()
  form.append('photo', file)
  return client.post(`/members/${id}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const updateRole = (id, role) => {
  if (MOCK) return Promise.resolve({ data: { message: 'Role updated successfully' } })
  return client.put(`/members/${id}/role`, { role })
}
